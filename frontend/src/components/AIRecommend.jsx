import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import StarRating from "./StarRating";

const AIRecommend = () => {
  const [query,    setQuery]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState("");
  const [listings, setListings] = useState([]);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const suggestions = [
    "Beach holiday under $1000 🏖️",
    "Luxury hotel in Europe 🏨",
    "Budget flight to Asia ✈️",
    "Family package with meals 🍽️",
    "Short weekend getaway 🌴",
  ];

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setMessage("");
    setListings([]);

    try {
      const res = await api.post("/api/ai/recommend/", { message: q });
      setMessage(res.data.message || "");
      setListings(res.data.recommended_listings || []);
    } catch (error) {
      setMessage("AI is temporarily unavailable. Please browse listings directly.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (s) => {
    setQuery(s);
    handleSearch(s);
  };

  return (
    <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-2xl p-6 mb-8 text-white">

      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-2xl font-bold mb-1">🤖 AI Travel Recommendations</h2>
        <p className="text-teal-200 text-sm">
          Tell me what you are looking for and I will find the perfect match
        </p>
      </div>

      {/* Search Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="e.g. beach holiday under $1000..."
          className="flex-1 px-4 py-3 rounded-xl text-gray-800 text-sm outline-none focus:ring-2 focus:ring-teal-300"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="bg-white text-teal-700 px-5 py-3 rounded-xl font-semibold text-sm hover:bg-teal-50 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Ask AI"}
        </button>
      </div>

      {/* Suggestions */}
      {!searched && (
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map(function(s) {
            return (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1.5 rounded-full transition-colors border border-white border-opacity-20"
              >
                {s}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-teal-200 text-sm">AI is finding your perfect trip...</p>
        </div>
      )}

      {/* AI Message */}
      {message && !loading && (
        <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-4 border border-white border-opacity-20">
          <p className="text-sm leading-relaxed">🤖 {message}</p>
        </div>
      )}

      {/* Recommended Listings */}
      {listings.length > 0 && !loading && (
        <div>
          <p className="text-teal-200 text-xs mb-3 text-center">
            Recommended for you
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {listings.map(function(listing) {
              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => navigate("/listings/" + listing.id)}
                >
                  {/* Image */}
                  <div className="h-32 overflow-hidden bg-teal-100">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {listing.listing_type === "HOTEL" ? "🏨" : listing.listing_type === "FLIGHT" ? "✈️" : "🌴"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-gray-800 font-semibold text-sm leading-tight mb-1">
                      {listing.title}
                    </p>
                    <p className="text-gray-400 text-xs mb-1">
                      {listing.origin} → {listing.destination}
                    </p>
                    {listing.rating > 0 && (
                      <StarRating
                        rating={Number(listing.rating)}
                        size="sm"
                        showNumber={true}
                      />
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-teal-700 font-bold text-sm">
                        ${listing.discounted_price}
                        <span className="text-gray-400 font-normal text-xs">/person</span>
                      </p>
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                        {listing.listing_type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset button */}
          <div className="text-center mt-4">
            <button
              onClick={() => { setSearched(false); setQuery(""); setMessage(""); setListings([]); }}
              className="text-teal-200 text-xs underline hover:text-white"
            >
              Start new search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommend;