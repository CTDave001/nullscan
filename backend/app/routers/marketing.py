"""Public unsubscribe endpoints for marketing email.

Supports both the human click-through (GET) and RFC 8058 one-click unsubscribe (POST), the
latter driven by the List-Unsubscribe / List-Unsubscribe-Post headers set on every drip email.
"""
from fastapi import APIRouter, Response
from fastapi.responses import HTMLResponse

from app.marketing import verify_unsubscribe, suppress

router = APIRouter(tags=["marketing"])

_CONFIRM_PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unsubscribed - Nullscan</title></head>
<body style="margin:0;background:#09090b;color:#fafafa;font-family:-apple-system,Segoe UI,sans-serif;">
  <div style="max-width:520px;margin:12vh auto;padding:40px;text-align:center;">
    <div style="color:#06b6d4;font-size:22px;font-weight:700;letter-spacing:1px;">NULLSCAN</div>
    <h1 style="font-size:20px;margin:28px 0 12px;">{heading}</h1>
    <p style="color:#a1a1aa;line-height:1.6;">{body}</p>
    <a href="https://nullscan.io" style="display:inline-block;margin-top:24px;color:#06b6d4;text-decoration:none;">Back to nullscan.io</a>
  </div>
</body></html>"""


async def _do_unsubscribe(email: str, token: str) -> bool:
    if not email or not verify_unsubscribe(email, token):
        return False
    await suppress(email, reason="unsubscribe")
    return True


@router.get("/unsubscribe", response_class=HTMLResponse)
async def unsubscribe_get(email: str = "", token: str = ""):
    ok = await _do_unsubscribe(email, token)
    if ok:
        page = _CONFIRM_PAGE.format(
            heading="You're unsubscribed",
            body="You won't receive any more marketing emails from Nullscan. "
                 "You'll still get transactional email (scan results and receipts) for scans you run.",
        )
        return HTMLResponse(page)
    page = _CONFIRM_PAGE.format(
        heading="Link not valid",
        body="This unsubscribe link is invalid or expired. Reply to any email and we'll remove you manually.",
    )
    return HTMLResponse(page, status_code=400)


@router.post("/unsubscribe")
async def unsubscribe_post(email: str = "", token: str = ""):
    """RFC 8058 one-click unsubscribe target. Mail clients POST here directly."""
    ok = await _do_unsubscribe(email, token)
    return Response(status_code=200 if ok else 400)
