import uuid
import stripe
from fastapi import APIRouter, Request, HTTPException
from app.config import settings
from app.database import database, scans
from app.email_service import send_payment_received_email, send_deep_scan_started_email

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

stripe.api_key = settings.stripe_secret_key

TIER_RANK = {"unlock": 1, "pro": 2, "deep": 3}


@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await handle_successful_payment(session)

    return {"status": "ok"}


async def handle_successful_payment(session: dict):
    """Handle successful Stripe checkout."""
    scan_id = session.get("metadata", {}).get("scan_id")
    tier = session.get("metadata", {}).get("tier")

    if not scan_id or not tier:
        print(f"Missing metadata in session: {session}")
        return

    # Get scan
    query = scans.select().where(scans.c.id == scan_id)
    scan = await database.fetch_one(query)

    if not scan:
        print(f"Scan not found: {scan_id}")
        return

    # Idempotency: skip if already processed with this payment
    if scan["stripe_payment_id"]:
        return

    # Update scan with payment info (upgrade-aware)
    current_rank = TIER_RANK.get(scan["paid_tier"], 0)
    new_rank = TIER_RANK.get(tier, 0)
    if new_rank > current_rank:
        await database.execute(
            scans.update()
            .where(scans.c.id == scan_id)
            .values(
                paid_tier=tier,
                stripe_payment_id=session["id"],
            )
        )

    # Send confirmation email
    await send_payment_received_email(scan["email"], scan_id, tier)

    # If pro or deep, create child scan
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
        await send_deep_scan_started_email(
            scan["email"], child_scan_id, scan["target_url"]
        )
