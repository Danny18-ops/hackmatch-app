"""Transactional email via Resend, with a safe log-only fallback.

If RESEND_API_KEY is unset (local dev, CI), emails are logged instead of sent
and nothing fails. Sending is always wrapped so email problems never break
the auth flow that triggered them.
"""
import logging

from backend.config import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html: str) -> None:
    if not settings.resend_api_key:
        logger.info("[email:log-only] to=%s subject=%r (set RESEND_API_KEY to send)", to, subject)
        return
    try:
        import resend

        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": settings.email_from,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info("Sent email to %s: %s", to, subject)
    except Exception as ex:  # never let email break the request
        logger.warning("Email send failed (to=%s, subject=%r): %s", to, subject, ex)


def send_welcome_email(to: str, name: str) -> None:
    html = (
        f"<h2>Welcome to HackMatch, {name}! 🎉</h2>"
        "<p>Your account is ready. Set your skills and interests to get "
        "AI-matched to hackathons, conferences, and meetups.</p>"
        "<p>— The HackMatch team</p>"
    )
    _send(to, "Welcome to HackMatch 🎉", html)


def send_signin_email(to: str, name: str) -> None:
    html = (
        f"<h2>New sign-in to HackMatch</h2>"
        f"<p>Hi {name}, we noticed a new sign-in to your HackMatch account. "
        "If this was you, no action is needed.</p>"
        "<p>If it wasn't you, please reset your password.</p>"
    )
    _send(to, "New sign-in to HackMatch", html)
