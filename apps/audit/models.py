from django.db import models
from django.utils import timezone


class AuditLog(models.Model):
    """
    Records every important user action in the system.

    Real world use:
    - Security teams review these logs to detect suspicious activity
    - If something goes wrong, you can trace exactly what happened
    - Required for compliance in real financial/travel systems
    - Your supervisor can see this proves your system is secure
    """

    class Action(models.TextChoices):
        # Authentication actions
        LOGIN          = "LOGIN",          "User Login"
        LOGIN_FAILED   = "LOGIN_FAILED",   "Failed Login Attempt"
        LOGOUT         = "LOGOUT",         "User Logout"
        REGISTER       = "REGISTER",       "User Registration"
        PASSWORD_CHANGE= "PASSWORD_CHANGE","Password Changed"
        ACCOUNT_LOCKED = "ACCOUNT_LOCKED", "Account Locked"

        # Booking actions
        BOOKING_CREATED   = "BOOKING_CREATED",   "Booking Created"
        BOOKING_CANCELLED = "BOOKING_CANCELLED",  "Booking Cancelled"
        BOOKING_UPDATED   = "BOOKING_UPDATED",    "Booking Updated"

        # Payment actions
        PAYMENT_INITIATED = "PAYMENT_INITIATED",  "Payment Initiated"
        PAYMENT_SUCCESS   = "PAYMENT_SUCCESS",    "Payment Successful"
        PAYMENT_FAILED    = "PAYMENT_FAILED",     "Payment Failed"
        PAYMENT_REFUNDED  = "PAYMENT_REFUNDED",   "Payment Refunded"

        # Admin actions
        USER_DEACTIVATED  = "USER_DEACTIVATED",   "User Deactivated"
        LISTING_CREATED   = "LISTING_CREATED",    "Listing Created"
        LISTING_UPDATED   = "LISTING_UPDATED",    "Listing Updated"

    # ── Who did it ────────────────────────────────────────────
    # null=True because some actions happen before login
    user       = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="audit_logs"
    )
    user_email = models.CharField(
        max_length=255, blank=True, null=True
    )

    # ── What they did ─────────────────────────────────────────
    action      = models.CharField(
        max_length=50, choices=Action.choices
    )
    description = models.TextField(blank=True, null=True)

    # ── Request details ───────────────────────────────────────
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    user_agent  = models.TextField(blank=True, null=True)
    endpoint    = models.CharField(max_length=255, blank=True, null=True)
    method      = models.CharField(max_length=10,  blank=True, null=True)

    # ── Result ────────────────────────────────────────────────
    was_successful = models.BooleanField(default=True)
    extra_data     = models.JSONField(null=True, blank=True)

    # ── When ──────────────────────────────────────────────────
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table  = "audit_logs"
        ordering  = ["-timestamp"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"

    def __str__(self):
        return (
            f"{self.timestamp.strftime('%Y-%m-%d %H:%M')} | "
            f"{self.action} | "
            f"{self.user_email or 'Anonymous'}"
        )

    @classmethod
    def log(cls, action, user=None, request=None,
            description="", was_successful=True, extra_data=None):
        """
        Simple helper to create a log entry from anywhere in the code.

        Usage example:
            AuditLog.log(
                action="LOGIN",
                user=user,
                request=request,
                description="User logged in successfully"
            )
        """
        ip_address = None
        user_agent = None
        endpoint   = None
        method     = None

        if request:
            # Get real IP even behind a proxy
            x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded:
                ip_address = x_forwarded.split(",")[0].strip()
            else:
                ip_address = request.META.get("REMOTE_ADDR")

            user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]
            endpoint   = request.path
            method     = request.method

        return cls.objects.create(
            user           = user,
            user_email     = user.email if user else None,
            action         = action,
            description    = description,
            ip_address     = ip_address,
            user_agent     = user_agent,
            endpoint       = endpoint,
            method         = method,
            was_successful = was_successful,
            extra_data     = extra_data,
        )