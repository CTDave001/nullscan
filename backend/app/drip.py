"""Post-scan marketing drip: re-engage people who scanned, saw findings, but didn't buy.

Runs inside the worker loop (throttled). For each eligible scan it sends the next due step of a
4-touch sequence, each email built from that scan's REAL findings. Value-first, with a single
honest $29 discount at step 3 and the genuine 30-day report-expiry deadline at step 4.

Safety model:
  * Master switch: nothing sends unless settings.marketing_emails_enabled is True.
  * Enrollment window: a scan only STARTS the sequence while it is younger than ENROLL_WINDOW_H.
    This means turning the feature on never back-blasts the entire history of old unpaid scans.
  * Idempotent: one drip_sends row per (scan_id, step); a step is never sent twice.
  * Auto-stop: filtered on paid_tier IS NULL (stops on purchase) and the suppression list
    (stops on unsubscribe). Emails with ANY paid scan are excluded entirely.
  * De-dupe by email: at most one drip email per address per ~20h, even across multiple scans.
"""
import json
import logging
from datetime import datetime, timedelta
from urllib.parse import urlparse

import resend
import sqlalchemy as sa

from app.config import settings
from app.database import database, scans, drip_sends, email_suppressions
from app.marketing import unsubscribe_link, promo_link

logger = logging.getLogger(__name__)

# Age (hours since scan creation) at which each step becomes due.
STEP_AGES_H = {1: 1, 2: 24, 3: 72, 4: 168}
ENROLL_WINDOW_H = 36        # only START a sequence while the scan is younger than this
EMAIL_COOLDOWN_H = 20       # min gap between any two drip emails to the same address
MAX_SENDS_PER_TICK = 40
FREE_REPORT_TTL_DAYS = 30   # mirrors get_scan_results — used for the real step-4 deadline

_SEV_RANK = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Info": 4}


def _domain(url: str) -> str:
    try:
        host = urlparse(url).hostname or url
        return host[4:] if host.startswith("www.") else host
    except Exception:
        return url


def summarize_findings(results: dict) -> dict | None:
    """Pull the marketing hook out of a scan's results. Returns None if there's nothing to sell
    (no findings / clean scan) — those scans are never enrolled."""
    sr = results.get("structured_report") or {}
    areas = sr.get("areas_of_interest") or []
    if not areas:
        # Fall back to legacy findings list
        areas = [
            {"title": f.get("title"), "severity": f.get("severity"), "teaser": f.get("impact", "")}
            for f in (results.get("findings") or [])
        ]
    areas = [a for a in areas if a.get("title")]
    if not areas:
        return None
    areas.sort(key=lambda a: _SEV_RANK.get(a.get("severity"), 5))
    top = areas[0]
    return {
        "count": len(areas),
        "risk_level": sr.get("risk_level") or top.get("severity") or "Medium",
        "top_severity": top.get("severity") or "issue",
        "top_title": top.get("title") or "a security issue",
        "top_teaser": (top.get("teaser") or "").strip(),
    }


# ----------------------------------------------------------------------------
# Templates. Each returns (subject, inner_html). The shell adds header + footer.
# ----------------------------------------------------------------------------

def _shell(inner: str, cta_url: str, cta_label: str, unsub: str) -> str:
    return f"""
    <div style="font-family:-apple-system,Segoe UI,sans-serif;background:#09090b;color:#fafafa;max-width:600px;margin:0 auto;padding:40px;">
      <div style="border-bottom:1px solid #27272a;padding-bottom:18px;margin-bottom:28px;">
        <span style="color:#06b6d4;font-size:22px;font-weight:700;letter-spacing:1px;">NULLSCAN</span>
      </div>
      {inner}
      <div style="margin:28px 0;">
        <a href="{cta_url}" style="display:inline-block;background:#06b6d4;color:#09090b;padding:13px 28px;text-decoration:none;border-radius:6px;font-weight:600;">{cta_label}</a>
      </div>
      <div style="border-top:1px solid #27272a;margin-top:36px;padding-top:18px;color:#52525b;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 6px;">You're getting this because you ran a free security scan on nullscan.io.</p>
        <p style="margin:0;">{settings.marketing_postal_address} &middot; <a href="{unsub}" style="color:#71717a;">Unsubscribe</a></p>
      </div>
    </div>"""


