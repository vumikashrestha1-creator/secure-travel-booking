import random
import string
from django.core.mail import send_mail
from django.utils      import timezone
from datetime          import timedelta
from django.conf       import settings


def generate_otp():
    """Generate a 6-digit numeric OTP code."""
    return "".join(random.choices(string.digits, k=6))


def send_otp_email(user, otp_code):
    """Send OTP code to user's email address."""
    subject = "SafeNest Travel — Your Verification Code"

    message = (
        "Hello " + user.full_name + ",\n\n"
        "Your SafeNest Travel verification code is:\n\n"
        "    " + otp_code + "\n\n"
        "This code expires in 5 minutes.\n\n"
        "If you did not request this code please ignore this email.\n\n"
        "SafeNest Travel Security Team"
    )

    html_message = (
        "<div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;'>"
        "<div style='background:#0D9488;padding:24px;border-radius:8px 8px 0 0;'>"
        "<h1 style='color:white;margin:0;font-size:24px;'>SafeNest Travel</h1>"
        "<p style='color:#99f6e4;margin:4px 0 0 0;'>Security Verification</p>"
        "</div>"
        "<div style='background:#f9fafb;padding:32px;border-radius:0 0 8px 8px;'>"
        "<p style='color:#374151;font-size:16px;'>Hello <strong>"
        + user.full_name +
        "</strong>,</p>"
        "<p style='color:#374151;'>Your verification code is:</p>"
        "<div style='background:white;border:2px solid #0D9488;"
        "border-radius:8px;padding:20px;text-align:center;margin:20px 0;'>"
        "<span style='font-size:40px;font-weight:bold;"
        "letter-spacing:12px;color:#0D9488;'>"
        + otp_code +
        "</span>"
        "</div>"
        "<p style='color:#6B7280;font-size:14px;'>"
        "This code expires in <strong>5 minutes</strong>.</p>"
        "<p style='color:#6B7280;font-size:14px;'>"
        "If you did not request this code please ignore this email.</p>"
        "</div>"
        "</div>"
    )

    try:
        send_mail(
            subject        = subject,
            message        = message,
            from_email     = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [user.email],
            html_message   = html_message,
            fail_silently  = False,
        )
        return True
    except Exception as e:
        print("Email send error:", str(e))
        return False


def create_otp_for_user(user):
    """
    Generate OTP, save it to the user record,
    and send it to their email address.
    """
    otp_code        = generate_otp()
    user.mfa_secret = otp_code
    user.mfa_expiry = timezone.now() + timedelta(minutes=5)
    user.save(update_fields=["mfa_secret", "mfa_expiry"])
    send_otp_email(user, otp_code)
    return otp_code


def verify_otp_for_user(user, otp_code):
    """
    Verify the OTP code entered by the user.

    Checks:
    1. Was an OTP ever generated?
    2. Has the OTP expired?
    3. Does the code match?

    Returns: (success: bool, message: str)
    """
    if not user.mfa_secret:
        return False, "No OTP was requested. Please log in again."

    if timezone.now() > user.mfa_expiry:
        return False, "Your code has expired. Please log in again to get a new code."

    if user.mfa_secret != otp_code.strip():
        return False, "Incorrect code. Please check your email and try again."

    # Clear OTP after successful verification
    user.mfa_secret = None
    user.mfa_expiry = None
    user.save(update_fields=["mfa_secret", "mfa_expiry"])

    return True, "Verified successfully."