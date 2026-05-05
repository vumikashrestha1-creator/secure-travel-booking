import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Payment = () => {
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const { isLoggedIn } = useAuth();

  const [booking,  setBooking]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(false);
  const [message,  setMessage]  = useState("");
  const [success,  setSuccess]  = useState(false);

  const [cardData, setCardData] = useState({
    card_number: "",
    expiry:      "",
    cvv:         "",
    card_holder: "",
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await api.get("/api/bookings/" + bookingId + "/");
      setBooking(res.data);
    } catch (error) {
      setMessage("Booking not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCardData({ ...cardData, [e.target.name]: e.target.value });
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, "").replace(/\D/g, "");
    const groups  = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 16) {
      setCardData({ ...cardData, card_number: formatted });
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setCardData({ ...cardData, expiry: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaying(true);
    setMessage("");

    try {
      const res = await api.post("/api/payments/pay/", {
        booking_id:  bookingId,
        method:      "CREDIT_CARD",
        card_number: cardData.card_number.replace(/\s/g, ""),
        expiry:      cardData.expiry,
        cvv:         cardData.cvv,
        card_holder: cardData.card_holder,
      });

      setSuccess(true);
      setMessage(
        "Payment successful! Reference: " + res.data.payment_reference
      );

      // Redirect to bookings after 3 seconds
      setTimeout(() => {
        navigate("/bookings");
      }, 3000);

    } catch (error) {
      const err = error.response?.data;
      if (err?.message) {
        setMessage(err.message);
      } else if (err?.error) {
        setMessage(err.error);
      } else {
        setMessage("Payment failed. Please check your card details.");
      }
    } finally {
      setPaying(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-500 mb-4">{message}</p>
          <div className="bg-teal-50 rounded-xl p-4 mb-6">
            <p className="text-teal-700 font-semibold text-sm">
              Your booking is now CONFIRMED
            </p>
            <p className="text-teal-500 text-xs mt-1">
              Redirecting to your bookings...
            </p>
          </div>
          <button
            onClick={() => navigate("/bookings")}
            className="w-full bg-teal-700 text-white py-3 rounded-xl hover:bg-teal-800 transition-colors font-semibold"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-teal-600 hover:text-teal-800 text-sm font-medium mb-4 flex items-center gap-1"
          >
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Complete Your Payment 💳
          </h1>
          <p className="text-gray-500 mt-1">
            Secure checkout — SafeNest Travel
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Left — Card Form ──────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">
              Card Details
            </h2>

            {/* Error message */}
            {message && !success && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                {message}
              </div>
            )}


            {/* Card preview */}
            {cardData.card_number && (
            <div className="bg-gradient-to-br from-teal-600 to-teal-900 rounded-2xl p-5 text-white mb-5">
                <div className="flex justify-between items-start mb-8">
                <span className="text-teal-200 text-sm font-medium">
                    SafeNest Travel
                </span>
                <span className="text-white font-bold text-lg">
                    {cardData.card_number.replace(/\s/g, "").startsWith("4")
                    ? "VISA"
                    : cardData.card_number.replace(/\s/g, "").startsWith("5")
                    ? "MASTERCARD"
                    : "CARD"}
                </span>
                </div>
                <p className="font-mono text-xl tracking-widest mb-4">
                {cardData.card_number
                    ? cardData.card_number
                        .replace(/\s/g, "")
                        .padEnd(16, "•")
                        .replace(/(.{4})/g, "$1 ")
                        .trim()
                    : "•••• •••• •••• ••••"}
                </p>
                <div className="flex justify-between items-end">
                <div>
                    <p className="text-teal-300 text-xs uppercase mb-1">
                    Card Holder
                    </p>
                    <p className="font-semibold text-sm">
                    {cardData.card_holder || "YOUR NAME"}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-teal-300 text-xs uppercase mb-1">
                    Expires
                    </p>
                    <p className="font-semibold text-sm">
                    {cardData.expiry || "MM/YY"}
                    </p>
                </div>
                </div>
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Card holder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Holder Name
                </label>
                <input
                  type="text"
                  name="card_holder"
                  value={cardData.card_holder}
                  onChange={handleChange}
                  placeholder="Name on card"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              {/* Card number */}
            
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                </label>
                <div className="relative">
                    <input
                    type="text"
                    value={cardData.card_number}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    required
                    maxLength={19}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono tracking-widest"
                    autoComplete="cc-number"
                    />
                    <span className="absolute right-3 top-3 text-gray-400 text-lg">
                    {cardData.card_number.replace(/\s/g, "").startsWith("4")
                        ? "💳 VISA"
                        : cardData.card_number.replace(/\s/g, "").startsWith("5")
                        ? "💳 MC"
                        : "💳"}
                    </span>
                </div>
                </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardData.expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    required
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    name="cvv"
                    value={cardData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    required
                    maxLength={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              {/* Security note */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <p className="text-xs text-gray-500">
                  Your payment is secured with SSL encryption.
                  Card details are never stored.
                </p>
              </div>

              {/* Pay button */}
              <button
                type="submit"
                disabled={paying}
                className="w-full bg-teal-700 text-white py-4 rounded-xl hover:bg-teal-800 transition-colors font-bold text-lg disabled:bg-teal-300 disabled:cursor-not-allowed"
              >
                {paying
                  ? "Processing Payment..."
                  : "Pay $" + (booking ? booking.total_price : "0")}
              </button>
            </form>
          </div>

          {/* ── Right — Booking Summary ───────────────────────── */}
          <div className="space-y-4">

            {/* Booking summary card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Booking Summary
              </h2>

              {booking && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Package</span>
                    <span className="font-medium text-gray-800 text-right max-w-xs">
                      {booking.listing_title}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Destination</span>
                    <span className="font-medium text-gray-800">
                      {booking.listing_destination}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Travel Date</span>
                    <span className="font-medium text-gray-800">
                      {booking.listing_start_date}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Guests</span>
                    <span className="font-medium text-gray-800">
                      {booking.number_of_guests} person(s)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price per Person</span>
                    <span className="font-medium text-gray-800">
                      ${booking.price_per_person}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reference</span>
                    <span className="font-medium text-teal-700">
                      {booking.booking_reference}
                    </span>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-800">
                        Total Amount
                      </span>
                      <span className="font-bold text-2xl text-teal-700">
                        ${booking.total_price}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Test cards info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <h3 className="font-semibold text-yellow-800 mb-3 text-sm">
                Test Card Numbers
              </h3>
              <div className="space-y-2 text-xs text-yellow-700">
                <div className="flex justify-between">
                  <span>Visa (Success)</span>
                  <span className="font-mono">4111 1111 1111 1111</span>
                </div>
                <div className="flex justify-between">
                  <span>Mastercard (Success)</span>
                  <span className="font-mono">5500 0000 0000 0004</span>
                </div>
                <div className="flex justify-between">
                  <span>Always Declined</span>
                  <span className="font-mono">4111 1111 1111 0000</span>
                </div>
                <div className="border-t border-yellow-200 pt-2 mt-2">
                  <p>Use any future expiry: 12/28</p>
                  <p>Use any CVV: 123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;