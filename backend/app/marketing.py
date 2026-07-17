"""Shared helpers for the marketing drip campaign: signed links (unsubscribe + promo) and
the unsubscribe suppression list.

Tokens are HMAC-SHA256 over a small payload, so links are unforgeable and non-enumerable
without needing to store per-link state. The same secret signs unsubscribe and promo links.
"""
import base64
import hashlib
import hmac
from urllib.parse import quote

from app.config import settings
from app.database import database, email_suppressions


def _secret() -> str:
    """HMAC key. Prefer an explicit MARKETING_SECRET; otherwise reuse the Stripe key (always set
    in prod) so links can't be forged. The final fallback only matters in dev."""
    return settings.marketing_secret or settings.stripe_secret_key or settings.admin_api_key or "nullscan-dev"


def _sign(payload: str) -> str:
    digest = hmac.new(_secret().encode(), payload.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("=")[:24]


# ---- Unsubscribe links ----

def unsubscribe_token(email: str) -> str:
    return _sign(f"unsub:{email.strip().lower()}")


def verify_unsubscribe(email: str, token: str) -> bool:
    return hmac.compare_digest(unsubscribe_token(email), token or "")


def unsubscribe_link(email: str) -> str:
    e = email.strip().lower()
    return f"{settings.api_url}/unsubscribe?email={quote(e)}&token={unsubscribe_token(e)}"


# ---- Promo (discounted unlock) links ----

def promo_token(scan_id: str, tier: str) -> str:
    return _sign(f"promo:{scan_id}:{tier}")


def verify_promo(scan_id: str, tier: str, token: str) -> bool:
    return bool(token) and hmac.compare_digest(promo_token(scan_id, tier), token)


def promo_link(scan_id: str, tier: str = "unlock") -> str:
    """Frontend results link that pre-applies the discount for this specific scan."""
    return f"{settings.frontend_url}/results/{scan_id}?promo={promo_token(scan_id, tier)}"


# ---- Suppression list ----

async def is_suppressed(email: str) -> bool:
    row = await database.fetch_one(
        email_suppressions.select().where(email_suppressions.c.email == email.strip().lower())
    )
    return row is not None


async def suppress(email: str, reason: str = "unsubscribe") -> None:
    """Add an email to the suppression list. Idempotent (no error if already present)."""
    e = email.strip().lower()
    if await is_suppressed(e):
        return
    try:
        await database.execute(
            email_suppressions.insert().values(email=e, reason=reason)
        )
    except Exception:
        pass  # race: inserted concurrently — already suppressed, which is the goal
