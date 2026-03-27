# payments/views.py

from rest_framework          import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views    import APIView
from django.utils            import timezone

from bookings.models import Booking
from .models         import Payment
from .serializers    import PaymentSerializer, MockPaymentSerializer


class MockPaymentView(APIView):
    """
    POST /api/payments/mock-pay/
    Process a mock payment for a booking.
    Simulates payment without real card processing.
    Requires authentication.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MockPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking_id     = serializer.validated_data['booking_id']
        payment_method = serializer.validated_data.get('payment_method', 'mock')

        # Get the booking — must belong to the logged-in user
        try:
            booking = Booking.objects.get(pk=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found or does not belong to you.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create or update payment record
        payment, created = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                'user':           request.user,
                'amount':         booking.total_amount,
                'currency':       'AUD',
                'payment_method': payment_method,
                'payment_gateway': 'mock_gateway',
                'status':         'processing',
            }
        )

        # Simulate successful payment
        payment.status       = 'completed'
        payment.processed_at = timezone.now()
        payment.payment_token = f'tok_mock_{booking.booking_reference}'  # Mock token only
        payment.save()

        # Update booking status to confirmed
        booking.status = 'confirmed'
        booking.save()

        return Response({
            'message':     'Payment processed successfully.',
            'payment':     PaymentSerializer(payment).data,
            'booking_ref': booking.booking_reference,
        }, status=status.HTTP_200_OK)


class MyPaymentsView(generics.ListAPIView):
    """
    GET /api/payments/my-payments/
    Returns all payments for the logged-in user.
    Requires authentication.
    """
    serializer_class   = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


class AllPaymentsView(generics.ListAPIView):
    """
    GET /api/payments/all/
    Returns all payments in the system.
    Admin only.
    """
    serializer_class   = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_admin:
            return Payment.objects.none()
        return Payment.objects.all()

    def list(self, request, *args, **kwargs):
        if not request.user.is_admin:
            return Response(
                {'error': 'You do not have permission to view all payments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)


class PaymentDetailView(generics.RetrieveAPIView):
    """
    GET /api/payments/<id>/
    Returns details of a single payment.
    Owner or admin only.
    """
    serializer_class   = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Payment.objects.all()
        return Payment.objects.filter(user=user)
