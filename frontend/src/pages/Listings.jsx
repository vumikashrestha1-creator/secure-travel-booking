import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/StarRating";
import FilterBar from "../components/FilterBar";
import AISearch from "../components/AISearch";

const DEFAULT_FILTERS = {
  search:     "",
  type:       "ALL",
  sort:       "newest",
  min_price:  "",
  max_price:  "",
  min_rating: "",
  available:  "",
  start_date: "",
  duration:   "",
};

// ── Badge calculation logic ───────────────────────────────────────
const calculateBadges = (listings) => {
  if (!listings || listings.length === 0) return {};
  const available = listings.filter((l) => l.available_seats > 0);
  if (available.length === 0) return {};

  const cheapest  = available.reduce((min, l) => Number(l.discounted_price) < Number(min.discounted_price) ? l : min);
  const fastest   = available.reduce((min, l) => l.duration_days < min.duration_days ? l : min);
  const bestValue = available.reduce((best, l) => {
    const score = Number(l.rating || 0) * 30 + Number(l.discount_percent || 0) * 20 - Number(l.discounted_price || 0) / 100;
    const bestScore = Number(best.rating || 0) * 30 + Number(best.discount_percent || 0) * 20 - Number(best.discounted_price || 0) / 100;
    return score > bestScore ? l : best;
  });
  const popular = available.reduce((min, l) => l.available_seats < min.available_seats ? l : min);

  const usedIds = new Set();
  const result  = {};
  if (cheapest)  { result.cheapest  = cheapest.id;  usedIds.add(cheapest.id);  }
  if (fastest   && !usedIds.has(fastest.id))   { result.fastest   = fastest.id;   usedIds.add(fastest.id);   }
  if (bestValue && !usedIds.has(bestValue.id)) { result.bestValue = bestValue.id; usedIds.add(bestValue.id); }
  if (popular   && !usedIds.has(popular.id))   { result.popular   = popular.id;   }
  return result;
};

// ── Badge component ───────────────────────────────────────────────
const ListingBadge = ({ type }) => {
  const badges = {
    cheapest:  { label: "💰 Cheapest",     cls: "bg-green-500 text-white"  },
    fastest:   { label: "⚡ Fastest",      cls: "bg-blue-500 text-white"   },
    bestValue: { label: "⭐ Best Value",   cls: "bg-yellow-500 text-white" },
    popular:   { label: "🔥 Selling Fast", cls: "bg-orange-500 text-white" },
  };
  const badge = badges[type];
  if (!badge) return null;
  return (
    <span className={"text-xs font-bold px-2 py-1 rounded-full shadow-sm " + badge.cls}>
      {badge.label}
    </span>
  );
};

// ── Platform badge on card ────────────────────────────────────────
const PlatformBadge = ({ listing }) => {
  const hasBooking = listing.booking_com_url;
  const hasAgoda   = listing.agoda_url;
  const hasSky     = listing.skyscanner_url;
  if (!hasBooking && !hasAgoda && !hasSky) return null;
  return (
    <div className="flex gap-1 mt-2 flex-wrap">
      {hasBooking && (
        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
          🏨 Booking.com
        </span>
      )}
      {hasAgoda && (
        <span className="text-xs bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full">
          🌏 Agoda
        </span>
      )}
      {hasSky && (
        <span className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-100 px-2 py-0.5 rounded-full">
          ✈️ Skyscanner
        </span>
      )}
    </div>
  );
};

