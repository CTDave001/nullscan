import stripe
from fastapi import APIRouter, Request, HTTPException
from app.config import settings
from app.database import database, scans
from app.payments import apply_paid_tier
from app.email_service import send_payment_received_email, send_deep_scan_started_email

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

stripe.api_key = settings.stripe_secret_key


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

    obj = event["data"]["object"]

    # Hosted Checkout redirect flow. Metadata lives on the session; the payment id is
    # the session id (matches the pre-existing behaviour).
    if event["type"] == "checkout.session.completed":
        await handle_payment(obj, payment_id=obj["id"])

    # Embedded card flow (PaymentIntent). This is the server-side safety net for
    # payments where the browser closed / redirected (3DS, Link) before the frontend
    # could call /confirm-payment — previously those payments were silently lost.
    elif event["type"] == "payment_intent.succeeded":
        await handle_payment(obj, payment_id=obj["id"])

    return {"status": "ok"}


async def handle_payment(obj: dict, payment_id: str):
    """Apply a completed Stripe payment to its scan (idempotent)."""
    metadata = obj.get("metadata") or {}
    scan_id = metadata.get("scan_id")
    tier = metadata.get("tier")

    # PaymentIntents created by hosted Checkout don't carry our metadata — only our
    # own create-payment-intent calls do. Skip anything we can't attribute.
    if not scan_id or not tier:
        return

    scan = await database.fetch_one(scans.select().where(scans.c.id == scan_id))
    if not scan:
        print(f"[webhook] Scan not found: {scan_id}")
        return

    child_scan_id, newly_applied = await apply_paid_tier(scan, tier, payment_id)
    if not newly_applied:
        return  # Already processed (e.g. /confirm-payment beat us to it)

    await send_payment_received_email(scan["email"], scan_id, tier)
    if child_scan_id:
        await send_deep_scan_started_email(scan["email"], child_scan_id, scan["target_url"])
