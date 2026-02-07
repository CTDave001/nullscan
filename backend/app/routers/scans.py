import ipaddress
import json
import socket
import uuid
from datetime import datetime
from urllib.parse import urlparse
import stripe
from fastapi import APIRouter, HTTPException
from app.database import database, scans, rate_limits
from app.models import (
    ScanCreate, ScanResponse, ScanResults, ScanResultFinding,
    StructuredReportResponse, ScanStatsResponse, CategoryResultResponse,
    AreaOfInterestResponse, RecommendationResponse, ConstraintResponse,
    AttackSurfaceResponse
)
from app.config import settings

stripe.api_key = settings.stripe_secret_key

PRICE_TIERS = {
    "unlock": 3900,   # $39.00 in cents - unlock report only
    "pro": 25000,     # $250.00 in cents - pro scan
    "deep": 89900,    # $899.00 in cents - deep analysis
}

TIER_RANK = {"unlock": 1, "pro": 2, "deep": 3}

router = APIRouter(prefix="/scans", tags=["scans"])

MAX_FREE_SCANS_PER_MONTH = 3


UNLIMITED_EMAILS = {e.strip().lower() for e in settings.unlimited_emails.split(",") if e.strip()}


def validate_target_url(url: str):
    """Block SSRF attempts by rejecting private/reserved IP targets."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            raise HTTPException(status_code=400, detail="Invalid target URL")

        if hostname.lower() in ("localhost", "localhost.localdomain"):
            raise HTTPException(status_code=400, detail="Private/reserved targets are not allowed")

        addrs = socket.getaddrinfo(hostname, None)
        for family, _, _, _, sockaddr in addrs:
            ip = ipaddress.ip_address(sockaddr[0])
            if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
                raise HTTPException(
                    status_code=400,
                    detail="Private/reserved targets are not allowed"
                )
    except HTTPException:
        raise
    except Exception:
        pass  # DNS resolution failure is ok — Strix will handle it


async def check_rate_limit(email: str) -> bool:
    if email.lower() in UNLIMITED_EMAILS:
        return True

    current_month = datetime.now().strftime("%Y-%m")
    query = rate_limits.select().where(rate_limits.c.email == email)
    result = await database.fetch_one(query)

    if result is None:
        await database.execute(
            rate_limits.insert().values(
                email=email, scan_count=0, month=current_month
            )
        )
        return True

    if result["month"] != current_month:
        await database.execute(
            rate_limits.update()
            .where(rate_limits.c.email == email)
            .values(scan_count=0, month=current_month)
        )
        return True

    return result["scan_count"] < MAX_FREE_SCANS_PER_MONTH


async def increment_rate_limit(email: str):
    await database.execute(
        rate_limits.update()
        .where(rate_limits.c.email == email)
        .values(scan_count=rate_limits.c.scan_count + 1)
    )


@router.post("/", response_model=ScanResponse)
async def create_scan(scan: ScanCreate):
    if not scan.consent:
        raise HTTPException(status_code=400, detail="Consent is required")

    validate_target_url(str(scan.target_url))

    if not await check_rate_limit(scan.email):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 3 free scans per month."
        )

    scan_id = str(uuid.uuid4())

    await database.execute(
        scans.insert().values(
            id=scan_id,
            email=scan.email,
            target_url=str(scan.target_url),
            status="pending",
            scan_type="quick",  # Free scans are quick, deep scans require payment
        )
    )

    await increment_rate_limit(scan.email)

    query = scans.select().where(scans.c.id == scan_id)
    result = await database.fetch_one(query)

    return ScanResponse(**dict(result))


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: str):
    query = scans.select().where(scans.c.id == scan_id)
    result = await database.fetch_one(query)

    if result is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    return ScanResponse(**dict(result))


@router.post("/{scan_id}/checkout")
async def create_checkout(scan_id: str, tier: str):
    if tier not in PRICE_TIERS:
        raise HTTPException(status_code=400, detail="Invalid tier")

    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    current_rank = TIER_RANK.get(scan["paid_tier"], 0)
    new_rank = TIER_RANK.get(tier, 0)
    if current_rank >= new_rank and scan["paid_tier"]:
        raise HTTPException(status_code=400, detail="Already at this tier or higher")

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {
                    "name": f"Security Report - {tier.title()}",
                    "description": f"Full security report for {scan['target_url']}",
                },
                "unit_amount": PRICE_TIERS[tier],
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{settings.frontend_url}/results/{scan_id}/full?success=true",
        cancel_url=f"{settings.frontend_url}/results/{scan_id}?cancelled=true",
        metadata={
            "scan_id": scan_id,
            "tier": tier,
        },
        customer_email=scan["email"],
    )

    return {"checkout_url": session.url}


@router.post("/{scan_id}/create-payment-intent")
async def create_payment_intent(scan_id: str, tier: str):
    """Create a PaymentIntent for custom checkout."""
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")

    if tier not in PRICE_TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}")

    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    current_rank = TIER_RANK.get(scan["paid_tier"], 0)
    new_rank = TIER_RANK.get(tier, 0)
    if current_rank >= new_rank and scan["paid_tier"]:
        raise HTTPException(status_code=400, detail="Already at this tier or higher")

    # Create PaymentIntent
    try:
        intent = stripe.PaymentIntent.create(
            amount=PRICE_TIERS[tier],
            currency="usd",
            metadata={
                "scan_id": scan_id,
                "tier": tier,
            },
            receipt_email=scan["email"],
            automatic_payment_methods={"enabled": True},
        )

        return {
            "client_secret": intent.client_secret,
            "amount": PRICE_TIERS[tier],
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{scan_id}/confirm-payment")
async def confirm_payment(scan_id: str, payment_intent_id: str, tier: str):
    """Confirm payment and unlock the report."""
    if tier not in PRICE_TIERS:
        raise HTTPException(status_code=400, detail="Invalid tier")

    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Verify payment intent
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status != "succeeded":
            raise HTTPException(status_code=400, detail="Payment not completed")
        if intent.metadata.get("scan_id") != scan_id:
            raise HTTPException(status_code=400, detail="Payment mismatch")
        if intent.metadata.get("tier") != tier:
            raise HTTPException(status_code=400, detail="Tier mismatch")
        if intent.amount != PRICE_TIERS[tier]:
            raise HTTPException(status_code=400, detail="Amount mismatch")
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Update scan with paid tier (upgrade-aware)
    current_rank = TIER_RANK.get(scan["paid_tier"], 0)
    new_rank = TIER_RANK.get(tier, 0)
    if new_rank > current_rank:
        await database.execute(
            scans.update()
            .where(scans.c.id == scan_id)
            .values(paid_tier=tier, stripe_payment_id=intent.id)
        )

    # Send confirmation email
    from app.email_service import send_payment_received_email
    await send_payment_received_email(scan["email"], scan_id, tier)

    # If pro or deep, create child scan
    child_scan_id = None
    if tier in ("pro", "deep"):
        child_scan_id = str(uuid.uuid4())
        await database.execute(
            scans.insert().values(
                id=child_scan_id,
                email=scan["email"],
                target_url=scan["target_url"],
                status="pending",
                scan_type=tier,
                parent_scan_id=scan_id,
            )
        )
        from app.email_service import send_deep_scan_started_email
        await send_deep_scan_started_email(scan["email"], child_scan_id, scan["target_url"])

    return {"success": True, "message": "Payment confirmed", "child_scan_id": child_scan_id}


def calculate_risk_level(findings: list) -> str:
    """Calculate overall risk level from findings."""
    if not findings:
        return "Clean"

    severities = [f.get("severity", "Low") for f in findings]

    if "Critical" in severities:
        return "Critical"
    if "High" in severities:
        return "High"
    if "Medium" in severities:
        return "Medium"
    return "Low"


def filter_findings_for_tier(findings: list, paid_tier: str | None) -> list:
    """Filter finding details based on paid tier."""
    filtered = []

    for f in findings:
        finding = {
            "title": f.get("title", "Unknown Issue"),
            "severity": f.get("severity", "Medium"),
            "endpoint": f.get("endpoint", "N/A"),
            "impact": f.get("impact", "Potential security issue"),
            "owasp_category": f.get("owasp_category") if paid_tier else None,
        }

        # Only include details if paid
        if paid_tier in ("unlock", "pro", "deep"):
            finding["reproduction_steps"] = f.get("reproduction_steps")
            finding["poc"] = f.get("poc")
            finding["fix_guidance"] = f.get("fix_guidance")

        filtered.append(ScanResultFinding(**finding))

    return filtered


def filter_structured_report_for_tier(
    report: dict | None, paid_tier: str | None
) -> StructuredReportResponse | None:
    """Filter structured report based on paid tier."""
    if not report:
        return None

    is_paid = paid_tier in ("unlock", "pro", "deep")

    # Executive summary: teaser for free, full for paid
    exec_summary = (
        report.get("executive_summary", "")
        if is_paid
        else report.get("executive_summary_teaser", report.get("executive_summary", "")[:200] + "...")
    )

    # Areas of interest: free gets title + teaser only
    areas = []
    for area in report.get("areas_of_interest", []):
        areas.append(AreaOfInterestResponse(
            title=area.get("title", ""),
            severity=area.get("severity", "Info"),
            teaser=area.get("teaser", ""),
            affected_component=area.get("affected_component", ""),
            technical_detail=area.get("technical_detail") if is_paid else None,
            recommendation=area.get("recommendation") if is_paid else None,
        ))

    # Recommendations: free gets title only
    recs = []
    for rec in report.get("recommendations", []):
        recs.append(RecommendationResponse(
            priority=rec.get("priority", 99),
            title=rec.get("title", ""),
            description=rec.get("description") if is_paid else None,
            effort=rec.get("effort") if is_paid else None,
            impact=rec.get("impact") if is_paid else None,
        ))

    # Categories tested - always shown
    categories = [
        CategoryResultResponse(**cat)
        for cat in report.get("categories_tested", [])
    ]

    # Constraints - always shown
    constraints = [
        ConstraintResponse(**c)
        for c in report.get("constraints", [])
    ]

    # Attack surface - always shown
    attack_surface_data = report.get("attack_surface", {})
    attack_surface = AttackSurfaceResponse(
        subdomains=attack_surface_data.get("subdomains", []),
        key_routes=attack_surface_data.get("key_routes", []),
        technologies=attack_surface_data.get("technologies", []),
        auth_mechanisms=attack_surface_data.get("auth_mechanisms", []),
        external_services=attack_surface_data.get("external_services", []),
    )

    # Scan stats - always shown
    stats_data = report.get("scan_stats", {})
    scan_stats = ScanStatsResponse(
        endpoints_discovered=stats_data.get("endpoints_discovered", 0),
        endpoints_tested=stats_data.get("endpoints_tested", 0),
        subdomains_found=stats_data.get("subdomains_found", 0),
        requests_sent=stats_data.get("requests_sent", 0),
        duration_minutes=stats_data.get("duration_minutes", 0),
        technologies_identified=stats_data.get("technologies_identified", 0),
    )

    return StructuredReportResponse(
        executive_summary=exec_summary,
        risk_level=report.get("risk_level", "Indeterminate"),
        risk_rationale=report.get("risk_rationale", ""),
        scan_stats=scan_stats,
        categories_tested=categories,
        attack_surface=attack_surface,
        areas_of_interest=areas,
        recommendations=recs,
        constraints=constraints,
        # Upsell only for free users
        deep_scan_value_prop=report.get("deep_scan_value_prop") if not is_paid else None,
        what_deep_scan_covers=report.get("what_deep_scan_covers") if not is_paid else None,
    )


@router.get("/{scan_id}/progress")
async def get_scan_progress(scan_id: str):
    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    progress = {}
    if scan["progress_json"]:
        progress = json.loads(scan["progress_json"])

    return {
        "scan_id": scan_id,
        "status": scan["status"],
        "progress": progress,
    }


@router.get("/{scan_id}/results", response_model=ScanResults)
async def get_scan_results(scan_id: str):
    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if scan["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Scan not completed. Status: {scan['status']}"
        )

    # Check for completed child scans (pro/deep upgrades)
    child_query = scans.select().where(
        (scans.c.parent_scan_id == scan_id) & (scans.c.status == "completed")
    ).order_by(scans.c.completed_at.desc())
    child_scan = await database.fetch_one(child_query)

    # Use child scan results if available, but parent's paid_tier for access control
    result_source = child_scan if child_scan else scan
    results = json.loads(result_source["results_json"]) if result_source["results_json"] else {}
    findings = results.get("findings", [])
    structured_report = results.get("structured_report")

    # Use structured report risk level if available, otherwise calculate from findings
    risk_level = (
        structured_report.get("risk_level", "Indeterminate")
        if structured_report
        else calculate_risk_level(findings)
    )

    return ScanResults(
        scan_id=scan_id,
        target_url=scan["target_url"],
        risk_level=risk_level,
        findings=filter_findings_for_tier(findings, scan["paid_tier"]),
        scan_type=result_source["scan_type"],
        completed_at=result_source["completed_at"],
        paid_tier=scan["paid_tier"],
        structured_report=filter_structured_report_for_tier(
            structured_report, scan["paid_tier"]
        ),
    )


@router.get("/{scan_id}/child-status")
async def get_child_scan_status(scan_id: str):
    """Get the status of any child scans (pro/deep upgrades)."""
    child_query = scans.select().where(
        scans.c.parent_scan_id == scan_id
    ).order_by(scans.c.created_at.desc())
    child = await database.fetch_one(child_query)

    if not child:
        return {"has_child": False}

    progress = {}
    if child["progress_json"]:
        progress = json.loads(child["progress_json"])

    return {
        "has_child": True,
        "child_scan_id": child["id"],
        "status": child["status"],
        "scan_type": child["scan_type"],
        "progress": progress,
    }


@router.post("/{scan_id}/send-pdf")
async def send_pdf_report(scan_id: str):
    """Send PDF report to user's email (paid users only)."""
    from app.email_service import send_pdf_report_email

    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if scan["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Scan not completed. Status: {scan['status']}"
        )

    if not scan["paid_tier"]:
        raise HTTPException(
            status_code=403,
            detail="PDF reports are only available for paid scans"
        )

    # Send the email with PDF
    await send_pdf_report_email(
        email=scan["email"],
        scan_id=scan_id,
        target_url=scan["target_url"],
    )

    return {"success": True, "message": "PDF report sent to your email"}


