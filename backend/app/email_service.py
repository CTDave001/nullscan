import logging
import resend
from app.config import settings

resend.api_key = settings.resend_api_key

logger = logging.getLogger(__name__)


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

    try:
        resend.Emails.send({
            "from": settings.email_from,
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
    except Exception as e:
        logger.error(f"Failed to send scan complete email to {email}: {e}")


async def send_scan_failed_email(email: str, scan_id: str):
    """Send email when scan fails."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send scan failed email to {email}")
        return

    try:
        resend.Emails.send({
            "from": settings.email_from,
            "to": email,
            "subject": "Security scan could not be completed",
            "html": f"""
            <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #fafafa; background-color: #09090b; padding: 32px; border-radius: 8px;">
                <h2 style="color: #fafafa; margin-top: 0;">Something went wrong</h2>
                <p style="color: #a1a1aa; line-height: 1.6;">
                    We were unable to complete your security scan (ID: {scan_id[:8]}). This can happen with complex applications or unusual configurations.
                </p>
                <p style="color: #a1a1aa; line-height: 1.6;">
                    If you purchased a paid scan, please contact our support team and we'll make it right.
                </p>
                <div style="margin: 24px 0;">
                    <a href="mailto:contact@nullscan.io" style="display: inline-block; padding: 10px 24px; background-color: #06b6d4; color: #09090b; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 12px;">Contact Support</a>
                    <a href="{settings.frontend_url}" style="display: inline-block; padding: 10px 24px; border: 1px solid #27272a; color: #a1a1aa; text-decoration: none; border-radius: 6px; font-size: 14px;">Try Again</a>
                </div>
                <p style="color: #52525b; font-size: 12px; margin-bottom: 0;">Nullscan Security</p>
            </div>
            """,
        })
    except Exception as e:
        logger.error(f"Failed to send scan failed email to {email}: {e}")


async def send_deep_scan_started_email(email: str, scan_id: str, target_url: str):
    """Send email when deep scan starts."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send deep scan started email to {email}")
        return

    try:
        resend.Emails.send({
            "from": settings.email_from,
            "to": email,
            "subject": f"Deep analysis started for {target_url}",
            "html": f"""
            <h2>Deep analysis in progress</h2>
            <p>We're running a thorough security analysis on <strong>{target_url}</strong>.</p>
            <p>This usually takes 1-4 hours depending on your application's complexity.</p>
            <p>We'll email you when it's ready.</p>
            """,
        })
    except Exception as e:
        logger.error(f"Failed to send deep scan started email to {email}: {e}")


async def send_payment_received_email(email: str, scan_id: str, tier: str):
    """Send email when payment is received."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send payment received email to {email}")
        return

    try:
        resend.Emails.send({
            "from": settings.email_from,
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
    except Exception as e:
        logger.error(f"Failed to send payment received email to {email}: {e}")


async def send_pdf_report_email(email: str, scan_id: str, target_url: str):
    """Send PDF report to user's email."""
    if not settings.resend_api_key:
        print(f"[DEV] Would send PDF report email to {email}")
        return

    try:
        resend.Emails.send({
            "from": settings.email_from,
            "to": email,
            "subject": f"Security Report: {target_url}",
            "html": f"""
            <div style="font-family: 'SF Mono', Consolas, monospace; background: #09090b; color: #fafafa; padding: 40px; max-width: 600px; margin: 0 auto;">
                <div style="border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #06b6d4; font-size: 24px; margin: 0;">NULLSCAN</h1>
                    <p style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 0 0;">Security Intelligence Report</p>
                </div>

                <h2 style="color: #fafafa; font-size: 18px; margin-bottom: 16px;">Your security report is ready</h2>

                <p style="color: #a1a1aa; line-height: 1.6;">
                    Your complete penetration test report for <strong style="color: #06b6d4;">{target_url}</strong> is ready to view online.
                </p>

                <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <p style="color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Report includes:</p>
                    <ul style="color: #a1a1aa; margin: 0; padding-left: 20px;">
                        <li>Executive summary & risk assessment</li>
                        <li>Detailed vulnerability findings</li>
                        <li>Proof-of-concept exploits</li>
                        <li>Remediation guidance</li>
                    </ul>
                </div>

                <a href="{settings.frontend_url}/results/{scan_id}"
                   style="display: inline-block; background: #06b6d4; color: #09090b; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px;">
                    View Online Report
                </a>

                <a href="{settings.api_url}/scans/{scan_id}/download-pdf"
                   style="display: inline-block; background: #27272a; color: #06b6d4; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 12px; margin-left: 12px;
                          border: 1px solid #06b6d4;">
                    Download PDF Report
                </a>

                <div style="border-top: 1px solid #27272a; margin-top: 40px; padding-top: 20px;">
                    <p style="color: #52525b; font-size: 12px; margin: 0;">
                        Questions? Reply to this email or visit nullscan.io
                    </p>
                </div>
            </div>
            """,
        })
    except Exception as e:
        logger.error(f"Failed to send PDF report email to {email}: {e}")
