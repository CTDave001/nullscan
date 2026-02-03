import json
import uuid
from datetime import datetime
import stripe
from fastapi import APIRouter, HTTPException
from app.database import database, scans, rate_limits
from app.models import ScanCreate, ScanResponse, ScanResults, ScanResultFinding
from app.config import settings

stripe.api_key = settings.stripe_secret_key

PRICE_TIERS = {
    "unlock": 14900,  # $149.00 in cents
    "deep": 39900,    # $399.00 in cents
}

router = APIRouter(prefix="/scans", tags=["scans"])

MAX_FREE_SCANS_PER_MONTH = 3


async def check_rate_limit(email: str) -> bool:
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
            scan_type="quick",
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

    if scan["paid_tier"]:
        raise HTTPException(status_code=400, detail="Already paid")

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
        if paid_tier in ("unlock", "deep"):
            finding["reproduction_steps"] = f.get("reproduction_steps")
            finding["poc"] = f.get("poc")
            finding["fix_guidance"] = f.get("fix_guidance")

        filtered.append(ScanResultFinding(**finding))

    return filtered


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

    results = json.loads(scan["results_json"]) if scan["results_json"] else {}
    findings = results.get("findings", [])

    return ScanResults(
        scan_id=scan_id,
        target_url=scan["target_url"],
        risk_level=calculate_risk_level(findings),
        findings=filter_findings_for_tier(findings, scan["paid_tier"]),
        scan_type=scan["scan_type"],
        completed_at=scan["completed_at"],
        paid_tier=scan["paid_tier"],
    )
