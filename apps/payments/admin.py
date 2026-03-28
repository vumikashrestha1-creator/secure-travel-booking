from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "payment_reference", "user", "booking",
        "amount", "method", "status",
        "card_type", "card_last_four",
        "created_at", "paid_at",
    ]
    list_filter   = ["status", "method", "card_type"]
    search_fields = [
        "payment_reference", "transaction_id",
        "user__email", "booking__booking_reference",
    ]
    ordering      = ["-created_at"]
    readonly_fields = [
        "payment_reference", "transaction_id",
        "amount", "created_at", "updated_at",
        "paid_at", "refunded_at",
    ]