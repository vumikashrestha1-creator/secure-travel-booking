# bookings/admin.py

from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ['booking_reference', 'user', 'service_type',
                     'destination', 'travel_date', 'total_amount', 'status']
    list_filter   = ['status', 'service_type', 'created_at']
    search_fields = ['booking_reference', 'user__email', 'destination']
    ordering      = ['-created_at']
    readonly_fields = ['booking_reference', 'created_at', 'updated_at']
