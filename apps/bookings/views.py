from rest_framework             import status, generics
from rest_framework.response    import Response
from rest_framework.views       import APIView
from rest_framework.permissions import IsAuthenticated

from django.utils import timezone

from .models       import Booking
from .serializers  import (
    CreateBookingSerializer,
    BookingSerializer,
    UpdateBookingStatusSerializer,
)
from apps.users.permissions import IsAdmin, IsAdminOrTravelAgent


# ── Customer: Create Booking ──────────────────────────────────────
class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateBookingSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            booking = serializer.save()
            return Response(
                {
                    "message":   "Booking created successfully.",
                    "reference": booking.booking_reference,
                    "booking":   BookingSerializer(booking).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Customer: My Booking History ──────────────────────────────────
class MyBookingsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = BookingSerializer

    def get_queryset(self):
        queryset = Booking.objects.filter(
            user=self.request.user
        ).select_related("listing", "user")

        # Filter by status
        booking_status = self.request.query_params.get("status")
        if booking_status:
            queryset = queryset.filter(status=booking_status.upper())

        return queryset


# ── Customer: Single Booking Detail ──────────────────────────────
class BookingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            # Customers can only see their own bookings
            if request.user.role == "ADMIN":
                booking = Booking.objects.get(pk=pk)
            else:
                booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = BookingSerializer(booking)
        return Response(serializer.data)


# ── Customer: Cancel Booking ──────────────────────────────────────
class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if booking.status == Booking.Status.CANCELLED:
            return Response(
                {"error": "Booking is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status == Booking.Status.COMPLETED:
            return Response(
                {"error": "Cannot cancel a completed booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Restore available seats
        listing = booking.listing
        listing.available_seats += booking.number_of_guests
        if listing.status == listing.Status.SOLDOUT:
            listing.status = listing.Status.ACTIVE
        listing.save()

        # Update booking
        booking.status       = Booking.Status.CANCELLED
        booking.cancelled_at = timezone.now()
        booking.save()

        return Response(
            {"message": "Booking cancelled successfully."},
            status=status.HTTP_200_OK,
        )


# ── Admin: All Bookings ───────────────────────────────────────────
class AdminBookingListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrTravelAgent]
    serializer_class   = BookingSerializer

    def get_queryset(self):
        queryset = Booking.objects.all().select_related("listing", "user")

        booking_status = self.request.query_params.get("status")
        payment_status = self.request.query_params.get("payment_status")
        user_email     = self.request.query_params.get("email")

        if booking_status:
            queryset = queryset.filter(status=booking_status.upper())
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status.upper())
        if user_email:
            queryset = queryset.filter(user__email__icontains=user_email)

        return queryset


# ── Admin: Update Booking Status ──────────────────────────────────
class AdminUpdateBookingView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = UpdateBookingStatusSerializer(
            booking, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Booking updated.", "booking": serializer.data}
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)