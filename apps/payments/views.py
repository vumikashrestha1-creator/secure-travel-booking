from rest_framework             import status, generics
from rest_framework.response    import Response
from rest_framework.views       import APIView
from rest_framework.permissions import IsAuthenticated

from apps.bookings.models       import Booking
from apps.users.permissions     import IsAdmin
from .models                    import Payment
from .serializers               import (
    InitiatePaymentSerializer,
    PaymentSerializer,
    RefundSerializer,
)
from .services import MockPaymentProcessor


# ── Customer: Initiate Payment ────────────────────────────────────
class InitiatePaymentView(APIView):
    """
    Customer calls this after creating a booking.
    Steps:
    1. Validate the request
    2. Check the booking belongs to this customer
    3. Check no payment already exists
    4. Create a pending payment record
    5. Process the payment via MockPaymentProcessor
    6. Return result to customer
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        booking_id = serializer.validated_data["booking_id"]
        method     = serializer.validated_data.get("method", "MOCK")

        # Step 1 — Find the booking
        try:
            booking = Booking.objects.get(
                pk=booking_id, user=request.user
            )
        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Step 2 — Check booking is in correct state
        if booking.status == Booking.Status.CANCELLED:
            return Response(
                {"error": "Cannot pay for a cancelled booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status == Booking.Status.COMPLETED:
            return Response(
                {"error": "This booking is already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 3 — Check if payment already exists and completed
        if hasattr(booking, "payment"):
            existing = booking.payment
            if existing.status == Payment.Status.COMPLETED:
                return Response(
                    {
                        "error": "This booking has already been paid.",
                        "payment_reference": existing.payment_reference,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Delete failed payment so customer can retry
            if existing.status == Payment.Status.FAILED:
                existing.delete()

        # Step 4 — Create pending payment record
        payment = Payment.objects.create(
            booking = booking,
            user    = request.user,
            amount  = booking.total_price,
            method  = method,
            status  = Payment.Status.PENDING,
        )

        # Step 5 — Build card data for processor
        card_data = {
            "card_number": serializer.validated_data.get(
                "card_number", "4111111111111111"
            ),
            "expiry": serializer.validated_data.get("expiry", "12/28"),
            "cvv":    serializer.validated_data.get("cvv", "123"),
        }

        # Step 6 — Process payment
        processor = MockPaymentProcessor()
        result    = processor.process_payment(payment, card_data)

        # Step 7 — Return result
        if result["success"]:
            return Response(
                {
                    "message":           result["message"],
                    "payment_reference": result["payment_reference"],
                    "transaction_id":    result["transaction_id"],
                    "amount":            result["amount"],
                    "card_type":         result.get("card_type"),
                    "card_last_four":    result.get("card_last_four"),
                    "booking_status":    "CONFIRMED",
                    "payment_status":    "COMPLETED",
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "message":           result["message"],
                    "payment_reference": result["payment_reference"],
                    "payment_status":    "FAILED",
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


# ── Customer: View My Payments ────────────────────────────────────
class MyPaymentsView(generics.ListAPIView):
    """
    Returns all payments made by the logged-in customer.
    Customer can only see their own payments.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(
            user=self.request.user
        ).select_related("booking", "booking__listing", "user")


# ── Customer: Single Payment Detail ──────────────────────────────
class PaymentDetailView(APIView):
    """
    Returns details of one specific payment.
    Customers can only see their own payments.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            if request.user.role == "ADMIN":
                payment = Payment.objects.get(pk=pk)
            else:
                payment = Payment.objects.get(
                    pk=pk, user=request.user
                )
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)


# ── Admin: View All Payments ──────────────────────────────────────
class AdminPaymentListView(generics.ListAPIView):
    """
    Admin can see all payments across all users.
    Supports filtering by status.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class   = PaymentSerializer

    def get_queryset(self):
        queryset = Payment.objects.all().select_related(
            "booking", "booking__listing", "user"
        )

        # Filter by payment status
        pay_status = self.request.query_params.get("status")
        user_email = self.request.query_params.get("email")

        if pay_status:
            queryset = queryset.filter(status=pay_status.upper())
        if user_email:
            queryset = queryset.filter(
                user__email__icontains=user_email
            )

        return queryset


# ── Admin: Process Refund ─────────────────────────────────────────
class AdminRefundView(APIView):
    """
    Admin can issue a refund for any completed payment.
    This updates both payment and booking records.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = RefundSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        reason    = serializer.validated_data.get("reason", "")
        processor = MockPaymentProcessor()
        result    = processor.process_refund(payment, reason)

        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)