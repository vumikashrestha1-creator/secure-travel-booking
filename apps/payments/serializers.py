from rest_framework import serializers
from .models import Payment


class InitiatePaymentSerializer(serializers.Serializer):
    """
    Validates the payment request from the customer.
    We never store raw card details — only validate format here.
    In real Stripe, card details go directly to Stripe servers.
    """
    booking_id  = serializers.IntegerField(required=True)
    method      = serializers.ChoiceField(
        choices=Payment.Method.choices,
        default="MOCK"
    )

    # Card details — only required for card payments
    card_number = serializers.CharField(required=False, max_length=19)
    expiry      = serializers.CharField(required=False, max_length=7)
    cvv         = serializers.CharField(
        required=False, max_length=4, write_only=True
    )
    card_holder = serializers.CharField(required=False, max_length=100)

    def validate_card_number(self, value):
        # Strip spaces before validation
        clean = value.replace(" ", "")
        if not clean.isdigit():
            raise serializers.ValidationError(
                "Card number must contain only digits."
            )
        if len(clean) not in [15, 16]:
            raise serializers.ValidationError(
                "Card number must be 15 or 16 digits."
            )
        return value

    def validate_expiry(self, value):
        # Expected format: MM/YY
        if "/" not in value:
            raise serializers.ValidationError(
                "Expiry must be in MM/YY format."
            )
        parts = value.split("/")
        if len(parts) != 2:
            raise serializers.ValidationError(
                "Expiry must be in MM/YY format."
            )
        month, year = parts
        if not month.isdigit() or not year.isdigit():
            raise serializers.ValidationError(
                "Expiry must contain only numbers."
            )
        if int(month) < 1 or int(month) > 12:
            raise serializers.ValidationError(
                "Month must be between 01 and 12."
            )
        return value


class PaymentSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for displaying payment details.
    Never exposes sensitive card data — only masked info.
    """
    booking_reference = serializers.CharField(
        source="booking.booking_reference", read_only=True
    )
    listing_title = serializers.CharField(
        source="booking.listing.title", read_only=True
    )
    user_email = serializers.CharField(
        source="user.email", read_only=True
    )

    class Meta:
        model  = Payment
        fields = [
            "id", "payment_reference", "transaction_id",
            "booking", "booking_reference", "listing_title",
            "user", "user_email",
            "amount", "currency", "method", "status",
            "card_last_four", "card_type",
            "notes", "failure_reason",
            "created_at", "updated_at", "paid_at", "refunded_at",
        ]
        # All fields are read-only — payments are created by our logic
        read_only_fields = fields


class RefundSerializer(serializers.Serializer):
    """Validates a refund request from admin."""
    reason = serializers.CharField(required=False, max_length=500)