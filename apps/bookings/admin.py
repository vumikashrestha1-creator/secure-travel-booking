from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = [
        "booking_reference", "user", "listing",
        "number_of_guests", "total_price",
        "status", "payment_status", "created_at"
    ]
    list_filter   = ["status", "payment_status"]
    search_fields = ["booking_reference", "user__email", "listing__title"]
    ordering      = ["-created_at"]
    readonly_fields = [
        "booking_reference", "price_per_person",
        "total_price", "created_at", "updated_at"
    ]