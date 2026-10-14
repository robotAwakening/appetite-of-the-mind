"""Send a project update to your opt-in subscribers (and nobody else).

It reads subscribers from the local database and sends through any SMTP
account (Gmail app password, Fastmail, Brevo, etc.). Every email includes a
working unsubscribe link and List-Unsubscribe header.

    python scripts/send_update.py outreach/update-template.md --dry-run
    python scripts/send_update.py outreach/update-template.md

Needs SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and FROM_EMAIL in .env.
The first line of the file is the subject line.
"""
import os
import smtplib
import sqlite3
import sys
import time
from email.message import EmailMessage
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
DB_PATH = Path(os.getenv("DB_PATH", ROOT / "data" / "campaign.db"))
PUBLIC_URL = os.getenv("PUBLIC_URL", "http://localhost:8000").rstrip("/")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if not args:
        sys.exit(__doc__)
    subject, _, body = Path(args[0]).read_text(encoding="utf-8").partition("\n")
    subject = subject.lstrip("# ").strip()

    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT email, unsubscribe_token FROM subscribers WHERE unsubscribed_at IS NULL"
    ).fetchall()
    print(f"{len(rows)} opted-in subscribers. Subject: {subject!r}")
    if dry or not rows:
        return

    smtp = smtplib.SMTP(os.environ["SMTP_HOST"], int(os.getenv("SMTP_PORT", "587")))
    smtp.starttls()
    smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
    for email, token in rows:
        unsub = f"{PUBLIC_URL}/unsubscribe?token={token}"
        msg = EmailMessage()
        msg["From"] = os.environ["FROM_EMAIL"]
        msg["To"] = email
        msg["Subject"] = subject
        msg["List-Unsubscribe"] = f"<{unsub}>"
        msg.set_content(f"{body.strip()}\n\n--\nYou're getting this because you subscribed at {PUBLIC_URL}.\n"
                        f"Unsubscribe: {unsub}\n")
        smtp.send_message(msg)
        time.sleep(1)  # stay well under provider rate limits
    smtp.quit()
    print("Done.")


if __name__ == "__main__":
    main()
