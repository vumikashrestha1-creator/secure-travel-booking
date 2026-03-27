# payments/serializers.py

from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """
    Full payment serializer.
    Used for reading payment details.
    Never exposes raw card data.
    """
    user_email        = serializers.ReadOnlyField(source='user.email')
    booking_reference = serializers.ReadOnlyField(source='booking.booking_reference')

    class Meta:
        model  = Payment
        fields = [
            'id', 'transaction_id', 'user_email', 'booking_reference',
            'payment_method', 'amount', 'currency', 'status',
            'payment_gateway', 'created_at', 'processed_at',
        ]
        read_only_fields = [
            'id', 'transaction_id', 'user_email', 'booking_reference',
            'created_at', 'processed_at',
        ]


class MockPaymentSerializer(serializers.Serializer):
    """
    Used for mock payment processing.
    Simulates a payment without real card processing.
    """
    booking_id     = serializers.IntegerField()
    payment_method = serializers.ChoiceField(
                         choices=['mock', 'stripe', 'paypal'],
                         default='mock'
                     )
    card_name      = serializers.CharField(max_length=100, required=False)

    def validate_booking_id(self, value):
        from bookings.models import Booking
        try:
            booking = Booking.objects.get(pk=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError('Booking not found.')

        # Cannot pay for a cancelled or completed booking
        if booking.status in ['cancelled', 'completed']:
            raise serializers.ValidationError(
                f'Cannot process payment for a {booking.status} booking.'
            )

        # Cannot pay if payment already exists
        if hasattr(booking, 'payment') and booking.payment.status == 'completed':
            raise serializers.ValidationError(
                'This booking has already been paid.'
            )

        return value
