import ipaddress
import json
import socket
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse
import stripe
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.database import database, scans, rate_limits, events
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
            utm_source=scan.utm_source,
            utm_medium=scan.utm_medium,
            utm_campaign=scan.utm_campaign,
            referrer=scan.referrer,
            landing_page=scan.landing_page,
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
        success_url=f"{settings.frontend_url}/results/{scan_id}?payment_success=true&tier={tier}",
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
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "always",
            },
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

    # Apply the tier + spawn any child scan. Idempotent and shared with the Stripe
    # webhook, so a payment delivered via both channels only takes effect once.
    from app.payments import apply_paid_tier
    child_scan_id, newly_applied = await apply_paid_tier(scan, tier, intent.id)

    if newly_applied:
        from app.email_service import send_payment_received_email
        await send_payment_received_email(scan["email"], scan_id, tier)
        if child_scan_id:
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

    # Check free scan expiration (30 days)
    FREE_REPORT_TTL_DAYS = 30
    expired = False
    expires_in_days = None
    if not scan["paid_tier"]:
        created = scan["created_at"]
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - created
        if age.days >= FREE_REPORT_TTL_DAYS:
            expired = True
        else:
            expires_in_days = FREE_REPORT_TTL_DAYS - age.days

    if expired:
        return ScanResults(
            scan_id=scan_id,
            target_url=scan["target_url"],
            risk_level="Expired",
            findings=[],
            scan_type=scan["scan_type"],
            completed_at=scan["completed_at"],
            paid_tier=None,
            expired=True,
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
        expires_in_days=expires_in_days,
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


@router.get("/{scan_id}/download-pdf")
async def download_pdf_report(scan_id: str):
    """Download PDF report (paid users only)."""
    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if scan["status"] != "completed":
        raise HTTPException(status_code=400, detail="Scan not completed")

    if not scan["paid_tier"]:
        raise HTTPException(status_code=403, detail="PDF reports are only available for paid scans")

    # Get results (check for child scan results like the results endpoint)
    child_query = scans.select().where(
        (scans.c.parent_scan_id == scan_id) & (scans.c.status == "completed")
    ).order_by(scans.c.completed_at.desc())
    child_scan = await database.fetch_one(child_query)

    result_source = child_scan if child_scan else scan
    results = json.loads(result_source["results_json"]) if result_source["results_json"] else {}

    from app.pdf_generator import generate_pdf_report

    # Extract tool count from progress data for the PDF stats
    tools_executed = 0
    progress_raw = result_source["progress_json"] if result_source["progress_json"] else None
    if progress_raw:
        try:
            prog = json.loads(progress_raw)
            tools_executed = prog.get("tools", 0)
        except (json.JSONDecodeError, TypeError):
            pass

    scan_data = {
        "id": scan_id,
        "target_url": scan["target_url"],
        "email": scan["email"],
        "paid_tier": scan["paid_tier"],
        "scan_type": result_source["scan_type"],
        "created_at": str(scan["created_at"]),
        "completed_at": str(result_source["completed_at"]),
        "tools_executed": tools_executed,
    }

    pdf_bytes = generate_pdf_report(scan_data, results)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="nullscan-report-{scan_id[:8]}.pdf"'
        },
    )


