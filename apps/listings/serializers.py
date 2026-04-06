from rest_framework import serializers
from .models import Listing


# ── Full Listing Serializer (Admin/Agent) ─────────────────────────
class ListingSerializer(serializers.ModelSerializer):
    """Full listing details — used for create/update by admin/agent."""
    discounted_price = serializers.ReadOnlyField()
    is_available     = serializers.ReadOnlyField()
    seats_booked     = serializers.ReadOnlyField()
    created_by_name  = serializers.SerializerMethodField()

    class Meta:
        model  = Listing
        fields = [
            "id", "title", "description", "listing_type", "status",
            "origin", "destination", "country", "city",
            "price_per_person", "discount_percent", "discounted_price",
            "available_seats", "max_seats", "seats_booked",
            "start_date", "end_date", "duration_days",
            "includes_hotel", "includes_flight", "includes_meals",
            "image", "image_url",
            "rating", "is_available",
            "created_by", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name
        return None

    def validate(self, attrs):
        # End date must be after start date
        start = attrs.get("start_date")
        end   = attrs.get("end_date")
        if start and end and end <= start:
            raise serializers.ValidationError(
                {"end_date": "End date must be after start date."}
            )

        # Available seats cannot exceed max seats
        available = attrs.get("available_seats")
        max_s     = attrs.get("max_seats")
        if available and max_s and available > max_s:
            raise serializers.ValidationError(
                {"available_seats": "Available seats cannot exceed max seats."}
            )
        return attrs


# ── Compact Listing Serializer (Public Browse) ────────────────────
class ListingListSerializer(serializers.ModelSerializer):
    """Compact listing — used for browse/search results."""
    discounted_price = serializers.ReadOnlyField()
    is_available     = serializers.ReadOnlyField()

    class Meta:
        model  = Listing
        fields = [
            "id", "title", "listing_type", "status",
            "origin", "destination", "country", "city",
            "price_per_person", "discount_percent", "discounted_price",
            "available_seats", "start_date", "end_date",
            "duration_days", "includes_hotel", "includes_flight",
            "includes_meals", "image", "image_url",
            "rating", "is_available",
        ]