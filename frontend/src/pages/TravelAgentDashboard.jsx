import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";
import { useAuth }             from "../context/AuthContext";
import api                     from "../api/axios";

// Country → Cities mapping
const COUNTRY_CITIES = {
  "Australia":    ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "Japan":        ["Tokyo", "Osaka", "Kyoto", "Hiroshima", "Sapporo"],
  "Indonesia":    ["Bali", "Jakarta", "Lombok", "Yogyakarta"],
  "Thailand":     ["Bangkok", "Phuket", "Chiang Mai", "Koh Samui"],
  "Nepal":        ["Kathmandu", "Pokhara", "Chitwan", "Lumbini"],
  "Singapore":    ["Singapore"],
  "UAE":          ["Dubai", "Abu Dhabi", "Sharjah"],
  "France":       ["Paris", "Lyon", "Nice", "Marseille"],
  "Italy":        ["Rome", "Milan", "Venice", "Florence", "Naples"],
  "Spain":        ["Barcelona", "Madrid", "Seville", "Valencia"],
  "UK":           ["London", "Edinburgh", "Manchester", "Liverpool"],
  "Netherlands":  ["Amsterdam", "Rotterdam", "The Hague"],
  "USA":          ["New York", "Los Angeles", "Las Vegas", "Miami", "Chicago"],
  "New Zealand":  ["Queenstown", "Auckland", "Christchurch", "Wellington"],
  "Mexico":       ["Cancun", "Mexico City", "Tulum", "Playa del Carmen"],
  "India":        ["Mumbai", "Delhi", "Goa", "Jaipur", "Agra"],
  "Sri Lanka":    ["Colombo", "Kandy", "Galle", "Sigiriya"],
  "Maldives":     ["Male", "Maafushi", "Hulhumale"],
  "Greece":       ["Athens", "Santorini", "Mykonos", "Rhodes"],
  "Turkey":       ["Istanbul", "Antalya", "Cappadocia", "Bodrum"],
};

const DESTINATIONS = [
  { group: "🌏 Asia Pacific",
    options: ["Bali, Indonesia", "Tokyo, Japan", "Bangkok, Thailand", "Singapore",
              "Kathmandu, Nepal", "Dubai, UAE", "Maldives", "Goa, India",
              "Colombo, Sri Lanka", "Phuket, Thailand", "Kyoto, Japan", "Osaka, Japan"] },
  { group: "🌍 Europe",
    options: ["Paris, France", "Rome, Italy", "Barcelona, Spain", "London, UK",
              "Amsterdam, Netherlands", "Athens, Greece", "Santorini, Greece",
              "Istanbul, Turkey", "Venice, Italy", "Madrid, Spain"] },
  { group: "🌎 Americas & Pacific",
    options: ["New York, USA", "Sydney, Australia", "Melbourne, Australia",
              "Queenstown, New Zealand", "Cancun, Mexico", "Los Angeles, USA",
              "Miami, USA", "Las Vegas, USA", "Auckland, New Zealand"] },
];

const TravelAgentDashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [listings,        setListings]        = useState([]);
  const [bookings,        setBookings]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [message,         setMessage]         = useState("");
  const [showForm,        setShowForm]        = useState(false);
  const [autofillDest,    setAutofillDest]    = useState("");
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillMsg,     setAutofillMsg]     = useState("");
  const [activeTab,       setActiveTab]       = useState("overview");
  const [newListing, setNewListing] = useState({
    title: "", description: "", listing_type: "PACKAGE",
    origin: "", destination: "", country: "", city: "",
    price_per_person: "", discount_percent: "0",
    available_seats: "", max_seats: "",
    start_date: "", end_date: "", duration_days: "",
    image_url: "", includes_hotel: false,
    includes_flight: false, includes_meals: false,
  });

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const lRes = await api.get("/api/listings/");
      setListings(lRes.data.results || lRes.data);
      const bRes = await api.get("/api/bookings/admin/all/");
      setBookings(bRes.data.results || bRes.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = async () => {
    if (!autofillDest.trim()) { setAutofillMsg("Please type a destination first."); return; }
    setAutofillLoading(true);
    setAutofillMsg("Gemini is generating listing details...");
    try {
      const res = await api.post("/api/ai/autofill/", {
        destination: autofillDest.trim(),
        listing_type: newListing.listing_type,
      });
      const d = res.data;
      setNewListing({
        ...newListing,
        title: d.title || "", description: d.description || "",
        country: d.country || "", city: d.city || "",
        origin: d.origin || "Sydney", destination: autofillDest.trim(),
        price_per_person: d.price_per_person || "", duration_days: d.duration_days || "",
        image_url: d.image_url || "", max_seats: d.max_seats || "",
        available_seats: d.available_seats || "", start_date: d.start_date || "",
        end_date: d.end_date || "", includes_hotel: d.includes_hotel || false,
        includes_flight: d.includes_flight || false, includes_meals: d.includes_meals || false,
      });
      setAutofillMsg("✅ All fields filled! Please review and adjust before saving.");
    } catch {
      setAutofillMsg("❌ Autofill failed. Please fill in the fields manually.");
    } finally {
      setAutofillLoading(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/listings/create/", newListing);
      setMessage("Listing created successfully.");
      setShowForm(false);
      setAutofillDest(""); setAutofillMsg("");
      setNewListing({
        title: "", description: "", listing_type: "PACKAGE",
        origin: "", destination: "", country: "", city: "",
        price_per_person: "", discount_percent: "0",
        available_seats: "", max_seats: "", start_date: "", end_date: "",
        duration_days: "", image_url: "", includes_hotel: false,
        includes_flight: false, includes_meals: false,
      });
      fetchData();
    } catch (error) {
      setMessage(error.response?.data ? JSON.stringify(error.response.data) : "Failed to create listing.");
    }
  };

  const handleDeactivateListing = async (listingId) => {
    if (!window.confirm("Deactivate this listing?")) return;
    try {
      await api.delete(`/api/listings/${listingId}/manage/`);
      setMessage("Listing deactivated.");
      fetchData();
    } catch {
      setMessage("Failed to deactivate listing.");
    }
  };

  const tabClass = (tab) =>
    `px-5 py-3 font-medium text-sm transition-colors cursor-pointer ${
      activeTab === tab
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-500 hover:text-gray-700"
    }`;

  const statusBadge = (s) => {
    const styles = {
      CONFIRMED: "bg-green-100 text-green-700",
      PENDING:   "bg-yellow-100 text-yellow-700",
      CANCELLED: "bg-red-100 text-red-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      ACTIVE:    "bg-green-100 text-green-700",
      INACTIVE:  "bg-gray-100 text-gray-700",
      SOLDOUT:   "bg-red-100 text-red-700",
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[s] || "bg-gray-100 text-gray-700"}`;
  };

  const selectClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500";
  const inputClass  = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="bg-blue-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-1">Travel Agent Dashboard ✈️</h1>
          <p className="text-blue-100 mb-4">
            Welcome, {user?.full_name} — Manage your listings and view bookings
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            <div className="bg-white bg-opacity-20 rounded-xl px-3 py-3 text-center">
              <p className="text-2xl font-bold">{listings.length}</p>
              <p className="text-xs text-blue-100">🌍 Listings</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl px-3 py-3 text-center">
              <p className="text-2xl font-bold">{bookings.length}</p>
              <p className="text-xs text-blue-100">📋 Bookings</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl px-3 py-3 text-center">
              <p className="text-2xl font-bold">
                {listings.filter(l => l.status === "ACTIVE").length}
              </p>
              <p className="text-xs text-blue-100">✅ Active</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg ${
            message.includes("successfully") || message.includes("created")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message}
            <button onClick={() => setMessage("")} className="ml-4 text-sm underline">dismiss</button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { key: "overview", label: "📊 Overview"     },
              { key: "listings", label: "🌍 All Listings" },
              { key: "bookings", label: "📋 Bookings"     },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)} className={tabClass(key)}>
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <>
                {/* OVERVIEW */}
                {activeTab === "overview" && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>

                    {/* Permissions card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                      <h3 className="font-bold text-blue-800 mb-3">✈️ Your Travel Agent Permissions</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {[
                          { action: "Create new listings",    allowed: true  },
                          { action: "Edit your listings",     allowed: true  },
                          { action: "Deactivate listings",    allowed: true  },
                          { action: "View all bookings",      allowed: true  },
                          { action: "Update booking status",  allowed: false },
                          { action: "Manage users",           allowed: false },
                          { action: "Access Admin Dashboard", allowed: false },
                        ].map(({ action, allowed }) => (
                          <div key={action} className="flex items-center gap-2">
                            <span>{allowed ? "✅" : "❌"}</span>
                            <span className={allowed ? "text-gray-700" : "text-gray-400"}>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent bookings */}
                    <h3 className="font-semibold text-gray-700 mb-3">Recent Bookings</h3>
                    <div className="space-y-2">
                      {bookings.slice(0, 5).map((b) => (
                        <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm flex-wrap gap-2">
                          <span className="font-medium text-gray-700">{b.user_email}</span>
                          <span className="text-gray-500">{b.listing_title}</span>
                          <span className={statusBadge(b.status)}>{b.status}</span>
                          <span className="font-semibold text-teal-700">${b.total_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ALL LISTINGS */}
                {activeTab === "listings" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">All Listings ({listings.length})</h2>
                      <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        {showForm ? "Cancel" : "+ Add Listing"}
                      </button>
                    </div>

                    {/* Create listing form */}
                    {showForm && (
                      <form onSubmit={handleCreateListing} className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4">Create New Listing</h3>

                        {/* AI Autofill box */}
                        <div className="bg-blue-600 rounded-xl p-5 mb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">✨</span>
                            <h4 className="text-white font-bold">AI Autofill — Powered by Gemini</h4>
                          </div>
                          <p className="text-blue-100 text-xs mb-4">
                            Type a destination and click Autofill. Gemini fills in all fields automatically.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={autofillDest}
                              onChange={(e) => setAutofillDest(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                              placeholder="e.g. Bali, Tokyo, Paris..."
                              className="flex-1 min-w-48 px-3 py-2 rounded-lg text-sm outline-none text-gray-800"
                            />
                            <select
                              value={newListing.listing_type}
                              onChange={(e) => setNewListing({ ...newListing, listing_type: e.target.value })}
                              className="px-3 py-2 rounded-lg text-sm outline-none text-gray-800"
                            >
                              <option value="PACKAGE">Package</option>
                              <option value="HOTEL">Hotel</option>
                              <option value="FLIGHT">Flight</option>
                            </select>
                            <button
                              type="button"
                              onClick={handleAutofill}
                              disabled={autofillLoading}
                              className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 disabled:opacity-60 whitespace-nowrap"
                            >
                              {autofillLoading ? "⏳ Generating..." : "✨ Autofill with AI"}
                            </button>
                          </div>
                          {autofillMsg && (
                            <p className={`mt-3 text-xs font-medium ${
                              autofillMsg.includes("✅") ? "text-green-200" :
                              autofillMsg.includes("❌") ? "text-red-200" : "text-blue-100"
                            }`}>{autofillMsg}</p>
                          )}
                        </div>

                        {/* Form fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                          {/* Title */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" required value={newListing.title}
                              onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                              className={inputClass} />
                          </div>

                          {/* Origin */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                            <input type="text" required value={newListing.origin}
                              onChange={(e) => setNewListing({ ...newListing, origin: e.target.value })}
                              placeholder="e.g. Sydney"
                              className={inputClass} />
                          </div>

                          {/* Destination — DROPDOWN */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                            <select required value={newListing.destination}
                              onChange={(e) => setNewListing({ ...newListing, destination: e.target.value })}
                              className={selectClass}>
                              <option value="">— Select Destination —</option>
                              {DESTINATIONS.map(({ group, options }) => (
                                <optgroup key={group} label={group}>
                                  {options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          {/* Country — DROPDOWN */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <select required value={newListing.country}
                              onChange={(e) => setNewListing({ ...newListing, country: e.target.value, city: "" })}
                              className={selectClass}>
                              <option value="">— Select Country —</option>
                              {Object.keys(COUNTRY_CITIES).sort().map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          {/* City — DROPDOWN (depends on country) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <select required value={newListing.city}
                              onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                              className={selectClass}
                              disabled={!newListing.country}>
                              <option value="">
                                {newListing.country ? "— Select City —" : "— Select a country first —"}
                              </option>
                              {(COUNTRY_CITIES[newListing.country] || []).map(city => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>

                          {/* Price Per Person */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Person</label>
                            <input type="number" required min="1" step="0.01" value={newListing.price_per_person}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || Number(val) >= 1) setNewListing({ ...newListing, price_per_person: val });
                              }}
                              onBlur={(e) => {
                                if (Number(e.target.value) < 1) setNewListing({ ...newListing, price_per_person: "1" });
                              }}
                              placeholder="e.g. 1500"
                              className={inputClass} />
                            {newListing.price_per_person && Number(newListing.price_per_person) < 1 && (
                              <p className="text-red-500 text-xs mt-1">⚠️ Price must be at least $1</p>
                            )}
                          </div>

                          {/* Discount % */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                            <input type="number" required min="0" max="100" value={newListing.discount_percent}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || (Number(val) >= 0 && Number(val) <= 100)) setNewListing({ ...newListing, discount_percent: val });
                              }}
                              onBlur={(e) => {
                                if (Number(e.target.value) < 0) setNewListing({ ...newListing, discount_percent: "0" });
                                if (Number(e.target.value) > 100) setNewListing({ ...newListing, discount_percent: "100" });
                              }}
                              placeholder="0"
                              className={inputClass} />
                            {newListing.discount_percent && (Number(newListing.discount_percent) < 0 || Number(newListing.discount_percent) > 100) && (
                              <p className="text-red-500 text-xs mt-1">⚠️ Discount must be between 0 and 100</p>
                            )}
                          </div>

                          {/* Available Seats */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Available Seats</label>
                            <input type="number" required min="1" value={newListing.available_seats}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || Number(val) >= 1) setNewListing({ ...newListing, available_seats: val });
                              }}
                              onBlur={(e) => {
                                if (Number(e.target.value) < 1) setNewListing({ ...newListing, available_seats: "1" });
                              }}
                              placeholder="e.g. 20"
                              className={inputClass} />
                            {newListing.available_seats && Number(newListing.available_seats) < 1 && (
                              <p className="text-red-500 text-xs mt-1">⚠️ Must be at least 1 seat</p>
                            )}
                          </div>

                          {/* Max Seats */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Seats</label>
                            <input type="number" required min="1" value={newListing.max_seats}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || Number(val) >= 1) setNewListing({ ...newListing, max_seats: val });
                              }}
                              onBlur={(e) => {
                                if (Number(e.target.value) < 1) setNewListing({ ...newListing, max_seats: "1" });
                              }}
                              placeholder="e.g. 50"
                              className={inputClass} />
                            {newListing.max_seats && Number(newListing.max_seats) < 1 && (
                              <p className="text-red-500 text-xs mt-1">⚠️ Must be at least 1 seat</p>
                            )}
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                            <input type="number" required min="1" value={newListing.duration_days}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || Number(val) >= 1) setNewListing({ ...newListing, duration_days: val });
                              }}
                              onBlur={(e) => {
                                if (Number(e.target.value) < 1) setNewListing({ ...newListing, duration_days: "1" });
                              }}
                              placeholder="e.g. 7"
                              className={inputClass} />
                            {newListing.duration_days && Number(newListing.duration_days) < 1 && (
                              <p className="text-red-500 text-xs mt-1">⚠️ Duration must be at least 1 day</p>
                            )}
                          </div>

                          {/* Start Date */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input type="date" required value={newListing.start_date}
                              onChange={(e) => setNewListing({ ...newListing, start_date: e.target.value })}
                              className={inputClass} />
                          </div>

                          {/* End Date */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input type="date" required value={newListing.end_date}
                              onChange={(e) => setNewListing({ ...newListing, end_date: e.target.value })}
                              className={inputClass} />
                          </div>

                          {/* Image URL */}
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Image URL <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input type="url" value={newListing.image_url}
                              onChange={(e) => setNewListing({ ...newListing, image_url: e.target.value })}
                              placeholder="https://images.unsplash.com/photo-..."
                              className={inputClass} />
                            {newListing.image_url && (
                              <img src={newListing.image_url} alt="Preview"
                                className="mt-2 h-24 w-40 object-cover rounded-lg border border-gray-200"
                                onError={(e) => { e.target.style.display = "none"; }} />
                            )}
                          </div>

                          {/* Description */}
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea required value={newListing.description}
                              onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                              rows={3} className={inputClass} />
                          </div>

                          {/* Listing Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                            <select value={newListing.listing_type}
                              onChange={(e) => setNewListing({ ...newListing, listing_type: e.target.value })}
                              className={selectClass}>
                              <option value="PACKAGE">Package</option>
                              <option value="HOTEL">Hotel</option>
                              <option value="FLIGHT">Flight</option>
                            </select>
                          </div>

                          {/* Includes checkboxes */}
                          <div className="flex items-center gap-6 pt-6">
                            {[
                              { name:"includes_hotel",  label:"Hotel"  },
                              { name:"includes_flight", label:"Flight" },
                              { name:"includes_meals",  label:"Meals"  },
                            ].map(({ name, label }) => (
                              <label key={name} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={newListing[name]}
                                  onChange={(e) => setNewListing({ ...newListing, [name]: e.target.checked })}
                                  className="w-4 h-4 accent-blue-600" />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>

                        <button type="submit"
                          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          Create Listing
                        </button>
                      </form>
                    )}

                    {/* Listings list */}
                    <div className="space-y-3">
                      {listings.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          <p className="text-4xl mb-3">🌍</p>
                          <p className="font-medium">No listings yet</p>
                          <p className="text-sm mt-1">Click + Add Listing to create your first one</p>
                        </div>
                      ) : listings.map((l) => (
                        <div key={l.id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-3">
                          <div className="flex gap-4 items-start">
                            {l.image_url ? (
                              <img src={l.image_url} alt={l.title}
                                className="w-16 h-16 object-cover rounded-lg shrink-0"
                                onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-2xl">
                                  {l.listing_type === "HOTEL" ? "🏨" :
                                   l.listing_type === "FLIGHT" ? "✈️" : "🌴"}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-800">{l.title}</span>
                                <span className={statusBadge(l.status)}>{l.status}</span>
                              </div>
                              <div className="text-sm text-gray-500 flex flex-wrap gap-3">
                                <span>📍 {l.destination}</span>
                                <span>💰 ${l.discounted_price}/person</span>
                                <span>💺 {l.available_seats} seats</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3 self-start shrink-0">
                            <button onClick={() => navigate("/listings/" + l.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View
                            </button>
                            {l.status === "ACTIVE" && (
                              <button onClick={() => handleDeactivateListing(l.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium">
                                Deactivate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BOOKINGS — view only */}
                {activeTab === "bookings" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">All Bookings ({bookings.length})</h2>
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full">
                        🔒 View only
                      </span>
                    </div>
                    <div className="space-y-3">
                      {bookings.map((b) => (
                        <div key={b.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-gray-800">{b.listing_title}</span>
                            <span className={statusBadge(b.status)}>{b.status}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex flex-wrap gap-3">
                            <span>👤 {b.user_email}</span>
                            <span>🔖 {b.booking_reference}</span>
                            <span>👥 {b.number_of_guests} guests</span>
                            <span className="font-semibold text-teal-700">💰 ${b.total_price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelAgentDashboard;
