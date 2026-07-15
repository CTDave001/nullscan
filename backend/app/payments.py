"""Shared, idempotent payment-application logic.

Both the interactive `confirm-payment` endpoint (embedded card flow) and the Stripe
webhook (`checkout.session.completed` and `payment_intent.succeeded`) funnel through
`apply_paid_tier` so a single payment applies its tier and spawns at most one child
scan — no matter how many times, or through how many channels, it is delivered.
"""

import uuid

from app.database import database, scans

TIER_RANK = {"unlock": 1, "pro": 2, "deep": 3}


async def _existing_child(parent_scan_id: str, tier: str):
    return await database.fetch_one(
        scans.select().where(
            (scans.c.parent_scan_id == parent_scan_id) & (scans.c.scan_type == tier)
        )
    )


async def apply_paid_tier(scan_row, tier: str, payment_id: str) -> tuple[str | None, bool]:
    """Apply a paid tier to a scan, idempotently by ``payment_id``.

    Returns ``(child_scan_id, newly_applied)`` where ``child_scan_id`` is the id of the
    pro/deep child scan (created here or already existing, else ``None``) and
    ``newly_applied`` is ``True`` only the first time this payment is processed — callers
    use it to avoid sending duplicate emails on webhook/replay.
    """
    scan_id = scan_row["id"]

    # Idempotency: this exact payment was already applied to this scan.
    if scan_row["stripe_payment_id"] == payment_id:
        child = await _existing_child(scan_id, tier) if tier in ("pro", "deep") else None
        return (child["id"] if child else None, False)

    # Upgrade-aware tier update; always record the payment id as the idempotency key.
    current_rank = TIER_RANK.get(scan_row["paid_tier"], 0)
    new_rank = TIER_RANK.get(tier, 0)
    values = {"stripe_payment_id": payment_id}
    if new_rank > current_rank:
        values["paid_tier"] = tier
    await database.execute(scans.update().where(scans.c.id == scan_id).values(**values))

    # Spawn a child scan for pro/deep — but only one per (parent, tier).
    child_scan_id = None
    if tier in ("pro", "deep"):
        child = await _existing_child(scan_id, tier)
        if child:
            child_scan_id = child["id"]
        else:
            child_scan_id = str(uuid.uuid4())
            await database.execute(
                scans.insert().values(
                    id=child_scan_id,
                    email=scan_row["email"],
                    target_url=scan_row["target_url"],
                    status="pending",
                    scan_type=tier,
                    parent_scan_id=scan_id,
                )
            )

    return (child_scan_id, True)
