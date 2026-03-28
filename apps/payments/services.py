import random
import string
from django.utils import timezone
from .models import Payment
from apps.bookings.models import Booking


class MockPaymentProcessor:
    """
    Simulates a real payment gateway like Stripe.

    In a real project this class would:
    - Connect to Stripe API
    - Send card details securely
    - Handle webhooks for payment confirmation

    For this capstone we simulate the same flow without
    real money or real card details.
    """

    @staticmethod
    def generate_transaction_id():
        """Generate a fake transaction ID like a real gateway would."""
        chars = string.ascii_uppercase + string.digits
        return "TXN-" + "".join(random.choices(chars, k=12))

    @staticmethod
    def validate_card(card_number, expiry, cvv):
        """
        Simulate card validation.
        In real Stripe this happens on their servers — never ours.
        We only check basic format here.
        """
        # Remove spaces from card number
        card_number = card_number.replace(" ", "")

        if not card_number.isdigit():
            return False, "Card number must contain only digits."

        if len(card_number) not in [15, 16]:
            return False, "Card number must be 15 or 16 digits."

        if len(cvv) not in [3, 4]:
            return False, "CVV must be 3 or 4 digits."

        # Simulate declined card (any card ending in 0000)
        if card_number.endswith("0000"):
            return False, "Card was declined by the bank."

        return True, "Card is valid."

    @staticmethod
    def detect_card_type(card_number):
        """Detect card type from first digit."""
        card_number = card_number.replace(" ", "")
        if card_number.startswith("4"):
            return "VISA"
        elif card_number.startswith(("51", "52", "53", "54", "55")):
            return "MASTERCARD"
        elif card_number.startswith(("34", "37")):
            return "AMEX"
        return "UNKNOWN"

    def process_payment(self, payment, card_data):
        """
        Main payment processing function.

        Steps:
        1. Validate card
        2. Simulate processing (90% success rate like real world)
        3. Update payment record
        4. Update booking status
        5. Return result
        """
        card_number = card_data.get("card_number", "")
        expiry      = card_data.get("expiry", "")
        cvv         = card_data.get("cvv", "")

        # Step 1 — Validate card format
        is_valid, message = self.validate_card(card_number, expiry, cvv)
        if not is_valid:
            payment.status         = Payment.Status.FAILED
            payment.failure_reason = message
            payment.save()

            # Update booking payment status
            booking = payment.booking
            booking.payment_status = Booking.PaymentStatus.FAILED
            booking.save()

            return {
                "success": False,
                "message": message,
                "payment_reference": payment.payment_reference,
            }

        # Step 2 — Detect card type and mask number
        card_type      = self.detect_card_type(card_number)
        card_last_four = card_number.replace(" ", "")[-4:]

        # Step 3 — Simulate 90% success rate
        # In real Stripe, success/failure comes from the bank
        success = random.random() > 0.1
        #success = True  # For testing, we can force success

        if success:
            # Payment successful
            transaction_id = self.generate_transaction_id()

            payment.status         = Payment.Status.COMPLETED
            payment.transaction_id = transaction_id
            payment.card_last_four = card_last_four
            payment.card_type      = card_type
            payment.paid_at        = timezone.now()
            payment.save()

            # Confirm the booking automatically
            booking = payment.booking
            booking.payment_status = Booking.PaymentStatus.PAID
            booking.status         = Booking.Status.CONFIRMED
            booking.save()

            return {
                "success":           True,
                "message":           "Payment processed successfully.",
                "payment_reference": payment.payment_reference,
                "transaction_id":    transaction_id,
                "amount":            str(payment.amount),
                "card_type":         card_type,
                "card_last_four":    card_last_four,
            }

        else:
            # Payment failed (simulated bank decline)
            payment.status         = Payment.Status.FAILED
            payment.failure_reason = "Payment declined by bank. Please try again."
            payment.save()

            booking = payment.booking
            booking.payment_status = Booking.PaymentStatus.FAILED
            booking.save()

            return {
                "success": False,
                "message": "Payment declined by bank. Please try again.",
                "payment_reference": payment.payment_reference,
            }

    def process_refund(self, payment, reason=""):
        """
        Simulate a refund for a cancelled booking.
        In real Stripe this would call stripe.Refund.create()
        """
        if payment.status != Payment.Status.COMPLETED:
            return {
                "success": False,
                "message": "Only completed payments can be refunded.",
            }

        payment.status        = Payment.Status.REFUNDED
        payment.refund_reason = reason
        payment.refunded_at   = timezone.now()
        payment.save()

        # Update booking payment status
        booking = payment.booking
        booking.payment_status = Booking.PaymentStatus.REFUNDED
        booking.save()

        return {
            "success": True,
            "message": "Refund processed successfully.",
            "payment_reference": payment.payment_reference,
            "refunded_amount":   str(payment.amount),
        }