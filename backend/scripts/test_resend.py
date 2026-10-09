import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

# Add backend directory to sys.path so config can be imported directly
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import (
    RESEND_API_KEY,
    EMAIL_FROM,
    ADMIN_NOTIFICATION_EMAIL,
    DEMO_EMAIL_OVERRIDE,
    RESEND_TEST_RECIPIENT
)
from app.email_service import is_valid_email, sanitize_error_message

def run_diagnostic(test_to: str = None) -> int:
    print("=" * 65)
    print("      CIVICAI RESEND EMAIL DIAGNOSTIC & VERIFICATION TOOL       ")
    print("=" * 65)

    # 1. Verify API Key
    if not RESEND_API_KEY:
        print("\n[FAIL] RESEND_API_KEY is missing or empty in .env.")
        print("Action: Set RESEND_API_KEY=re_... in backend/.env before running this test.")
        return 1

    prefix = RESEND_API_KEY[:4] if len(RESEND_API_KEY) >= 4 else "re"
    print(f"\n[OK] RESEND_API_KEY: Configured (Length: {len(RESEND_API_KEY)}, Prefix: '{prefix}...', Secret masked)")

    # 2. Verify Sender
    if not EMAIL_FROM:
        print("[FAIL] EMAIL_FROM is not configured in backend/.env.")
        return 1

    print(f"[OK] EMAIL_FROM: '{EMAIL_FROM}'")
    if "onboarding@resend.dev" in EMAIL_FROM.lower():
        print("     [INFO] Sender Notice: 'onboarding@resend.dev' is Resend's default free test domain.")
        print("            Resend restricts this domain to send ONLY to the account owner's registered address.")

    # 3. Determine Test Recipient
    recipient = (
        test_to
        or RESEND_TEST_RECIPIENT
        or ADMIN_NOTIFICATION_EMAIL
        or DEMO_EMAIL_OVERRIDE
    )

    if not recipient:
        print("\n[FAIL] No test recipient provided.")
        print("Action: Specify a recipient using one of:")
        print("  1. Command line argument: python -m scripts.test_resend --to your_email@domain.com")
        print("  2. Environment variable: RESEND_TEST_RECIPIENT=your_email@domain.com in .env")
        print("  3. Configured admin email: ADMIN_NOTIFICATION_EMAIL=your_email@domain.com in .env")
        print("  4. Configured demo override: DEMO_EMAIL_OVERRIDE=your_email@domain.com in .env")
        return 1

    recipient = recipient.strip()
    if not is_valid_email(recipient):
        print(f"\n[FAIL] Test recipient '{recipient}' is not a valid email address.")
        return 1

    print(f"[OK] Target Test Recipient: '{recipient}'")

    # 4. Execute Real Test Send
    print("\n[*] Initiating diagnostic test dispatch via Resend API...")
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    try:
        import resend
        resend.api_key = RESEND_API_KEY

        params = {
            "from": EMAIL_FROM,
            "to": [recipient],
            "subject": f"[CivicAI Diagnostic] Resend Delivery Verification ({timestamp})",
            "html": f"""
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #DCE4EC; border-radius: 8px; max-width: 500px;">
              <h2 style="color: #0B1F3A; margin-top: 0;">CivicAI Resend Diagnostic Test</h2>
              <p style="color: #475569; font-size: 14px;">This is an explicit diagnostic test dispatch confirming Resend connectivity and credentials.</p>
              <table style="font-size: 13px; color: #172B4D;">
                <tr><td style="color: #64748B;">Timestamp:</td><td><strong>{timestamp}</strong></td></tr>
                <tr><td style="color: #64748B;">Sender:</td><td>{EMAIL_FROM}</td></tr>
                <tr><td style="color: #64748B;">Recipient:</td><td>{recipient}</td></tr>
              </table>
              <div style="margin-top: 15px; padding: 10px; background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 4px; color: #065F46; font-size: 12px;">
                Resend API successfully accepted this test email.
              </div>
            </div>
            """,
            "text": f"CivicAI Resend Diagnostic Test\nTimestamp: {timestamp}\nSender: {EMAIL_FROM}\nRecipient: {recipient}\nStatus: API accepted."
        }

        response = resend.Emails.send(params)

        provider_id = None
        if isinstance(response, dict):
            provider_id = response.get("id")
        elif hasattr(response, "id"):
            provider_id = getattr(response, "id")

        print("\n" + "=" * 65)
        print("[SUCCESS] Resend accepted the test email for delivery!")
        print(f"Provider Message ID: {provider_id}")
        print("=" * 65)
        print("\n[IMPORTANT OBSERVABILITY NOTE]")
        print("API acceptance confirms that Resend accepted the message into its queue.")
        print("Inbox delivery depends on the recipient's mailbox provider and domain DNS configuration.")
        print("Check your recipient inbox and Resend Dashboard (https://resend.com/emails) for delivery status.")
        return 0

    except Exception as e:
        sanitized_msg, is_retryable = sanitize_error_message(e)
        print("\n" + "=" * 65)
        print("[ERROR] Resend API rejected the email dispatch request:")
        print(f"  {sanitized_msg}")
        print("=" * 65)

        if "Account Restriction" in sanitized_msg or "testing emails to your own email address" in str(e):
            print("\n[ACTIONABLE RESOLUTION GUIDANCE]")
            print("1. Why this happened: You are using the default free onboarding sender (onboarding@resend.dev).")
            print("   Resend allows sending ONLY to the email address registered with your Resend account.")
            print("2. How to fix for Testing / Hackathon Demos:")
            print("   Add this line to backend/.env:")
            print("   DEMO_EMAIL_OVERRIDE=<your_resend_account_registered_email>")
            print("   ADMIN_NOTIFICATION_EMAIL=<your_resend_account_registered_email>")
            print("3. How to fix for Production / Arbitrary Citizen Emails:")
            print("   Verify a custom domain in Resend (https://resend.com/domains), then set:")
            print("   EMAIL_FROM=CivicAI Alerts <alerts@yourdomain.com>")

        return 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CivicAI Resend Email Diagnostic Tool")
    parser.add_argument("--to", help="Explicit recipient email address for diagnostic send", default=None)
    args = parser.parse_args()

    sys.exit(run_diagnostic(test_to=args.to))