def _plural(n: int) -> str:
    return "issue" if n == 1 else "issues"


def build_step1(scan, s, links):
    d = _domain(scan["target_url"])
    subject = f"We found {s['count']} security {_plural(s['count'])} on {d}"
    teaser = f'<p style="color:#a1a1aa;line-height:1.6;background:#18181b;border-left:3px solid #06b6d4;padding:12px 16px;margin:16px 0;">{s["top_teaser"]}</p>' if s["top_teaser"] else ""
    inner = f"""
      <h1 style="font-size:20px;margin:0 0 16px;">Your scan of {d} is ready</h1>
      <p style="color:#a1a1aa;line-height:1.6;">Our automated pentest surfaced <strong style="color:#fafafa;">{s['count']} {_plural(s['count'])}</strong> on {d}, including a <strong style="color:#f59e0b;">{s['top_severity']}</strong>-severity finding:</p>
      <p style="color:#fafafa;font-weight:600;margin:16px 0 0;">{s['top_title']}</p>
      {teaser}
      <p style="color:#a1a1aa;line-height:1.6;">The full report has the technical detail, proof of concept, and exact fix for every finding.</p>"""
    return subject, _shell(inner, links["report"], "View the full report", links["unsub"])


def build_step2(scan, s, links):
    d = _domain(scan["target_url"])
    subject = f"What an attacker does with the {s['top_severity']} on {d}"
    inner = f"""
      <h1 style="font-size:20px;margin:0 0 16px;">This isn't theoretical</h1>
      <p style="color:#a1a1aa;line-height:1.6;">The {s['top_severity']}-severity issue we found on {d} &mdash; <strong style="color:#fafafa;">{s['top_title']}</strong> &mdash; is exactly the kind of thing an attacker scans for automatically.</p>
      <p style="color:#a1a1aa;line-height:1.6;">Anyone running the same tooling we did finds the same opening. The difference is whether <em>you</em> see it and fix it first, or they do.</p>
      <p style="color:#a1a1aa;line-height:1.6;">Your report walks through precisely how it's exploited and how to close it &mdash; for all {s['count']} {_plural(s['count'])}.</p>"""
    return subject, _shell(inner, links["report"], "See how it's exploited", links["unsub"])


def build_step3(scan, s, links):
    d = _domain(scan["target_url"])
    price = settings.promo_price_unlock / 100
    subject = f"Unlock your {d} report for ${price:.0f} (reg $39)"
    inner = f"""
      <h1 style="font-size:20px;margin:0 0 16px;">Here's ${39 - price:.0f} off to close this out</h1>
      <p style="color:#a1a1aa;line-height:1.6;">Every finding in your {d} report comes with reproduction steps and the exact remediation &mdash; no guessing, hand it straight to a developer.</p>
      <p style="color:#a1a1aa;line-height:1.6;">For the next few days you can unlock the full report for <strong style="color:#06b6d4;">${price:.0f}</strong> instead of $39. One time, this scan.</p>"""
    return subject, _shell(inner, links["promo"], f"Unlock full report — ${price:.0f}", links["unsub"])


def build_step4(scan, s, links):
    d = _domain(scan["target_url"])
    created = scan["created_at"]
    days_left = max(1, FREE_REPORT_TTL_DAYS - (datetime.utcnow() - created).days)
    subject = f"Your {d} security report expires in {days_left} days"
    inner = f"""
      <h1 style="font-size:20px;margin:0 0 16px;">Last call on your {d} report</h1>
      <p style="color:#a1a1aa;line-height:1.6;">Free reports are kept for {FREE_REPORT_TTL_DAYS} days. Yours &mdash; with all {s['count']} {_plural(s['count'])} including the {s['top_severity']} &mdash; comes down in <strong style="color:#fafafa;">{days_left} days</strong>.</p>
      <p style="color:#a1a1aa;line-height:1.6;">Unlock it now and you keep permanent access to the full findings, PoCs, and fixes.</p>"""
    return subject, _shell(inner, links["promo"], "Unlock before it expires", links["unsub"])


