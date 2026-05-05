import { useState } from "react";
import api from "../api/axios";

const StarDisplay = ({ rating }) => {
  const stars = [];
  const full  = Math.floor(rating || 0);
  const half  = (rating || 0) % 1 >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < full)                stars.push("★");
    else if (i === full && half) stars.push("½");
    else                         stars.push("☆");
  }
  return (
    <span className="text-yellow-400 text-sm">
      {stars.join("")}
      <span className="text-gray-600 text-xs ml-1">
        {rating ? rating.toFixed(1) : "N/A"}
      </span>
    </span>
  );
};

const PriceBadge = ({ label }) => {
  if (!label || label === "Price not listed") return null;
  return (
    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
      {label}
    </span>
  );
};

const AISearch = () => {
  const [query,    setQuery]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [results,  setResults]  = useState([]);
  const [message,  setMessage]  = useState("");
  const [searched, setSearched] = useState(false);
  const [error,    setError]    = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setMessage("");
    setSearched(false);

    try {
      const resp = await api.post("/api/ai/search/", { query });
      setResults(resp.data.results || []);
      setMessage(resp.data.message || "");
      setSearched(true);
    } catch (err) {
      setError(
        err.response?.data?.error || "Search failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const suggestions = [
    "Best luxury hotel in Bali",
    "Cheap hotels in Tokyo",
    "5-star resort in Maldives",
    "Boutique hotel Paris",
  ];

  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-6 mb-8 shadow-sm">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center text-white text-lg shadow">
          🤖
        </div>
        <div>
          <h2 className="text-lg font-bold text-teal-900">
            AI Smart Search
          </h2>
          <p className="text-xs text-gray-500">
            Powered by Gemini + Google Places — real hotels, real ratings
          </p>
        </div>
      </div>

      {/* Search input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Try "best hotel in Bali" or "cheap resort Maldives"...'
          className="flex-1 px-4 py-3 rounded-xl border border-teal-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white shadow-sm"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-5 py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>🔍 Search</>
          )}
        </button>
      </div>

      {/* Suggestion chips */}
      {!searched && !loading && (
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="text-xs px-3 py-1 bg-white border border-teal-200 text-teal-700 rounded-full hover:bg-teal-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI summary message */}
      {searched && message && (
        <div className="mt-4 flex gap-3 bg-white border border-teal-100 rounded-xl px-4 py-3 shadow-sm">
          <span className="text-2xl">🤖</span>
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        </div>
      )}

      {/* Results */}
      {searched && results.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.map((place, idx) => (
            <div
              key={place.place_id || idx}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group"
            >
              {/* Photo */}
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-teal-400 to-teal-600">
                {place.photo_url ? (
                  <img
                    src={place.photo_url}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl text-white opacity-60">
                    🏨
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-teal-700 text-white text-xs px-2 py-1 rounded-full font-bold shadow">
                    🤖 AI Pick #{idx + 1}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
                  {place.name}
                </h3>
                <p className="text-xs text-gray-400 mb-2 line-clamp-1">
                  📍 {place.address}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <StarDisplay rating={place.rating} />
                  <span className="text-xs text-gray-400">
                    {place.total_reviews?.toLocaleString()} reviews
                  </span>
                </div>
                <div className="mb-3">
                  <PriceBadge label={place.price_label} />
                </div>

                {/* Guest reviews */}
                {place.reviews && place.reviews.length > 0 && (
                  <div className="mb-3">
                    {place.reviews.slice(0, 1).map((r, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 italic border border-gray-100"
                      >
                        <span className="text-yellow-400">{"★".repeat(r.rating)}</span>{" "}
                        <span className="font-medium text-gray-700 not-italic">{r.author}:</span>{" "}
                        "{r.text.slice(0, 100)}{r.text.length > 100 ? "..." : ""}"
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-2 border-t pt-3">
                  <a
                    href={place.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-xs py-1.5 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    🗺️ View on Google Maps
                  </a>
                  <div className="flex gap-2">
                    <a
                      href={place.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center text-xs py-1.5 px-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
                    >
                      🏨 Booking.com
                    </a>
                    <a
                      href={place.agoda_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center text-xs py-1.5 px-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      🏷️ Agoda
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {searched && results.length === 0 && !loading && !error && (
        <div className="mt-4 text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-sm">No results found. Try a different search.</p>
        </div>
      )}
    </div>
  );
};

export default AISearch;