@router.get("/admin/dashboard")
async def admin_dashboard(key: str = ""):
    """Admin endpoint to view all scans and their statuses."""
    if not settings.admin_api_key or key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")

    all_scans = await database.fetch_all(
        scans.select().order_by(scans.c.created_at.desc()).limit(100)
    )

    summary = {"pending": 0, "running": 0, "completed": 0, "failed": 0}
    scan_list = []

    for s in all_scans:
        status = s["status"]
        summary[status] = summary.get(status, 0) + 1

        scan_info = {
            "id": s["id"],
            "email": s["email"],
            "target_url": s["target_url"],
            "status": status,
            "scan_type": s["scan_type"],
            "paid_tier": s["paid_tier"],
            "parent_scan_id": s["parent_scan_id"],
            "created_at": str(s["created_at"]),
            "completed_at": str(s["completed_at"]) if s["completed_at"] else None,
        }

        # Include cost/stats from progress for running and completed scans
        if status in ("running", "completed", "failed") and s["progress_json"]:
            progress = json.loads(s["progress_json"])
            scan_info["cost"] = progress.get("cost", 0)
            scan_info["tools"] = progress.get("tools", 0)
            if status == "running":
                scan_info["active_agents"] = progress.get("active_agents", 0)

        scan_list.append(scan_info)

    return {
        "summary": summary,
        "scans": scan_list,
    }
