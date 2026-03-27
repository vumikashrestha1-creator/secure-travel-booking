# bookings/views.py

from rest_framework          import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views    import APIView
from django.utils            import timezone

from .models       import Booking
from .serializers  import (
    BookingSerializer,
    CreateBookingSerializer,
    CancelBookingSerializer,
)


class CreateBookingView(generics.CreateAPIView):
    """
    POST /api/bookings/create/
    Create a new booking.
    Requires authentication.
    """
    serializer_class   = CreateBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response({
            'message': 'Booking created successfully.',
            'booking': BookingSerializer(booking).data,
        }, status=status.HTTP_201_CREATED)


class MyBookingsView(generics.ListAPIView):
    """
    GET /api/bookings/my-bookings/
    Returns all bookings for the logged-in user.
    Requires authentication.
    """
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return bookings belonging to the logged-in user
        return Booking.objects.filter(user=self.request.user)


class CancelBookingView(APIView):
    """
    POST /api/bookings/<id>/cancel/
    Cancel a booking by ID.
    Only the booking owner can cancel their own booking.
    Requires authentication.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Cannot cancel an already cancelled or completed booking
        if booking.status in ['cancelled', 'completed']:
            return Response(
                {'error': f'Cannot cancel a booking that is already {booking.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status and set cancelled_at timestamp
        booking.status       = 'cancelled'
        booking.cancelled_at = timezone.now()
        booking.save()

        return Response({
            'message': 'Booking cancelled successfully.',
            'booking': BookingSerializer(booking).data,
        }, status=status.HTTP_200_OK)


class AllBookingsView(generics.ListAPIView):
    """
    GET /api/bookings/all/
    Returns all bookings in the system.
    Admin only.
    """
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only admins can see all bookings
        if not self.request.user.is_admin:
            return Booking.objects.none()
        return Booking.objects.all()

    def list(self, request, *args, **kwargs):
        if not request.user.is_admin:
            return Response(
                {'error': 'You do not have permission to view all bookings.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)


class BookingDetailView(generics.RetrieveAPIView):
    """
    GET /api/bookings/<id>/
    Returns details of a single booking.
    Owner or admin only.
    """
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Booking.objects.all()
        return Booking.objects.filter(user=user)
