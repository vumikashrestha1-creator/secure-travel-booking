# payments/models.py

from django.db   import models
from django.conf import settings
from bookings.models import Booking


class Payment(models.Model):
    """
    Payment model.
    Records every payment transaction linked to a booking.
    Uses tokenisation — no raw card data is ever stored.
    """

    # ── Status Choices ────────────────────────────────────────────────────────
    STATUS_CHOICES = (
        ('pending',    'Pending'),
        ('processing', 'Processing'),
        ('completed',  'Completed'),
        ('failed',     'Failed'),
        ('refunded',   'Refunded'),
    )

    # ── Payment Method Choices ────────────────────────────────────────────────
    METHOD_CHOICES = (
        ('mock',   'Mock Payment'),
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
    )

    # ── Fields ────────────────────────────────────────────────────────────────
    user            = models.ForeignKey(
                          settings.AUTH_USER_MODEL,
                          on_delete=models.CASCADE,
                          related_name='payments'
                      )
    booking         = models.OneToOneField(
                          Booking,
                          on_delete=models.CASCADE,
                          related_name='payment'
                      )
    transaction_id  = models.CharField(max_length=100, unique=True, editable=False)
    payment_method  = models.CharField(max_length=20, choices=METHOD_CHOICES, default='mock')
    amount          = models.DecimalField(max_digits=10, decimal_places=2)
    currency        = models.CharField(max_length=3, default='AUD')
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # ── Security — no raw card data stored ───────────────────────────────────
    payment_token   = models.CharField(max_length=255, blank=True, null=True)   # Tokenised reference only
    payment_gateway = models.CharField(max_length=50, blank=True, null=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at      = models.DateTimeField(auto_now_add=True)
    processed_at    = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table  = 'payments'
        ordering  = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f'{self.transaction_id} - {self.user.email} ({self.status})'

    def save(self, *args, **kwargs):
        # Auto-generate transaction ID on first save
        if not self.transaction_id:
            self.transaction_id = self._generate_transaction_id()
        super().save(*args, **kwargs)

    def _generate_transaction_id(self):
        # Format: TXN-XXXXXXXXXXXXXXXX
        import uuid
        return f'TXN-{uuid.uuid4().hex[:16].upper()}'
