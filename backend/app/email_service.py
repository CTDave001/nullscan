import resend
from app.config import settings

resend.api_key = settings.resend_api_key


async def send_scan_started_email(email: str, scan_id: str, target_url: str):
    """Send email when scan starts."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send scan started email to {email}")
        return

    resend.Emails.send({
        "from": "Argus <noreply@yourdomain.com>",
        "to": email,
        "subject": f"Scanning {target_url}",
        "html": f"""
        <h2>Your security scan has started</h2>
        <p>We're scanning <strong>{target_url}</strong>.</p>
        <p>This usually takes 5-15 minutes. We'll email you when it's ready.</p>
        <p>
            <a href="{settings.frontend_url}/scan/{scan_id}">
                Check scan status
            </a>
        </p>
        """,
    })


async def send_scan_complete_email(
    email: str,
    scan_id: str,
    findings_count: int,
    target_url: str,
):
    """Send email when scan completes."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send scan complete email to {email}")
        return

    if findings_count > 0:
        subject = f"Security scan complete: {findings_count} issues found"
        findings_text = f"We found <strong>{findings_count} potential issues</strong>."
    else:
        subject = "Security scan complete: No obvious issues"
        findings_text = "No obvious issues were detected in the quick scan."

    resend.Emails.send({
        "from": "Argus <noreply@yourdomain.com>",
        "to": email,
        "subject": subject,
        "html": f"""
        <h2>Your security scan is ready</h2>
        <p>Scan complete for <strong>{target_url}</strong>.</p>
        <p>{findings_text}</p>
        <p>
            <a href="{settings.frontend_url}/results/{scan_id}"
               style="background: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                View Results
            </a>
        </p>
        """,
    })


async def send_scan_failed_email(email: str, scan_id: str):
    """Send email when scan fails."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send scan failed email to {email}")
        return

    resend.Emails.send({
        "from": "Argus <noreply@yourdomain.com>",
        "to": email,
        "subject": "Security scan failed",
        "html": f"""
        <h2>Something went wrong</h2>
        <p>We couldn't complete your security scan. This sometimes happens with
           complex applications.</p>
        <p>
            <a href="{settings.frontend_url}">
                Try again
            </a>
        </p>
        """,
    })


async def send_deep_scan_started_email(email: str, scan_id: str, target_url: str):
    """Send email when deep scan starts."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send deep scan started email to {email}")
        return

    resend.Emails.send({
        "from": "Argus <noreply@yourdomain.com>",
        "to": email,
        "subject": f"Deep analysis started for {target_url}",
        "html": f"""
        <h2>Deep analysis in progress</h2>
        <p>We're running a thorough security analysis on <strong>{target_url}</strong>.</p>
        <p>This usually takes 1-4 hours depending on your application's complexity.</p>
        <p>We'll email you when it's ready.</p>
        """,
    })


async def send_payment_received_email(email: str, scan_id: str, tier: str):
    """Send email when payment is received."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send payment received email to {email}")
        return

    resend.Emails.send({
        "from": "Argus <noreply@yourdomain.com>",
        "to": email,
        "subject": "Payment received - Full report unlocked",
        "html": f"""
        <h2>Thank you for your purchase!</h2>
        <p>Your full security report is now available.</p>
        <p>
            <a href="{settings.frontend_url}/results/{scan_id}/full"
               style="background: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                View Full Report
            </a>
        </p>
        """,
    })