_BUILDERS = {1: build_step1, 2: build_step2, 3: build_step3, 4: build_step4}


def _send(email: str, subject: str, html: str, unsub: str) -> bool:
    """Send one marketing email via Resend. Returns True on success."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send drip '{subject}' to {email}", flush=True)
        return True
    try:
        resend.Emails.send({
            "from": settings.marketing_email_from,
            "to": email,
            "subject": subject,
            "html": html,
            "headers": {
                "List-Unsubscribe": f"<{unsub}>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
        })
        return True
    except Exception as e:
        logger.error(f"drip send failed to {email}: {e}")
        return False


async def _recently_emailed(email: str, now: datetime) -> bool:
    cutoff = now - timedelta(hours=EMAIL_COOLDOWN_H)
    row = await database.fetch_one(
        drip_sends.select().where(
            (drip_sends.c.email == email) & (drip_sends.c.sent_at >= cutoff)
        )
    )
    return row is not None


async def run_drip_tick() -> int:
    """Send at most one due step for each eligible scan. Returns number of emails sent."""
    if not settings.marketing_emails_enabled:
        return 0

    now = datetime.utcnow()  # naive UTC, matching how scans.created_at is stored
    window_start = now - timedelta(hours=ENROLL_WINDOW_H)
    oldest = now - timedelta(days=FREE_REPORT_TTL_DAYS)  # don't touch already-expired scans

    # Candidate scans: completed, unpaid, has some age, not ancient.
    rows = await database.fetch_all(
        scans.select().where(
            (scans.c.status == "completed")
            & (scans.c.paid_tier.is_(None))
            & (scans.c.created_at <= now - timedelta(hours=STEP_AGES_H[1]))
            & (scans.c.created_at >= oldest)
        ).order_by(scans.c.created_at.desc())
    )

    # Emails that have ever paid — exclude them wholesale (don't nag a customer).
    paid_rows = await database.fetch_all(
        sa.select(scans.c.email).where(scans.c.paid_tier.isnot(None)).distinct()
    )
    paid_emails = {r["email"].strip().lower() for r in paid_rows}

    sent = 0
    seen_emails: set[str] = set()
    for scan in rows:
        if sent >= MAX_SENDS_PER_TICK:
            break
        email = scan["email"].strip().lower()
        if email in paid_emails or email in seen_emails:
            continue

        # Suppressed (unsubscribed)?
        if await database.fetch_one(
            email_suppressions.select().where(email_suppressions.c.email == email)
        ):
            continue

        # Only scans with real findings get enrolled.
        results = json.loads(scan["results_json"]) if scan["results_json"] else {}
        s = summarize_findings(results)
        if not s:
            continue

        created = scan["created_at"]
        age_h = (now - created).total_seconds() / 3600

        # Which steps already went out for this scan?
        done_rows = await database.fetch_all(
            drip_sends.select().where(drip_sends.c.scan_id == scan["id"])
        )
        done = {r["step"] for r in done_rows}

        # Never START a sequence on a scan older than the enrollment window.
        if not done and created < window_start:
            continue

        # Next due step = smallest unsent step whose age threshold has passed.
        next_step = next(
            (st for st in (1, 2, 3, 4) if st not in done and age_h >= STEP_AGES_H[st]),
            None,
        )
        if next_step is None:
            continue

        # De-dupe by email across scans / cooldown between any two drip emails.
        if await _recently_emailed(email, now):
            seen_emails.add(email)
            continue

        links = {
            "report": f"{settings.frontend_url}/results/{scan['id']}",
            "promo": promo_link(scan["id"], "unlock"),
            "unsub": unsubscribe_link(email),
        }
        subject, html = _BUILDERS[next_step](scan, s, links)
        if _send(email, subject, html, links["unsub"]):
            await database.execute(
                drip_sends.insert().values(scan_id=scan["id"], email=email, step=next_step)
            )
            sent += 1
            seen_emails.add(email)

    if sent:
        logger.info(f"drip tick sent {sent} email(s)")
    return sent