const Listings = () => {
  const [listings,   setListings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [bookingId,  setBookingId]  = useState(null);
  const [guests,     setGuests]     = useState(1);
  const [message,    setMessage]    = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [total,      setTotal]      = useState(0);
  const [badges,     setBadges]     = useState({});

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)     params.append("search",     filters.search);
      if (filters.type && filters.type !== "ALL") params.append("type", filters.type);
      if (filters.sort && filters.sort !== "newest") params.append("sort", filters.sort);
      if (filters.min_price)  params.append("min_price",  filters.min_price);
      if (filters.max_price)  params.append("max_price",  filters.max_price);
      if (filters.min_rating) params.append("min_rating", filters.min_rating);
      if (filters.available)  params.append("available",  filters.available);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.duration)   params.append("duration",   filters.duration);

      const response = await api.get("/api/listings/?" + params.toString());
      const data = response.data.results || response.data;
      const list = Array.isArray(data) ? data : [];
      setListings(list);
      setTotal(list.length);
      setBadges(calculateBadges(list));
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchListings(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  const handleBook = async (listingId) => {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      const response = await api.post("/api/bookings/create/", {
        listing: listingId, number_of_guests: guests,
      });
      const newBookingId = response.data.booking ? response.data.booking.id : response.data.id;
      navigate("/payment/" + newBookingId);
    } catch (error) {
      setMessage(error.response?.data?.error || "Booking failed. Please try again.");
    }
  };

  const handleReset = () => { setFilters({ ...DEFAULT_FILTERS }); setShowFilter(false); };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => val !== "" && val !== "ALL" && val !== "newest" && key !== "search"
  );

  const getBadgeType = (listingId) => {
    if (badges.cheapest  === listingId) return "cheapest";
    if (badges.fastest   === listingId) return "fastest";
    if (badges.bestValue === listingId) return "bestValue";
    if (badges.popular   === listingId) return "popular";
    return null;
  };

  const typeIcon = (type) => {
    if (type === "HOTEL")  return "🏨";
    if (type === "FLIGHT") return "✈️";
    return "🌴";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal-900 mb-2">Travel Packages 🌍</h1>
          <p className="text-gray-500">Discover amazing destinations around the world</p>
        </div>

        {/* AI Search */}
        <AISearch />

        {/* Badge legend */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            { label: "💰 Cheapest",     cls: "bg-green-100 text-green-700 border border-green-200"   },
            { label: "⚡ Fastest",      cls: "bg-blue-100 text-blue-700 border border-blue-200"      },
            { label: "⭐ Best Value",   cls: "bg-yellow-100 text-yellow-700 border border-yellow-200"},
            { label: "🔥 Selling Fast", cls: "bg-orange-100 text-orange-700 border border-orange-200"},
          ].map((b) => (
            <span key={b.label} className={"text-xs px-3 py-1 rounded-full font-medium " + b.cls}>
              {b.label}
            </span>
          ))}
        </div>

        {/* Error */}
        {message && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="text-sm underline ml-4">dismiss</button>
          </div>
        )}

        {/* Search + Filter bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search destinations, packages..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white shadow-sm"
            />
          </div>
          {/* <button
            onClick={() => setShowFilter(!showFilter)}
            className={
              "px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex items-center gap-2 shadow-sm " +
              (showFilter ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-700 border-gray-200 hover:border-teal-400")
            }
          >
            <span>⚙️ Filters</span>
            {hasActiveFilters && (
              <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">!</span>
            )}
          </button> */}
          {/* {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="px-4 py-3 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors shadow-sm"
            >
              Reset
            </button>
          )} */}
        </div>

        <div className="flex gap-6">
          {/* Filter sidebar — always visible */}
          <div className="w-64 shrink-0">
            <FilterBar filters={filters} onFilterChange={setFilters} onReset={handleReset} />
          </div>

          
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Results + sort */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500 font-medium">
                {loading ? "Searching..." : total + " package" + (total !== 1 ? "s" : "") + " found"}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Sort:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="cheapest">Cheapest</option>
                  <option value="expensive">Most Expensive</option>
                  <option value="rating">Highest Rated</option>
                  <option value="duration">Shortest</option>
                  <option value="discount">Best Discount</option>
                </select>
              </div>
            </div>

            {/* Loading skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-8 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>

            ) : listings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-gray-600 text-lg font-semibold">No packages found</p>
                <p className="text-gray-400 text-sm mt-1 mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={handleReset}
                  className="bg-teal-700 text-white px-6 py-2.5 rounded-xl hover:bg-teal-800 transition-colors text-sm font-medium"
                >
                  Reset Filters
                </button>
              </div>

            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((listing) => {
                  const badgeType = getBadgeType(listing.id);
                  const borderCls =
                    badgeType === "bestValue" ? "border-yellow-300 ring-1 ring-yellow-200" :
                    badgeType === "cheapest"  ? "border-green-300 ring-1 ring-green-200"   :
                    badgeType === "fastest"   ? "border-blue-300 ring-1 ring-blue-200"     :
                    badgeType === "popular"   ? "border-orange-300 ring-1 ring-orange-200" :
                    "border-gray-100";

                  return (
                    <div
                      key={listing.id}
                      className={"bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 " + borderCls}
                    >
                      {/* Image */}
                      <div
                        onClick={() => navigate("/listings/" + listing.id)}
                        className="cursor-pointer relative h-48 overflow-hidden group"
                      >
                        {listing.image_url ? (
                          <img
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="bg-gradient-to-br from-teal-400 to-teal-700 h-full w-full flex items-center justify-center">
                            <span className="text-5xl">{typeIcon(listing.listing_type)}</span>
                          </div>
                        )}
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Type badge */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm text-teal-800 text-xs px-2 py-1 rounded-full font-semibold shadow">
                            {typeIcon(listing.listing_type)} {listing.listing_type}
                          </span>
                        </div>

                        {/* Discount badge */}
                        {listing.discount_percent > 0 && (
                          <div className="absolute top-3 right-3">
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow">
                              {listing.discount_percent}% OFF
                            </span>
                          </div>
                        )}

                        {/* Seats warning overlay */}
                        {listing.available_seats > 0 && listing.available_seats <= 5 && (
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="bg-orange-500/90 text-white text-xs px-2 py-1 rounded-full font-bold w-full text-center block">
                              🔥 Only {listing.available_seats} seats left!
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-4">
                        {/* Title */}
                        <h3
                          onClick={() => navigate("/listings/" + listing.id)}
                          className="font-bold text-gray-800 text-base leading-tight hover:text-teal-700 transition-colors cursor-pointer mb-1"
                        >
                          {listing.title}
                        </h3>
                        <p className="text-gray-400 text-xs mb-2">
                          📍 {listing.origin} → {listing.destination}
                        </p>

                        {/* Badge */}
                        {badgeType && (
                          <div className="mb-2">
                            <ListingBadge type={badgeType} />
                          </div>
                        )}

                        {/* Rating */}
                        {listing.rating > 0 && (
                          <div className="mb-2">
                            <StarRating rating={Number(listing.rating)} size="sm" showNumber={true} />
                          </div>
                        )}

                        {/* Info row */}
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                          <span>📅 {listing.start_date}</span>
                          <span>⏱ {listing.duration_days} days</span>
                        </div>

                        {/* Includes */}
                        <div className="flex gap-2 mb-2 text-xs text-gray-400 flex-wrap">
                          {listing.includes_hotel  && <span className="bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">🏨 Hotel</span>}
                          {listing.includes_flight && <span className="bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">✈️ Flight</span>}
                          {listing.includes_meals  && <span className="bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">🍽️ Meals</span>}
                        </div>

                        {/* Platform badges */}
                        <PlatformBadge listing={listing} />

                        {/* Price + booking */}
                        <div className="border-t border-gray-100 pt-3 mt-3">
                          <div className="flex justify-between items-end mb-3">
                            <div>
                              {listing.discount_percent > 0 && (
                                <p className="text-xs text-gray-400 line-through">${listing.price_per_person}</p>
                              )}
                              <p className="text-xl font-bold text-teal-800">
                                ${listing.discounted_price}
                                <span className="text-xs font-normal text-gray-400">/person</span>
                              </p>
                            </div>
                            <span className={
                              "text-xs font-semibold px-2 py-1 rounded-full " +
                              (listing.available_seats > 10 ? "bg-green-50 text-green-700" :
                               listing.available_seats > 0  ? "bg-orange-50 text-orange-700" :
                               "bg-red-50 text-red-700")
                            }>
                              {listing.available_seats > 0 ? listing.available_seats + " left" : "Sold Out"}
                            </span>
                          </div>

                          {/* Booking buttons */}
                          {bookingId === listing.id ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                                <label className="text-gray-500 text-xs font-medium">Guests:</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={listing.available_seats}
                                  value={guests}
                                  onChange={(e) => setGuests(Number(e.target.value))}
                                  className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm font-bold bg-white"
                                />
                                <span className="text-xs text-teal-700 font-bold ml-auto">
                                  ${(Number(listing.discounted_price) * guests).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleBook(listing.id)}
                                  className="flex-1 bg-teal-700 text-white py-2 rounded-xl text-xs font-semibold hover:bg-teal-800 transition-colors"
                                >
                                  Confirm Booking
                                </button>
                                <button
                                  onClick={() => setBookingId(null)}
                                  className="px-3 bg-gray-100 text-gray-600 py-2 rounded-xl text-xs hover:bg-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setBookingId(listing.id)}
                                disabled={!listing.available_seats}
                                className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs font-semibold transition-colors"
                              >
                                {listing.available_seats ? "Book Now" : "Sold Out"}
                              </button>
                              <button
                                onClick={() => navigate("/listings/" + listing.id)}
                                className="px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2.5 rounded-xl text-xs font-medium transition-colors border border-gray-200"
                              >
                                Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Listings;
