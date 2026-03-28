import uuid
from django.db import models
from django.core.validators import MinValueValidator


class Payment(models.Model):
    """
    Represents a payment made for a booking.
    Each booking can have one payment record.
    Payment history is never deleted — only status changes.
    """

    class Status(models.TextChoices):
        PENDING   = "PENDING",   "Pending"
        COMPLETED = "COMPLETED", "Completed"
        FAILED    = "FAILED",    "Failed"
        REFUNDED  = "REFUNDED",  "Refunded"
        CANCELLED = "CANCELLED", "Cancelled"

    class Method(models.TextChoices):
        MOCK        = "MOCK",        "Mock Payment"
        CREDIT_CARD = "CREDIT_CARD", "Credit Card"
        DEBIT_CARD  = "DEBIT_CARD",  "Debit Card"
        PAYPAL      = "PAYPAL",      "PayPal"

    # ── Relationships ─────────────────────────────────────────────
    # Each payment belongs to one booking and one user
    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="payment",
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="payments",
    )

    # ── Payment Identity ──────────────────────────────────────────
    # Unique reference shown to customer e.g. PAY-ABC12345
    payment_reference = models.CharField(
        max_length=50, unique=True, blank=True
    )
    # Transaction ID returned by payment gateway (Stripe etc.)
    transaction_id = models.CharField(
        max_length=255, blank=True, null=True
    )

    # ── Amount ────────────────────────────────────────────────────
    amount   = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    currency = models.CharField(max_length=10, default="USD")

    # ── Payment Details ───────────────────────────────────────────
    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.MOCK,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    # ── Card Details (masked for security — never store full number)
    card_last_four = models.CharField(max_length=4, blank=True, null=True)
    card_type      = models.CharField(max_length=20, blank=True, null=True)

    # ── Extra Info ────────────────────────────────────────────────
    notes          = models.TextField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    refund_reason  = models.TextField(blank=True, null=True)

    # ── Timestamps ────────────────────────────────────────────────
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)
    paid_at       = models.DateTimeField(null=True, blank=True)
    refunded_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table         = "payments"
        ordering         = ["-created_at"]
        verbose_name     = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"{self.payment_reference} - {self.status} - ${self.amount}"

    def save(self, *args, **kwargs):
        # Auto-generate payment reference like PAY-A1B2C3D4
        if not self.payment_reference:
            self.payment_reference = (
                "PAY-" + str(uuid.uuid4()).upper()[:8]
            )
        super().save(*args, **kwargs)