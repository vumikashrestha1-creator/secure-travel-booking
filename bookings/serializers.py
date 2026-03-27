# bookings/serializers.py

from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    """
    Full booking serializer.
    Used for reading booking details.
    """
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name  = serializers.ReadOnlyField(source='user.full_name')

    class Meta:
        model  = Booking
        fields = [
            'id', 'booking_reference', 'user_email', 'user_name',
            'service_type', 'destination', 'travel_date', 'return_date',
            'passengers', 'total_amount', 'status', 'notes',
            'created_at', 'updated_at', 'cancelled_at',
        ]
        read_only_fields = [
            'id', 'booking_reference', 'user_email', 'user_name',
            'created_at', 'updated_at', 'cancelled_at',
        ]


class CreateBookingSerializer(serializers.ModelSerializer):
    """
    Used when creating a new booking.
    User is set automatically from the request.
    """
    class Meta:
        model  = Booking
        fields = [
            'service_type', 'destination', 'travel_date',
            'return_date', 'passengers', 'total_amount', 'notes',
        ]

    def validate_passengers(self, value):
        if value < 1 or value > 9:
            raise serializers.ValidationError(
                'Number of passengers must be between 1 and 9.'
            )
        return value

    def validate_total_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                'Total amount must be greater than zero.'
            )
        return value

    def validate(self, attrs):
        # Return date must be after travel date
        travel_date = attrs.get('travel_date')
        return_date = attrs.get('return_date')
        if return_date and return_date <= travel_date:
            raise serializers.ValidationError(
                {'return_date': 'Return date must be after travel date.'}
            )
        return attrs

    def create(self, validated_data):
        # Automatically assign the logged-in user
        user = self.context['request'].user
        booking = Booking.objects.create(user=user, **validated_data)
        return booking


class CancelBookingSerializer(serializers.Serializer):
    """
    Used when cancelling a booking.
    Optionally accepts a reason for cancellation.
    """
    reason = serializers.CharField(required=False, allow_blank=True)
