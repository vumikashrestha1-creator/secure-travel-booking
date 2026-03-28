from django.db import models
from django.core.validators import MinValueValidator


class Booking(models.Model):
    """
    Represents a customer's booking for a travel listing.
    Links a User to a Listing with payment and status tracking.
    """

    class Status(models.TextChoices):
        PENDING   = "PENDING",   "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"

    class PaymentStatus(models.TextChoices):
        UNPAID    = "UNPAID",    "Unpaid"
        PAID      = "PAID",      "Paid"
        REFUNDED  = "REFUNDED",  "Refunded"
        FAILED    = "FAILED",    "Failed"

    # ── Relationships ─────────────────────────────────────────────
    user    = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    listing = models.ForeignKey(
        "listings.Listing",
        on_delete=models.CASCADE,
        related_name="bookings",
    )

    # ── Booking Details ───────────────────────────────────────────
    number_of_guests  = models.IntegerField(
        validators=[MinValueValidator(1)]
    )
    special_requests  = models.TextField(blank=True, null=True)
    booking_reference = models.CharField(max_length=20, unique=True)

    # ── Pricing snapshot (locked at booking time) ─────────────────
    price_per_person  = models.DecimalField(max_digits=10, decimal_places=2)
    total_price       = models.DecimalField(max_digits=10, decimal_places=2)
    discount_applied  = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # ── Status ────────────────────────────────────────────────────
    status         = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
    )

    # ── Timestamps ────────────────────────────────────────────────
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)
    cancelled_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table  = "bookings"
        ordering  = ["-created_at"]
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"

    def __str__(self):
        return f"Booking {self.booking_reference} - {self.user.email}"

    def save(self, *args, **kwargs):
        # Auto-generate booking reference if not set
        if not self.booking_reference:
            import uuid
            self.booking_reference = "TRV" + str(uuid.uuid4()).upper()[:8]

        # Auto-calculate total price
        if self.price_per_person and self.number_of_guests:
            self.total_price = self.price_per_person * self.number_of_guests

        super().save(*args, **kwargs)