# bookings/models.py

from django.db import models
from django.conf import settings
import uuid


class Booking(models.Model):
    """
    Booking model.
    Represents a travel booking made by a customer.
    Links to the User model and stores all booking details.
    """

    # ── Status Choices ────────────────────────────────────────────────────────
    STATUS_CHOICES = (
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    )

    # ── Service Type Choices ──────────────────────────────────────────────────
    SERVICE_CHOICES = (
        ('flight',  'Flight'),
        ('hotel',   'Hotel'),
        ('package', 'Package'),
        ('tour',    'Tour'),
    )

    # ── Fields ────────────────────────────────────────────────────────────────
    user              = models.ForeignKey(
                            settings.AUTH_USER_MODEL,
                            on_delete=models.CASCADE,
                            related_name='bookings'
                        )
    booking_reference = models.CharField(max_length=20, unique=True, editable=False)
    service_type      = models.CharField(max_length=20, choices=SERVICE_CHOICES, default='flight')
    destination       = models.CharField(max_length=100)
    travel_date       = models.DateField()
    return_date       = models.DateField(null=True, blank=True)
    passengers        = models.PositiveIntegerField(default=1)
    total_amount      = models.DecimalField(max_digits=10, decimal_places=2)
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes             = models.TextField(blank=True, null=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)
    cancelled_at      = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table  = 'bookings'
        ordering  = ['-created_at']
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'

    def __str__(self):
        return f'{self.booking_reference} - {self.user.email} ({self.status})'

    def save(self, *args, **kwargs):
        # Auto-generate booking reference on first save
        if not self.booking_reference:
            self.booking_reference = self._generate_reference()
        super().save(*args, **kwargs)

    def _generate_reference(self):
        # Format: STB-2026-XXXXXX
        from datetime import date
        import random, string
        year   = date.today().year
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f'STB-{year}-{suffix}'
