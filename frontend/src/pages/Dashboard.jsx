import { useState, useEffect } from "react";
import { Link, useNavigate }   from "react-router-dom";
import { useAuth }             from "../context/AuthContext";
import api                     from "../api/axios";

// Manager Dashboard — view only
const ManagerDashboard = ({ user }) => {
  const [bookings,  setBookings]  = useState([]);
  const [users,     setUsers]     = useState([]);
  const [listings,  setListings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, uRes, lRes] = await Promise.all([
          api.get("/api/bookings/admin/all/"),
          api.get("/api/users/admin/users/"),
          api.get("/api/listings/"),
        ]);
        setBookings(bRes.data.results || bRes.data);
        setUsers(uRes.data.results    || uRes.data);
        setListings(lRes.data.results || lRes.data);
      } catch (error) {
        console.error("Manager data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tabClass = (tab) =>
    `px-5 py-3 font-medium text-sm transition-colors cursor-pointer ${
      activeTab === tab
        ? "border-b-2 border-orange-500 text-orange-600"
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
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[s] || "bg-gray-100 text-gray-700"}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-1">Manager Dashboard 📊</h1>
          <p className="text-orange-100">Welcome, {user?.full_name} — You have read-only access</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-orange-700 bg-opacity-50 px-3 py-1 rounded-full">
            <span className="text-xs text-orange-100">🔒 View only — contact an Admin to make changes</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { key: "overview", label: "📊 Overview" },
              { key: "bookings", label: "📋 Bookings" },
              { key: "users",    label: "👥 Users"    },
              { key: "listings", label: "🌍 Listings" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)} className={tabClass(key)}>
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading data...</p>
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">System Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                      {[
                        { label:"Total Users",    value:users.length,    icon:"👥" },
                        { label:"Total Bookings", value:bookings.length, icon:"📋" },
                        { label:"Total Listings", value:listings.length, icon:"🌍" },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                          <div className="text-3xl mb-2">{icon}</div>
                          <p className="text-2xl font-bold text-gray-800">{value}</p>
                          <p className="text-sm text-gray-500">{label}</p>
                        </div>
                      ))}
                    </div>
                    <h3 className="font-semibold text-gray-700 mb-3">Recent Bookings</h3>
                    <div className="space-y-2">
                      {bookings.slice(0, 5).map((b) => (
                        <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                          <span className="font-medium text-gray-700">{b.user_email}</span>
                          <span className="text-gray-500">{b.listing_title}</span>
                          <span className={statusBadge(b.status)}>{b.status}</span>
                          <span className="font-semibold text-teal-700">${b.total_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "bookings" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">All Bookings ({bookings.length})</h2>
                      <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full">🔒 View only</span>
                    </div>
                    <div className="space-y-3">
                      {bookings.map((b) => (
                        <div key={b.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex gap-2 mb-1">
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

                {activeTab === "users" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">All Users ({users.length})</h2>
                      <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full">🔒 View only</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left">
                            {["Email","Name","Role","Status","Joined"].map(h => (
                              <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-800">{u.email}</td>
                              <td className="px-4 py-3 text-gray-600">{u.first_name} {u.last_name}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  u.role === "ADMIN"        ? "bg-blue-100 text-blue-700"     :
                                  u.role === "MANAGER"      ? "bg-orange-100 text-orange-700" :
                                  u.role === "TRAVEL_AGENT" ? "bg-purple-100 text-purple-700" :
                                  "bg-green-100 text-green-700"
                                }`}>{u.role}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>{u.is_active ? "Active" : "Inactive"}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{new Date(u.date_joined).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "listings" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">All Listings ({listings.length})</h2>
                      <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded-full">🔒 View only</span>
                    </div>
                    <div className="space-y-3">
                      {listings.map((l) => (
                        <div key={l.id} className="border border-gray-100 rounded-xl p-4 flex gap-4">
                          {l.image_url ? (
                            <img src={l.image_url} alt={l.title} className="w-16 h-16 object-cover rounded-lg shrink-0" onError={(e) => { e.target.style.display = "none"; }} />
                          ) : (
                            <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                              <span className="text-2xl">{l.listing_type === "HOTEL" ? "🏨" : l.listing_type === "FLIGHT" ? "✈️" : "🌴"}</span>
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

// Main Dashboard
const Dashboard = () => {
  const { user, toggleMFA, isManager, isTravelAgent } = useAuth();
  const navigate = useNavigate();

  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMessage, setMfaMessage] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get("/api/bookings/my-bookings/");
        setBookings(response.data.results || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Show Manager Dashboard
  if (isManager) return <ManagerDashboard user={user} />;

  // Redirect Travel Agent to their dashboard
  if (isTravelAgent) {
    navigate("/agent-dashboard");
    return null;
  }

  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const pendingCount   = bookings.filter((b) => b.status === "PENDING").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;

  const handleToggleEmailMFA = async () => {
    setMfaLoading(true);
    setMfaMessage("");
    try {
      const res = await toggleMFA();
      setMfaMessage(res.message);
      setTimeout(() => setMfaMessage(""), 4000);
    } catch {
      setMfaMessage("Failed to update MFA settings.");
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="bg-gradient-to-r from-teal-800 to-teal-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name}!</h1>
          <p className="text-teal-200">
            Role:{" "}
            <span className="bg-teal-700 px-3 py-1 rounded-full text-sm font-medium">{user?.role}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label:"Confirmed Bookings", value:confirmedCount, icon:"✅" },
            { label:"Pending Bookings",   value:pendingCount,   icon:"⏳" },
            { label:"Cancelled",          value:cancelledCount, icon:"❌" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{loading ? "..." : value}</p>
                </div>
                <span className="text-3xl">{icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link to="/listings" className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all group">
            <div className="text-4xl mb-3">🌍</div>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-teal-700">Browse Travel Packages</h3>
            <p className="text-gray-500 text-sm mt-1">Explore available destinations and book your next trip</p>
          </Link>
          <Link to="/bookings" className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all group">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-teal-700">My Bookings</h3>
            <p className="text-gray-500 text-sm mt-1">View and manage all your travel bookings</p>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🔐 Two-Factor Authentication</h2>
          {user?.mfa_enabled ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">ENABLED</span>
                <span className="bg-teal-100 text-teal-700 text-xs px-3 py-1 rounded-full font-medium">
                  {user?.mfa_type === "TOTP" ? "Microsoft Authenticator" : "Email OTP"}
                </span>
              </div>
              {user?.mfa_type === "TOTP" ? (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Your account is protected with Microsoft Authenticator.</p>
                  <button onClick={() => navigate("/disable-totp")} className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors font-medium">
                    Remove Authenticator App
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-4">A 6-digit verification code is sent to your email each time you log in.</p>
                  <button onClick={handleToggleEmailMFA} disabled={mfaLoading} className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors font-medium disabled:opacity-50">
                    {mfaLoading ? "Updating..." : "Disable Email OTP"}
                  </button>
                </div>
              )}
              {mfaMessage && <p className="text-sm text-teal-600 font-medium mt-3">{mfaMessage}</p>}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-5">Add extra security to your account.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border-2 border-gray-100 rounded-xl p-5 hover:border-teal-300 transition-all">
                  <div className="text-3xl mb-3">📧</div>
                  <p className="font-semibold text-gray-800 text-sm mb-1">Email OTP</p>
                  <p className="text-xs text-gray-500 mb-4">Receive a 6-digit code by email each time you log in.</p>
                  <button onClick={handleToggleEmailMFA} disabled={mfaLoading} className="w-full bg-teal-700 text-white py-2 rounded-lg text-sm hover:bg-teal-800 transition-colors font-medium disabled:bg-teal-300">
                    {mfaLoading ? "Enabling..." : "Enable Email OTP"}
                  </button>
                </div>
                <div className="border-2 border-gray-100 rounded-xl p-5 hover:border-teal-300 transition-all">
                  <div className="text-3xl mb-3">📱</div>
                  <p className="font-semibold text-gray-800 text-sm mb-1">Microsoft Authenticator</p>
                  <p className="text-xs text-gray-500 mb-4">Use an app on your phone to generate codes. Works offline.</p>
                  <button onClick={() => navigate("/setup-totp")} className="w-full bg-teal-700 text-white py-2 rounded-lg text-sm hover:bg-teal-800 transition-colors font-medium">
                    Setup Authenticator App
                  </button>
                </div>
              </div>
              {mfaMessage && <p className="text-sm text-teal-600 font-medium mt-3">{mfaMessage}</p>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Bookings</h2>
          {loading ? (
            <p className="text-gray-400 text-center py-8">Loading...</p>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No bookings yet</p>
              <Link to="/listings" className="bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition-colors">
                Book your first trip
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{booking.listing_title}</p>
                    <p className="text-sm text-gray-500">Ref: {booking.booking_reference}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    booking.status === "PENDING"   ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>{booking.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;