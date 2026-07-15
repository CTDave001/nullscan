"""First-party analytics ingestion.

The frontend posts funnel events here (scan_started, results_viewed, checkout_opened,
checkout_tier_selected, payment_started, payment_failed, payment_succeeded, …). Kept
deliberately permissive and cheap — it just records rows for later aggregation via the
admin analytics endpoint.
"""

import json

from fastapi import APIRouter

from app.database import database, events as events_table
from app.models import EventCreate

router = APIRouter(prefix="/events", tags=["events"])


def _clip(value: str | None, length: int) -> str | None:
    if not value:
        return None
    return value[:length]


@router.post("")
async def track_event(event: EventCreate):
    name = (event.name or "").strip()[:64]
    if not name:
        return {"ok": False}

    props_json = None
    if event.props:
        try:
            props_json = json.dumps(event.props)[:2000]
        except (TypeError, ValueError):
            props_json = None

    await database.execute(
        events_table.insert().values(
            session_id=_clip(event.session_id, 64) or "unknown",
            scan_id=_clip(event.scan_id, 36),
            name=name,
            props_json=props_json,
            path=_clip(event.path, 512),
            referrer=_clip(event.referrer, 1024),
            utm_source=_clip(event.utm_source, 255),
            utm_medium=_clip(event.utm_medium, 255),
            utm_campaign=_clip(event.utm_campaign, 255),
        )
    )
    return {"ok": True}
