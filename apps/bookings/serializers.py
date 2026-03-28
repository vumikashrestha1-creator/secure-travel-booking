from rest_framework import serializers
from django.utils   import timezone

from .models            import Booking
from apps.listings.models import Listing


class CreateBookingSerializer(serializers.ModelSerializer):
    """Used when a customer creates a new booking."""

    class Meta:
        model  = Booking
        fields = [
            "listing", "number_of_guests", "special_requests",
        ]

    def validate_listing(self, value):
        if not value.is_available:
            raise serializers.ValidationError(
                "This listing is not available for booking."
            )
        return value

    def validate_number_of_guests(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Number of guests must be at least 1."
            )
        return value

    def validate(self, attrs):
        listing = attrs.get("listing")
        guests  = attrs.get("number_of_guests")

        if listing and guests:
            if guests > listing.available_seats:
                raise serializers.ValidationError(
                    {
                        "number_of_guests": (
                            f"Only {listing.available_seats} seats available "
                            f"for this listing."
                        )
                    }
                )
        return attrs

    def create(self, validated_data):
        listing  = validated_data["listing"]
        guests   = validated_data["number_of_guests"]
        user     = self.context["request"].user

        # Lock price at time of booking
        price    = listing.discounted_price
        total    = price * guests
        discount = listing.discount_percent

        booking = Booking.objects.create(
            user             = user,
            listing          = listing,
            number_of_guests = guests,
            special_requests = validated_data.get("special_requests", ""),
            price_per_person = price,
            total_price      = total,
            discount_applied = discount,
            status           = Booking.Status.PENDING,
        )

        # Reduce available seats
        listing.available_seats -= guests
        if listing.available_seats == 0:
            listing.status = listing.Status.SOLDOUT
        listing.save()

        return booking


class BookingSerializer(serializers.ModelSerializer):
    """Full booking details for reading."""
    listing_title       = serializers.CharField(source="listing.title",       read_only=True)
    listing_destination = serializers.CharField(source="listing.destination", read_only=True)
    listing_start_date  = serializers.DateField(source="listing.start_date",  read_only=True)
    listing_end_date    = serializers.DateField(source="listing.end_date",    read_only=True)
    listing_image       = serializers.ImageField(source="listing.image",      read_only=True)
    user_name           = serializers.CharField(source="user.full_name",      read_only=True)
    user_email          = serializers.CharField(source="user.email",          read_only=True)

    class Meta:
        model  = Booking
        fields = [
            "id", "booking_reference",
            "user", "user_name", "user_email",
            "listing", "listing_title", "listing_destination",
            "listing_start_date", "listing_end_date", "listing_image",
            "number_of_guests", "special_requests",
            "price_per_person", "total_price", "discount_applied",
            "status", "payment_status",
            "created_at", "updated_at", "cancelled_at",
        ]
        read_only_fields = fields


class UpdateBookingStatusSerializer(serializers.ModelSerializer):
    """Admin only — update booking status."""

    class Meta:
        model  = Booking
        fields = ["status", "payment_status"]