import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/StarRating";
import ReviewCard from "../components/ReviewCard";
import ExternalBooking from "../components/ExternalBooking";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [listing,        setListing]        = useState(null);
  const [reviews,        setReviews]        = useState([]);
  const [avgRating,      setAvgRating]      = useState(0);
  const [totalRev,       setTotalRev]       = useState(0);
  const [breakdown,      setBreakdown]      = useState({});
  const [loading,        setLoading]        = useState(true);
  const [message,        setMessage]        = useState("");
  const [guests,         setGuests]         = useState(1);
  const [booking,        setBooking]        = useState(false);
  const [availability,   setAvailability]   = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewLoading,  setReviewLoading]  = useState(false);
  const [reviewData,     setReviewData]     = useState({
    rating:  5,
    title:   "",
    comment: "",
  });

  useEffect(() => {
    fetchListing();
    fetchReviews();
    fetchAvailability();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await api.get("/api/listings/" + id + "/");
      setListing(res.data);
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get("/api/reviews/listing/" + id + "/");
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.avg_rating || 0);
      setTotalRev(res.data.total_reviews || 0);
      setBreakdown(res.data.rating_breakdown || {});
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await api.get("/api/listings/" + id + "/availability/");
      setAvailability(res.data);
    } catch (error) {
      console.error("Availability error:", error);
    }
  };

  const handleBook = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (guests > listing.available_seats) {
      setMessage("Only " + listing.available_seats + " seats available.");
      return;
    }
    setBooking(true);
    try {
      const res = await api.post("/api/bookings/create/", {
        listing:          id,
        number_of_guests: guests,
      });
      const newBookingId = res.data.booking ? res.data.booking.id : res.data.id;
      navigate("/payment/" + newBookingId);
    } catch (error) {
      setMessage(error.response?.data?.error || "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      await api.post("/api/reviews/create/", {
        listing: id,
        ...reviewData,
      });
      setMessage("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewData({ rating: 5, title: "", comment: "" });
      fetchReviews();
      fetchListing();
    } catch (error) {
      const err = error.response?.data;
      if (err && err.listing) {
        setMessage(err.listing[0]);
      } else if (err && err.non_field_errors) {
        setMessage(err.non_field_errors[0]);
      } else {
        setMessage("Failed to submit review. Please try again.");
      }
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete your review?")) return;
    try {
      await api.delete("/api/reviews/" + reviewId + "/delete/");
      setMessage("Review deleted successfully.");
      fetchReviews();
      fetchListing();
    } catch (error) {
      setMessage("Failed to delete review.");
    }
  };

  const handleGuestChange = (e) => {
    const val = Number(e.target.value);
    if (listing && val > listing.available_seats) {
      setMessage("Only " + listing.available_seats + " seats available.");
    } else {
      setMessage("");
      setGuests(val);
    }
  };

  const getSeatsColor = (seats) => {
    if (seats > 10) return "text-green-600";
    if (seats > 0)  return "text-orange-500";
    return "text-red-600";
  };

  const getBarColor = (seats) => {
    if (seats > 10) return "bg-green-500";
    if (seats > 0)  return "bg-orange-400";
    return "bg-red-500";
  };

  const isMessageSuccess = (msg) => {
    return (
      msg.includes("success") ||
      msg.includes("created") ||
      msg.includes("Reference")
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-gray-500 text-lg">Listing not found.</p>
          <button
            onClick={() => navigate("/listings")}
            className="mt-4 bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-800"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  const discountedPrice = Number(listing.discounted_price);
  const totalPrice      = (discountedPrice * guests).toFixed(2);
  const percentBooked   = availability ? availability.percent_booked : 0;
  const barWidth        = (100 - percentBooked) + "%";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-teal-700">
        {listing.image_url && (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <button
          onClick={() => navigate("/listings")}
          className="absolute top-4 left-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm transition-all"
        >
          Back to Listings
        </button>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="bg-teal-600 bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium">
              {listing.listing_type}
            </span>
            {listing.discount_percent > 0 && (
              <span className="bg-red-500 px-3 py-1 rounded-full text-sm font-bold">
                {listing.discount_percent}% OFF
              </span>
            )}
            {!listing.is_available && (
              <span className="bg-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                SOLD OUT
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            {listing.title}
          </h1>
          <p className="text-teal-200 text-sm">
            {listing.origin} to {listing.destination}, {listing.country}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Message */}
        {message && (
          <div className={
            "mb-6 px-4 py-3 rounded-lg flex justify-between items-center " +
            (isMessageSuccess(message)
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700")
          }>
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="ml-4 text-sm underline">
              dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left Column ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Rating Summary */}
            {totalRev > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Guest Ratings</h2>
                <div className="flex items-center gap-6">
                  <div className="text-center shrink-0">
                    <p className="text-5xl font-bold text-teal-700">
                      {Number(avgRating).toFixed(1)}
                    </p>
                    <StarRating rating={avgRating} size="md" showNumber={false} />
                    <p className="text-sm text-gray-400 mt-1">
                      {totalRev} review{totalRev !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = breakdown[star + "_star"] || 0;
                      const pct   = totalRev > 0 ? Math.round((count / totalRev) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 w-4">{star}</span>
                          <span className="text-yellow-400">★</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: pct + "%" }} />
                          </div>
                          <span className="text-gray-400 w-4">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* About */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">About This Package</h2>
              <p className="text-gray-600 leading-relaxed">{listing.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-xl mb-1">⏱</p>
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="font-semibold text-gray-800 text-sm mt-1">{listing.duration_days} days</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-xl mb-1">📅</p>
                  <p className="text-xs text-gray-400">Start Date</p>
                  <p className="font-semibold text-gray-800 text-sm mt-1">{listing.start_date}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-xl mb-1">🏁</p>
                  <p className="text-xs text-gray-400">End Date</p>
                  <p className="font-semibold text-gray-800 text-sm mt-1">{listing.end_date}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-xl mb-1">💺</p>
                  <p className="text-xs text-gray-400">Seats Left</p>
                  <p className={"font-semibold text-sm mt-1 " + getSeatsColor(listing.available_seats)}>
                    {listing.available_seats > 0 ? listing.available_seats : "Sold Out"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {listing.includes_hotel && (
                  <span className="bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-sm font-medium">
                    🏨 Hotel Included
                  </span>
                )}
                {listing.includes_flight && (
                  <span className="bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-sm font-medium">
                    ✈️ Flight Included
                  </span>
                )}
                {listing.includes_meals && (
                  <span className="bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-sm font-medium">
                    🍽️ Meals Included
                  </span>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-gray-800">
                  Reviews
                  {totalRev > 0 && (
                    <span className="ml-2 bg-teal-50 text-teal-700 text-sm px-2 py-0.5 rounded-full">
                      {totalRev}
                    </span>
                  )}
                </h2>
                {isLoggedIn && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-800 transition-colors"
                  >
                    {showReviewForm ? "Cancel" : "Write a Review"}
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-4">Share Your Experience</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewData({ ...reviewData, rating: star })}
                          className={"text-3xl transition-all hover:scale-110 " + (star <= reviewData.rating ? "text-yellow-400" : "text-gray-300")}
                        >
                          ★
                        </button>
                      ))}
                      <span className="ml-2 text-gray-500 text-sm">{reviewData.rating} out of 5</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Review Title <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={reviewData.title}
                      onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                      placeholder="Summarise your experience"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Comment</label>
                    <textarea
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                      rows={4}
                      placeholder="Share your experience with other travellers..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition-colors disabled:bg-teal-300 text-sm font-medium"
                    >
                      {reviewLoading ? "Submitting..." : "Submit Review"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {!isLoggedIn && (
                <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 mb-4 text-center">
                  <p className="text-teal-700 text-sm">Please login to write a review</p>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-gray-400 font-medium">No reviews yet</p>
                  <p className="text-gray-300 text-sm mt-1">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onDelete={handleDeleteReview}
                      currentUserId={user && user.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column ─────────────────────────────────────── */}
          <div className="lg:col-span-1">

            {/* ── Sticky wrapper for BOTH booking card + external links ── */}
            <div className="sticky top-4 space-y-4">

              {/* Booking Card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

                {/* Price */}
                <div className="mb-4">
                  {listing.discount_percent > 0 && (
                    <p className="text-sm text-gray-400 line-through">${listing.price_per_person} per person</p>
                  )}
                  <p className="text-3xl font-bold text-teal-700">
                    ${discountedPrice}
                    <span className="text-base font-normal text-gray-400">/person</span>
                  </p>
                  {listing.discount_percent > 0 && (
                    <span className="inline-block mt-1 bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                      Save {listing.discount_percent}%
                    </span>
                  )}
                </div>

                {/* Availability */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Availability</span>
                    <span className={"font-medium " + getSeatsColor(listing.available_seats)}>
                      {listing.available_seats > 0 ? listing.available_seats + " seats left" : "Sold Out"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div
                      className={"h-2 rounded-full transition-all " + getBarColor(listing.available_seats)}
                      style={{ width: barWidth }}
                    />
                  </div>
                  {listing.available_seats > 0 && listing.available_seats <= 5 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                      <p className="text-orange-600 text-xs font-bold">
                        Only {listing.available_seats} seats left — book now!
                      </p>
                    </div>
                  )}
                </div>

                {/* Booking form or sold out */}
                {listing.is_available ? (
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                      <input
                        type="number"
                        min="1"
                        max={listing.available_seats}
                        value={guests}
                        onChange={handleGuestChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-center text-lg font-semibold"
                      />
                      {guests > listing.available_seats && (
                        <p className="text-red-500 text-xs mt-1 text-center">
                          Maximum {listing.available_seats} guests allowed
                        </p>
                      )}
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4 mb-4 text-center border border-teal-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Total Price</p>
                      <p className="text-2xl font-bold text-teal-700 mt-1">${totalPrice}</p>
                      <p className="text-xs text-gray-400 mt-1">for {guests} guest{guests !== 1 ? "s" : ""}</p>
                    </div>
                    <button
                      onClick={handleBook}
                      disabled={booking || guests > listing.available_seats}
                      className="w-full bg-teal-700 text-white py-3 rounded-xl hover:bg-teal-800 transition-colors font-semibold text-lg disabled:bg-teal-300 disabled:cursor-not-allowed"
                    >
                      {booking ? "Booking..." : "Book Now"}
                    </button>
                    {!isLoggedIn && (
                      <p className="text-center text-xs text-gray-400 mt-3">Login to complete booking</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-center">
                    <p className="text-2xl mb-2">😔</p>
                    <p className="text-red-600 font-semibold">Fully Booked</p>
                    <p className="text-red-400 text-sm mt-1">No seats available for this package</p>
                  </div>
                )}

                {/* Quick info */}
                <div className="border-t border-gray-100 mt-5 pt-5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Destination</span>
                    <span className="font-medium text-gray-700">{listing.destination}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Country</span>
                    <span className="font-medium text-gray-700">{listing.country}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Departure</span>
                    <span className="font-medium text-gray-700">{listing.start_date}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Return</span>
                    <span className="font-medium text-gray-700">{listing.end_date}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Duration</span>
                    <span className="font-medium text-gray-700">{listing.duration_days} days</span>
                  </div>
                </div>

                {avgRating > 0 && (
                  <div className="border-t border-gray-100 mt-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Guest Rating</span>
                      <StarRating rating={avgRating} size="sm" showNumber={true} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Based on {totalRev} review{totalRev !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* ── External Booking Platforms ── */}
              <ExternalBooking listing={listing} />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;