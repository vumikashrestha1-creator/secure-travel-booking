# payments/admin.py

from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display   = ['transaction_id', 'user', 'booking',
                      'amount', 'currency', 'payment_method', 'status']
    list_filter    = ['status', 'payment_method', 'created_at']
    search_fields  = ['transaction_id', 'user__email', 'booking__booking_reference']
    ordering       = ['-created_at']
    readonly_fields = ['transaction_id', 'payment_token', 'created_at', 'processed_at']
