import { useState, useEffect } from "react";
import api from "../api/axios";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [message,  setMessage]  = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/api/bookings/my-bookings/");
      setBookings(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }
    try {
      await api.post(`/api/bookings/${bookingId}/cancel/`);
      setMessage("Booking cancelled successfully.");
      fetchBookings();
    } catch (error) {
      setMessage(
        error.response?.data?.error || "Cancellation failed. Please try again."
      );
    }
  };

  const statusStyle = (status) => {
    const styles = {
      CONFIRMED: "bg-green-100 text-green-700",
      PENDING:   "bg-yellow-100 text-yellow-700",
      CANCELLED: "bg-red-100 text-red-700",
      COMPLETED: "bg-blue-100 text-blue-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const paymentStyle = (status) => {
    const styles = {
      PAID:     "bg-green-100 text-green-700",
      UNPAID:   "bg-yellow-100 text-yellow-700",
      FAILED:   "bg-red-100 text-red-700",
      REFUNDED: "bg-purple-100 text-purple-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title */}
        <h1 className="text-3xl font-bold text-blue-900 mb-8">
          My Bookings 📋
        </h1>

        {/* Success or error message */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg ${
              message.includes("successfully")
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your bookings...</p>
          </div>

        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-gray-500 text-lg">No bookings yet</p>
          </div>

        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                  {/* Booking details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="font-bold text-gray-800 text-lg">
                        {booking.listing_title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStyle(booking.payment_status)}`}
                      >
                        {booking.payment_status}
                      </span>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-500">Reference</p>
                        <p className="text-gray-800">
                          {booking.booking_reference}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Destination</p>
                        <p className="text-gray-800">
                          {booking.listing_destination}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Guests</p>
                        <p className="text-gray-800">
                          {booking.number_of_guests} person(s)
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Total Price</p>
                        <p className="font-bold text-blue-900">
                          ${booking.total_price}
                        </p>
                      </div>
                    </div>

                    {/* Travel dates */}
                    <div className="mt-3 flex gap-4 text-sm text-gray-500">
                      <span>
                        📅 From: {booking.listing_start_date}
                      </span>
                      <span>
                        📅 To: {booking.listing_end_date}
                      </span>
                    </div>
                  </div>

                  {/* Cancel button — only for PENDING bookings */}
                  {booking.status === "PENDING" && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;