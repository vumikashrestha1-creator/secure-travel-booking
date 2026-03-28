from django.contrib import admin
from .models import Listing


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display  = [
        "title", "listing_type", "destination",
        "price_per_person", "available_seats", "status", "created_at"
    ]
    list_filter   = ["listing_type", "status", "country", "includes_hotel", "includes_flight"]
    search_fields = ["title", "destination", "country", "city"]
    ordering      = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]