@router.get("/admin/dashboard")
async def admin_dashboard(key: str = "", format: str = "html", limit: int = 250):
    """Admin endpoint to view scans. The table shows the most recent `limit` scans
    (default 250, max 2000), but the KPI counts are over ALL scans, not just that page."""
    if not settings.admin_api_key or key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")

    import sqlalchemy as sa

    limit = max(1, min(limit, 2000))

    # Status totals over ALL scans (not just the displayed page).
    summary = {"pending": 0, "running": 0, "completed": 0, "failed": 0}
    for r in await database.fetch_all(
        sa.select(scans.c.status, sa.func.count().label("n")).group_by(scans.c.status)
    ):
        summary[r["status"]] = r["n"]

    # Most-recent `limit` scans for the table.
    all_scans = await database.fetch_all(
        scans.select().order_by(scans.c.created_at.desc()).limit(limit)
    )

    scan_list = []
    for s in all_scans:
        status = s["status"]
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
        if status in ("running", "completed", "failed", "cancelling") and s["progress_json"]:
            progress = json.loads(s["progress_json"])
            scan_info["cost"] = progress.get("cost", 0)
            scan_info["tools"] = progress.get("tools", 0)
            if status in ("running", "cancelling"):
                scan_info["active_agents"] = progress.get("active_agents", 0)
        scan_list.append(scan_info)

    if format == "json":
        return {"summary": summary, "total": sum(summary.values()),
                "showing": len(all_scans), "scans": scan_list}

    # Build the polished HTML dashboard.
    from datetime import datetime, timezone
    import html as _h

    status_colors = {
        "pending": "#eab308", "running": "#06b6d4", "completed": "#22c55e",
        "failed": "#ef4444", "cancelling": "#f97316",
    }

    def _fmt_dt(dt):
        try:
            return dt.strftime("%b %d, %H:%M") if dt else "—"
        except Exception:
            return str(dt)[:16]

    def _fmt_dur(start, end):
        try:
            if not start:
                return "—"
            if end:
                secs = (end - start).total_seconds()
            else:
                s0 = start if start.tzinfo else start.replace(tzinfo=timezone.utc)
                secs = (datetime.now(timezone.utc) - s0).total_seconds()
            if secs < 0:
                return "—"
            m, sec = divmod(int(secs), 60)
            if m >= 60:
                h, m = divmod(m, 60)
                return f"{h}h {m}m"
            return f"{m}m {sec}s" if m else f"{sec}s"
        except Exception:
            return "—"

    rows = []
    for s in all_scans:
        st = s["status"]
        color = status_colors.get(st, "#71717a")
        prog = json.loads(s["progress_json"]) if s["progress_json"] else {}
        cost = prog.get("cost")
        cost_str = f"${cost:.2f}" if isinstance(cost, (int, float)) else "—"
        tier = s["paid_tier"] or "free"
        sid = s["id"]
        if st in ("completed", "failed"):
            dur = _fmt_dur(s["created_at"], s["completed_at"])
        elif st in ("running", "cancelling"):
            dur = _fmt_dur(s["created_at"], None)
        else:
            dur = "—"
        acts = ""
        if st in ("running", "pending", "cancelling"):
            acts += f'<a class="act av" href="{settings.frontend_url}/scan/{sid}" target="_blank">View</a>'
        if st == "completed":
            acts += f'<a class="act ar" href="{settings.frontend_url}/results/{sid}" target="_blank">Results</a>'
        if st in ("running", "pending"):
            acts += f"<button class=\"act ac\" onclick=\"cancelScan('{sid}')\">Cancel</button>"
        rows.append(
            f'<tr><td class="tgt" title="{_h.escape(s["target_url"])}">{_h.escape(s["target_url"])}'
            f'<div class="idsub mono">{sid[:8]}</div></td>'
            f'<td><span class="pill" style="background:{color}22;color:{color}">{st}</span></td>'
            f'<td class="up dim">{s["scan_type"]}</td>'
            f'<td>{tier}</td>'
            f'<td class="cost">{cost_str}</td>'
            f'<td class="mono ts">{_fmt_dt(s["created_at"])}</td>'
            f'<td class="mono dim ts">{dur}</td>'
            f'<td class="dim em">{_h.escape(s["email"] or "")}</td>'
            f'<td class="nowrap">{acts}</td></tr>'
        )
    rows_html = "".join(rows) or '<tr><td colspan="9" class="empty">No scans yet</td></tr>'
    total = sum(summary.values())

    css = """<style>
:root{--bg:#09090b;--surface:#18181b;--border:#27272a;--text:#fafafa;--muted:#a1a1aa;--dim:#71717a;--cyan:#06b6d4}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;max-width:1320px;margin:0 auto}
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:12px}
h1{font-size:19px;font-weight:700;letter-spacing:-.02em}
h1 .n{color:var(--cyan)}
.sub{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-top:3px}
.tools{display:flex;gap:8px;align-items:center}
.btn{padding:6px 14px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:12px;cursor:pointer;text-decoration:none}
.btn:hover{border-color:var(--cyan);color:var(--text)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:22px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px}
.kpi .v{font-size:26px;font-weight:700;font-family:'SF Mono',ui-monospace,monospace}
.kpi .l{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
.tablewrap{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px;min-width:960px}
th{padding:11px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:var(--dim);letter-spacing:.05em;background:#141416;border-bottom:1px solid var(--border);white-space:nowrap}
td{padding:9px 10px;border-bottom:1px solid var(--border);color:var(--muted);vertical-align:top}
tr:last-child td{border-bottom:none}
tbody tr:hover td{background:#1c1c20}
.mono{font-family:'SF Mono',ui-monospace,monospace}
.dim{color:var(--dim)}
.up{text-transform:uppercase;font-size:12px}
.nowrap{white-space:nowrap}
.tgt{color:var(--text);max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.idsub{font-size:11px;color:var(--dim);margin-top:2px}
.ts{font-size:12px;white-space:nowrap}
.em{font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cost{font-family:'SF Mono',monospace;color:var(--text)}
.pill{display:inline-block;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.act{padding:4px 11px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;border:none;cursor:pointer;margin-right:6px;display:inline-block}
.av{background:var(--cyan);color:#09090b}
.ar{background:#22c55e;color:#09090b}
.ac{background:transparent;border:1px solid #ef4444;color:#ef4444}
.empty{text-align:center;color:var(--dim);padding:24px}
.toast{position:fixed;top:20px;right:20px;padding:12px 18px;border-radius:8px;font-size:13px;display:none;z-index:99}
</style>"""

    script = """<script>
var KEY = new URLSearchParams(location.search).get('key') || '';
document.getElementById('analytics').href = '/scans/admin/analytics?key=' + encodeURIComponent(KEY);
document.querySelectorAll('[data-limit]').forEach(function(a){a.href='?key='+encodeURIComponent(KEY)+'&limit='+a.getAttribute('data-limit');});
document.getElementById('jsonlink').onclick = function(e){e.preventDefault();var u=new URL(location);u.searchParams.set('format','json');location=u;};
function toast(msg, ok){var t=document.getElementById('toast');t.textContent=msg;t.style.display='block';t.style.background=ok?'#052e16':'#450a0a';t.style.color=ok?'#22c55e':'#ef4444';t.style.border='1px solid '+(ok?'#166534':'#991b1b');setTimeout(function(){t.style.display='none'},3000);}
async function cancelScan(id){if(!confirm('Cancel scan '+id.slice(0,8)+'?'))return;try{var r=await fetch('/scans/admin/cancel/'+id+'?key='+encodeURIComponent(KEY),{method:'POST'});var d=await r.json();if(r.ok){toast('Cancelling…',true);setTimeout(function(){location.reload()},2000);}else toast(d.detail||'Failed',false);}catch(e){toast('Error: '+e.message,false);}}
setInterval(function(){if(document.getElementById('auto').checked)location.reload();},10000);
</script>"""

    body = (
        '<header><div><h1><span class="n">null</span>scan scans</h1>'
        f'<div class="sub">live · auto-refresh 10s · showing {len(all_scans)} of {total}</div></div>'
        '<div class="tools"><label class="sub"><input type="checkbox" id="auto" checked> auto</label>'
        '<a class="btn" data-limit="250" href="#">250</a>'
        '<a class="btn" data-limit="500" href="#">500</a>'
        '<a class="btn" data-limit="2000" href="#">All</a>'
        '<a class="btn" id="analytics" href="#">Analytics</a>'
        '<a class="btn" id="jsonlink" href="#">JSON</a>'
        '<button class="btn" onclick="location.reload()">Refresh</button></div></header>'
        '<div class="kpis">'
        f'<div class="kpi"><div class="v" style="color:#eab308">{summary.get("pending",0)}</div><div class="l">Pending</div></div>'
        f'<div class="kpi"><div class="v" style="color:#06b6d4">{summary.get("running",0)}</div><div class="l">Running</div></div>'
        f'<div class="kpi"><div class="v" style="color:#22c55e">{summary.get("completed",0)}</div><div class="l">Completed</div></div>'
        f'<div class="kpi"><div class="v" style="color:#ef4444">{summary.get("failed",0)}</div><div class="l">Failed</div></div>'
        f'<div class="kpi"><div class="v">{total}</div><div class="l">Total scans</div></div>'
        '</div>'
        '<div class="tablewrap"><table><thead><tr>'
        '<th>Target</th><th>Status</th><th>Type</th><th>Tier</th><th>Cost</th>'
        '<th>Started</th><th>Duration</th><th>Email</th><th>Actions</th>'
        f'</tr></thead><tbody>{rows_html}</tbody></table></div>'
        '<div id="toast" class="toast"></div>'
    )

    html = ("<!DOCTYPE html><html><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            "<title>Nullscan Scans</title>" + css + "</head><body>" + body + script + "</body></html>")

    from starlette.responses import HTMLResponse
    return HTMLResponse(content=html)


@router.get("/admin/report/{scan_id}")
async def admin_full_report(scan_id: str, key: str = ""):
    """Admin-only: the FULL unfiltered scan report (all finding details incl. PoC, technical
    analysis, and remediation) — not tier-filtered like /results."""
    if not settings.admin_api_key or key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")

    scan = await database.fetch_one(scans.select().where(scans.c.id == scan_id))
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Prefer a completed pro/deep child scan's results, like the /results endpoint does.
    child = await database.fetch_one(
        scans.select()
        .where((scans.c.parent_scan_id == scan_id) & (scans.c.status == "completed"))
        .order_by(scans.c.completed_at.desc())
    )
    src = child if child else scan
    results = json.loads(src["results_json"]) if src["results_json"] else {}
    return {
        "scan_id": scan_id,
        "status": scan["status"],
        "target_url": scan["target_url"],
        "scan_type": src["scan_type"],
        "results": results,
    }


@router.post("/admin/unlock/{scan_id}")
async def admin_unlock_scan(scan_id: str, key: str = "", tier: str = "unlock"):
    """Admin-only: mark a scan as paid so its /results page renders fully unlocked, with no
    payment. Key-gated by admin_api_key and NOT public — a missing/empty admin key fails closed
    (403). WARNING: anyone holding the admin key can grant free unlocks (a payment bypass), so
    keep that key long, secret, and rotated.
    """
    if not settings.admin_api_key or key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")
    if tier not in ("unlock", "pro", "deep"):
        raise HTTPException(status_code=400, detail="Invalid tier")

    scan = await database.fetch_one(scans.select().where(scans.c.id == scan_id))
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    await database.execute(
        scans.update().where(scans.c.id == scan_id).values(paid_tier=tier)
    )
    return {"success": True, "scan_id": scan_id, "paid_tier": tier}


@router.post("/admin/cancel/{scan_id}")
async def admin_cancel_scan(scan_id: str, key: str = ""):
    """Admin endpoint to cancel a running scan."""
    if not settings.admin_api_key or key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")

    scan = await database.fetch_one(
        scans.select().where(scans.c.id == scan_id)
    )
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if scan["status"] != "running":
        raise HTTPException(status_code=400, detail=f"Scan is not running (status: {scan['status']})")

    # Set to cancelling — the worker's progress loop will detect this and cancel the task
    await database.execute(
        scans.update()
        .where(scans.c.id == scan_id)
        .values(status="cancelling")
    )

    return {"success": True, "message": f"Scan {scan_id} is being cancelled"}


_ANALYTICS_CSS = """<style>
:root{--bg:#09090b;--surface:#18181b;--border:#27272a;--text:#fafafa;--muted:#a1a1aa;--dim:#71717a;--cyan:#06b6d4;--green:#22c55e;--red:#ef4444}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;max-width:1180px;margin:0 auto}
.mono{font-family:'SF Mono',ui-monospace,Menlo,monospace}
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
h1{font-size:19px;font-weight:700;letter-spacing:-.02em}
h1 .n{color:var(--cyan)}
.sub{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-top:3px}
.tools{display:flex;gap:8px;align-items:center}
.btn{padding:6px 14px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:12px;cursor:pointer;text-decoration:none}
.btn:hover{border-color:var(--cyan);color:var(--text)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:22px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px}
.kpi .v{font-size:28px;font-weight:700;font-family:'SF Mono',ui-monospace,monospace}
.kpi .l{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px}
.card h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);margin-bottom:16px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media(max-width:720px){.grid2{grid-template-columns:1fr}.fstep{grid-template-columns:110px 1fr 48px}}
.fstep{display:grid;grid-template-columns:150px 1fr 58px;align-items:center;gap:12px;margin-bottom:10px}
.flabel{font-size:13px;color:var(--muted)}
.fbarwrap{position:relative;background:var(--bg);border:1px solid var(--border);border-radius:6px;height:34px;overflow:hidden}
.fbar{height:100%;background:linear-gradient(90deg,#0e7490,#06b6d4);border-radius:5px 0 0 5px}
.fcount{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-family:'SF Mono',monospace;font-size:13px;font-weight:700}
.fdrop{font-size:12px;color:var(--red);text-align:right;font-family:'SF Mono',monospace}
table{width:100%;border-collapse:collapse;font-size:13px}
td{padding:7px 4px;border-bottom:1px solid var(--border);color:var(--muted)}
td.num{text-align:right;font-family:'SF Mono',monospace;color:var(--text)}
td.mono{font-family:'SF Mono',monospace;font-size:12px}
th{text-align:left;padding:4px;font-size:10px;text-transform:uppercase;color:var(--dim);letter-spacing:.05em}
th.num{text-align:right}
.empty{color:var(--dim);text-align:center;padding:16px;font-size:12px}
.hrow{display:grid;grid-template-columns:92px 1fr 42px;align-items:center;gap:10px;margin-bottom:9px}
.hlabel{font-size:12px;color:var(--muted);text-transform:capitalize}
.hbarwrap{background:var(--bg);border:1px solid var(--border);border-radius:5px;height:20px;overflow:hidden}
.hbar{height:100%;border-radius:4px}
.hnum{font-family:'SF Mono',monospace;font-size:12px;text-align:right}
</style>"""

_ANALYTICS_SCRIPT = """<script>
document.getElementById('jsonlink').onclick=function(e){e.preventDefault();var u=new URL(location);u.searchParams.set('format','json');location=u};
setInterval(function(){if(document.getElementById('auto').checked)location.reload()},30000);
</script>"""

_FUNNEL_STEPS = [
    ("Scan started", "scan_started"),
    ("Results viewed", "results_viewed"),
    ("Checkout opened", "checkout_opened"),
    ("Tier selected", "checkout_tier_selected"),
    ("Payment started", "payment_started"),
    ("Payment succeeded", "payment_succeeded"),
]


def _render_analytics_html(data: dict) -> str:
    import html as _h

    def esc(x):
        return _h.escape(str(x))

    people = data["unique_people"]
    total = data["total_scans"]
    paid = data["paid_scans"]
    rev = data["estimated_revenue_usd"]
    conv = (paid / people * 100) if people else 0.0
    status = data["status"]
    scan_total = sum(status.values()) or 1
    fail_rate = status.get("failed", 0) / scan_total * 100

    funnel = data["funnel"]
    top = max((funnel.get(k, 0) for _, k in _FUNNEL_STEPS), default=0) or 1
    frows, prev = [], None
    for label, k in _FUNNEL_STEPS:
        n = funnel.get(k, 0)
        w = max(n / top * 100, 1.5)
        drop = "" if (prev is None or prev == 0) else f"−{round((prev - n) / prev * 100)}%"
        frows.append(
            f'<div class="fstep"><div class="flabel">{esc(label)}</div>'
            f'<div class="fbarwrap"><div class="fbar" style="width:{w:.1f}%"></div>'
            f'<span class="fcount">{n}</span></div><div class="fdrop">{drop}</div></div>'
        )
        prev = n
    funnel_html = "".join(frows)

    srows = []
    for src, v in list(data["by_source"].items())[:12]:
        c = (v["paid"] / v["scans"] * 100) if v["scans"] else 0
        srows.append(f'<tr><td>{esc(src)}</td><td class="num">{v["scans"]}</td>'
                     f'<td class="num">{v["paid"]}</td><td class="num">{c:.0f}%</td></tr>')
    src_html = "".join(srows) or '<tr><td class="empty" colspan="4">No scans yet</td></tr>'

    health_colors = [("completed", "#22c55e"), ("failed", "#ef4444"), ("running", "#06b6d4"),
                     ("pending", "#eab308"), ("cancelling", "#f97316")]
    hrows = []
    for st, color in health_colors:
        n = status.get(st, 0)
        if n == 0:
            continue
        hrows.append(f'<div class="hrow"><span class="hlabel">{st}</span>'
                     f'<div class="hbarwrap"><div class="hbar" style="width:{n / scan_total * 100:.1f}%;background:{color}"></div></div>'
                     f'<span class="hnum">{n}</span></div>')
    health_html = "".join(hrows) or '<div class="empty">No scans yet</div>'

    page_rows = "".join(f'<tr><td class="mono">{esc(p)}</td><td class="num">{n}</td></tr>'
                        for p, n in list(data["top_pages"].items())[:12]) \
        or '<tr><td class="empty" colspan="2">No pageviews yet</td></tr>'
    click_rows = "".join(f'<tr><td>{esc(lbl)}</td><td class="num">{n}</td></tr>'
                         for lbl, n in list(data["top_clicks"].items())[:12]) \
        or '<tr><td class="empty" colspan="2">No clicks yet</td></tr>'

    body = (
        '<header><div><h1><span class="n">null</span>scan analytics</h1>'
        '<div class="sub">first-party · auto-refresh 30s</div></div>'
        '<div class="tools"><label class="sub"><input type="checkbox" id="auto" checked> auto</label>'
        '<a class="btn" id="jsonlink" href="#">JSON</a>'
        '<button class="btn" onclick="location.reload()">Refresh</button></div></header>'
        '<div class="kpis">'
        f'<div class="kpi"><div class="v">{people}</div><div class="l">Unique people</div></div>'
        f'<div class="kpi"><div class="v">{total}</div><div class="l">Total scans</div></div>'
        f'<div class="kpi"><div class="v">{paid}</div><div class="l">Paid</div></div>'
        f'<div class="kpi"><div class="v" style="color:var(--cyan)">{conv:.1f}%</div><div class="l">Conversion</div></div>'
        f'<div class="kpi"><div class="v">${rev:,}</div><div class="l">Revenue</div></div>'
        '</div>'
        f'<div class="card"><h2>Conversion funnel</h2>{funnel_html}</div>'
        '<div class="grid2">'
        '<div class="card"><h2>Traffic sources</h2><table>'
        '<tr><th>Source</th><th class="num">Scans</th><th class="num">Paid</th><th class="num">Conv</th></tr>'
        f'{src_html}</table></div>'
        f'<div class="card"><h2>Scan health · {fail_rate:.0f}% fail</h2>{health_html}</div>'
        '</div>'
        '<div class="grid2">'
        f'<div class="card"><h2>Top pages</h2><table>{page_rows}</table></div>'
        f'<div class="card"><h2>Top clicked elements</h2><table>{click_rows}</table></div>'
        '</div>'
    )

    return ("<!DOCTYPE html><html><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            "<title>Nullscan Analytics</title>" + _ANALYTICS_CSS + "</head><body>"
            + body + _ANALYTICS_SCRIPT + "</body></html>")


@router.get("/admin/analytics")
async def admin_analytics(key: str = "", format: str = "html"):
    """First-party funnel + traffic-source analytics dashboard.

    HTML dashboard by default; `?format=json` returns the raw data. Answers, from our own
    data (no dependence on ad-blocked Google Analytics): who converts, where they come from,
    where in the funnel they drop, and how healthy scans are.
    """
    if not settings.admin_api_key or key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")

    from collections import Counter

    all_scans = await database.fetch_all(scans.select())
    # Attribute on root scans only (child pro/deep scans inherit their parent's source).
    root_scans = [s for s in all_scans if not s["parent_scan_id"]]
    total_scans = len(root_scans)
    paid_scans = [s for s in all_scans if s["paid_tier"]]
    unique_people = len({s["email"] for s in root_scans if s["email"]})
    status_counts = Counter(s["status"] for s in all_scans)

    def _source(s) -> str:
        if s["utm_source"]:
            return s["utm_source"]
        ref = s["referrer"]
        if ref:
            try:
                return (urlparse(ref).hostname or ref).replace("www.", "")
            except Exception:
                return ref
        return "direct"

    by_source: dict[str, dict] = {}
    for s in root_scans:
        entry = by_source.setdefault(_source(s), {"scans": 0, "paid": 0})
        entry["scans"] += 1
        if s["paid_tier"]:
            entry["paid"] += 1

    # Funnel = distinct sessions that fired each event; plus raw autocapture aggregates.
    all_events = await database.fetch_all(events.select())
    funnel_sessions: dict[str, set] = {}
    page_counts: Counter = Counter()
    click_targets: Counter = Counter()
    for e in all_events:
        funnel_sessions.setdefault(e["name"], set()).add(e["session_id"])
        if e["name"] == "pageview" and e["path"]:
            page_counts[e["path"]] += 1
        elif e["name"] == "click" and e["props_json"]:
            try:
                p = json.loads(e["props_json"])
                label = p.get("text") or p.get("track_id") or p.get("aria") or p.get("id") or p.get("tag")
                if label:
                    click_targets[str(label)[:60]] += 1
            except (json.JSONDecodeError, TypeError):
                pass
    funnel = {name: len(sessions) for name, sessions in funnel_sessions.items()}

    revenue_by_tier = {"unlock": 39, "pro": 250, "deep": 899}
    revenue = sum(revenue_by_tier.get(s["paid_tier"], 0) for s in paid_scans)

    data = {
        "total_scans": total_scans,
        "unique_people": unique_people,
        "paid_scans": len(paid_scans),
        "conversion_rate": round(len(paid_scans) / total_scans, 4) if total_scans else 0,
        "estimated_revenue_usd": revenue,
        "status": dict(status_counts),
        "by_source": dict(sorted(by_source.items(), key=lambda kv: kv[1]["scans"], reverse=True)),
        "funnel": funnel,
        "top_pages": dict(page_counts.most_common(15)),
        "top_clicks": dict(click_targets.most_common(25)),
    }

    if format == "json":
        return data

    from starlette.responses import HTMLResponse
    return HTMLResponse(content=_render_analytics_html(data))
