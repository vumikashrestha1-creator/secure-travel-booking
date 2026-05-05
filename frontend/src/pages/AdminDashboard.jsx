import { useState, useEffect } from "react";
import api from "../api/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const AdminDashboard = () => {
  const [activeTab,   setActiveTab]   = useState("overview");
  const [users,       setUsers]       = useState([]);
  const [bookings,    setBookings]    = useState([]);
  const [listings,    setListings]    = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [message,     setMessage]     = useState("");

  // Add Listing form state
  const [showForm,        setShowForm]        = useState(false);
  const [autofillDest,    setAutofillDest]    = useState("");
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillMsg,     setAutofillMsg]     = useState("");
  const [newListing, setNewListing] = useState({
    title: "", description: "", listing_type: "PACKAGE",
    origin: "", destination: "", country: "", city: "",
    price_per_person: "", discount_percent: "0",
    available_seats: "", max_seats: "",
    start_date: "", end_date: "", duration_days: "",
    image_url: "", includes_hotel: false,
    includes_flight: false, includes_meals: false,
  });

  // Add User form state
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "", first_name: "", last_name: "",
    password: "", role: "CUSTOMER",
  });

  // Edit User role state
  const [editingUserId,   setEditingUserId]   = useState(null);
  const [editingUserRole, setEditingUserRole] = useState("");

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "overview" || activeTab === "users") {
        const res = await api.get("/api/users/admin/users/");
        setUsers(res.data.results || res.data);
      }
      if (activeTab === "overview" || activeTab === "bookings") {
        const res = await api.get("/api/bookings/admin/all/");
        setBookings(res.data.results || res.data);
      }
      if (activeTab === "overview" || activeTab === "listings") {
        const res = await api.get("/api/listings/");
        setListings(res.data.results || res.data);
      }
      if (activeTab === "overview") {
        const res = await api.get("/api/payments/admin/all/");
        setPayments(res.data.results || res.data);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // AI Autofill
  const handleAutofill = async () => {
    if (!autofillDest.trim()) { setAutofillMsg("Please type a destination first."); return; }
    setAutofillLoading(true);
    setAutofillMsg("Gemini is generating listing details...");
    try {
      const res = await api.post("/api/ai/autofill/", {
        destination: autofillDest.trim(), listing_type: newListing.listing_type,
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
    } catch (err) {
      setAutofillMsg("❌ Autofill failed. Please fill in the fields manually.");
    } finally {
      setAutofillLoading(false);
    }
  };

  // Create Listing
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

  // Deactivate Listing
  const handleDeactivateListing = async (listingId) => {
    if (!window.confirm("Deactivate this listing?")) return;
    try {
      await api.delete(`/api/listings/${listingId}/manage/`);
      setMessage("Listing deactivated.");
      fetchData();
    } catch (error) { setMessage("Failed to deactivate listing."); }
  };

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/users/admin/users/create/", newUser);
      setMessage("User created successfully.");
      setShowUserForm(false);
      setNewUser({ email: "", first_name: "", last_name: "", password: "", role: "CUSTOMER" });
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to create user.");
    }
  };

  // Update User Role
  const handleUpdateRole = async (userId) => {
    try {
      await api.patch(`/api/users/admin/users/${userId}/role/`, { role: editingUserRole });
      setMessage("User role updated successfully.");
      setEditingUserId(null);
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to update role.");
    }
  };

  // Deactivate User
  const handleDeactivateUser = async (userId) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await api.delete(`/api/users/admin/users/${userId}/`);
      setMessage("User deactivated successfully.");
      fetchData();
    } catch (error) { setMessage("Failed to deactivate user."); }
  };

  // Reactivate User
  const handleReactivateUser = async (userId) => {
    try {
      await api.patch(`/api/users/admin/users/${userId}/`);
      setMessage("User reactivated successfully.");
      fetchData();
    } catch (error) { setMessage("Failed to reactivate user."); }
  };

  // Reset Password
  const handleResetPassword = async (userId, userEmail) => {
    const newPassword = window.prompt(`Set a new password for ${userEmail}:`);
    if (!newPassword) return;
    if (newPassword.length < 8) { setMessage("Password must be at least 8 characters."); return; }
    try {
      await api.patch(`/api/users/admin/users/${userId}/reset-password/`, { password: newPassword });
      setMessage("Password reset successfully for " + userEmail);
    } catch (error) { setMessage("Failed to reset password."); }
  };

// Admin Book for User
  const [showBookForUser, setShowBookForUser] = useState(false);
  const [bookForUserData, setBookForUserData] = useState({ user_id: "", listing: "", number_of_guests: 1 });
  const [bookForUserMsg, setBookForUserMsg] = useState("");

  const handleBookForUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/bookings/admin/create-for-user/", bookForUserData);
      setBookForUserMsg("✅ " + res.data.message + " — Ref: " + res.data.reference);
      setBookForUserData({ user_id: "", listing: "", number_of_guests: 1 });
      fetchData();
    } catch (err) {
      setBookForUserMsg("❌ " + (err.response?.data?.error || "Failed to create booking."));
    }
  };

  // Update Booking Status
  const handleUpdateBooking = async (bookingId, newStatus) => {
    try {
      await api.patch(`/api/bookings/admin/${bookingId}/update/`, { status: newStatus });
      setMessage("Booking updated successfully.");
      fetchData();
    } catch (error) { setMessage("Failed to update booking."); }
  };

  const tabClass = (tab) =>
    `px-6 py-3 font-medium text-sm transition-colors cursor-pointer ${
      activeTab === tab
        ? "border-b-2 border-teal-600 text-teal-600"
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

  const roleBadge = (role) => {
    const styles = {
      ADMIN:        "bg-blue-100 text-blue-700",
      TRAVEL_AGENT: "bg-purple-100 text-purple-700",
      MANAGER:      "bg-orange-100 text-orange-700",
      CUSTOMER:     "bg-green-100 text-green-700",
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[role] || "bg-gray-100 text-gray-700"}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-1">Admin Dashboard 🛡️</h1>
          <p className="text-teal-200">SafeNest Travel — Full system control and management</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { key: "overview", label: "📊 Overview"  },
              { key: "users",    label: "👥 Users"     },
              { key: "bookings", label: "📋 Bookings"  },
              { key: "listings",  label: "🌍 Listings"  },
{ key: "analytics", label: "📈 Analytics" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)} className={tabClass(key)}>
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading data...</p>
              </div>
            ) : (
              <>
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">System Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      {[
                        { label:"Total Users",    value:users.length,    icon:"👥" },
                        { label:"Total Bookings", value:bookings.length, icon:"📋" },
                        { label:"Total Listings", value:listings.length, icon:"🌍" },
                        { label:"Total Payments", value:payments.length, icon:"💳" },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                          <div className="text-3xl mb-2">{icon}</div>
                          <p className="text-2xl font-bold text-gray-800">{value}</p>
                          <p className="text-sm text-gray-500">{label}</p>
                        </div>
                      ))}
                    </div>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Recent Bookings</h3>
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

                {/* USERS TAB */}
                {activeTab === "users" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">All Users ({users.length})</h2>
                      <button
                        onClick={() => setShowUserForm(!showUserForm)}
                        className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-800 transition-colors"
                      >
                        {showUserForm ? "Cancel" : "+ Add User"}
                      </button>
                    </div>

                    {/* ADD USER FORM */}
                    {showUserForm && (
                      <form onSubmit={handleCreateUser} className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4">Create New User</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { name:"email",      label:"Email",      type:"email"    },
                            { name:"first_name", label:"First Name", type:"text"     },
                            { name:"last_name",  label:"Last Name",  type:"text"     },
                            { name:"password",   label:"Password",   type:"password" },
                          ].map(({ name, label, type }) => (
                            <div key={name}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                              <input
                                type={type}
                                required
                                value={newUser[name]}
                                onChange={(e) => setNewUser({ ...newUser, [name]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                          ))}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                              value={newUser.role}
                              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            >
                              <option value="CUSTOMER">Customer</option>
                              <option value="MANAGER">Manager</option>
                              <option value="TRAVEL_AGENT">Travel Agent</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        </div>

                        {/* Role descriptions */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { role:"CUSTOMER",     color:"green",  desc:"Can browse and book listings" },
                            { role:"MANAGER",      color:"orange", desc:"Can view bookings and dashboard only" },
                            { role:"TRAVEL_AGENT", color:"purple", desc:"Can create and manage listings" },
                            { role:"ADMIN",        color:"blue",   desc:"Full system access" },
                          ].map(({ role, color, desc }) => (
                            <div key={role} className={`p-3 rounded-lg border border-${color}-200 bg-${color}-50`}>
                              <p className={`text-xs font-bold text-${color}-700 mb-1`}>{role}</p>
                              <p className={`text-xs text-${color}-600`}>{desc}</p>
                            </div>
                          ))}
                        </div>

                        <button
                          type="submit"
                          className="mt-4 bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition-colors font-medium text-sm"
                        >
                          Create User
                        </button>
                      </form>
                    )}

                    {/* Users table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left">
                            {["Email","Name","Role","Status","Joined","Actions"].map(h => (
                              <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-800">{user.email}</td>
                              <td className="px-4 py-3 text-gray-600">{user.first_name} {user.last_name}</td>
                              <td className="px-4 py-3">
                                {editingUserId === user.id ? (
                                  <div className="flex gap-2 items-center">
                                    <select
                                      value={editingUserRole}
                                      onChange={(e) => setEditingUserRole(e.target.value)}
                                      className="text-xs border border-gray-300 rounded px-2 py-1 outline-none"
                                    >
                                      <option value="CUSTOMER">Customer</option>
                                      <option value="MANAGER">Manager</option>
                                      <option value="TRAVEL_AGENT">Travel Agent</option>
                                      <option value="ADMIN">Admin</option>
                                    </select>
                                    <button onClick={() => handleUpdateRole(user.id)} className="text-xs bg-teal-700 text-white px-2 py-1 rounded hover:bg-teal-800">Save</button>
                                    <button onClick={() => setEditingUserId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                                  </div>
                                ) : (
                                  <span className={roleBadge(user.role)}>{user.role}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>{user.is_active ? "Active" : "Inactive"}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{new Date(user.date_joined).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 flex-wrap">
                                  {user.role !== "ADMIN" && (
                                    <button
                                      onClick={() => { setEditingUserId(user.id); setEditingUserRole(user.role); }}
                                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                    >
                                      Edit Role
                                    </button>
                                  )}

				 {user.role !== "ADMIN" && (
                                    <button
                                      onClick={() => handleResetPassword(user.id, user.email)}
                                      className="text-orange-600 hover:text-orange-800 text-xs font-medium"
                                    >
                                      Reset Password
                                    </button>
                                  )}
				
                                  {user.role !== "ADMIN" && (
                                    user.is_active ? (
                                      <button onClick={() => handleDeactivateUser(user.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                                        Deactivate
                                      </button>
                                    ) : (
                                      <button onClick={() => handleReactivateUser(user.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">
                                        Reactivate
                                      </button>
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

		{/* BOOK FOR USER TAB */}
                {activeTab === "bookings" && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">All Bookings ({bookings.length})</h2>
                      <button
                        onClick={() => setShowBookForUser(!showBookForUser)}
                        className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-800 transition-colors"
                      >
                        {showBookForUser ? "Cancel" : "📋 Book for Customer"}
                      </button>
                    </div>
                    {showBookForUser && (
                      <form onSubmit={handleBookForUser} className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4">Book on Behalf of Customer</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                            <select
                              required
                              value={bookForUserData.user_id}
                              onChange={(e) => setBookForUserData({ ...bookForUserData, user_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            >
                              <option value="">-- Select Customer --</option>
                              {users.filter(u => u.role === "CUSTOMER" && u.is_active).map(u => (
                                <option key={u.id} value={u.id}>{u.email} — {u.first_name} {u.last_name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Listing</label>
                            <select
                              required
                              value={bookForUserData.listing}
                              onChange={(e) => setBookForUserData({ ...bookForUserData, listing: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            >
                              <option value="">-- Select Listing --</option>
                              {listings.filter(l => l.status === "ACTIVE").map(l => (
                                <option key={l.id} value={l.id}>{l.title} — ${l.discounted_price} ({l.available_seats} seats left)</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                            <input
                              type="number" min="1" required
                              value={bookForUserData.number_of_guests}
                              onChange={(e) => setBookForUserData({ ...bookForUserData, number_of_guests: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            />
                          </div>
                        </div>
                        {bookForUserMsg && (
                          <p className={`mt-3 text-sm font-medium ${bookForUserMsg.includes("✅") ? "text-green-600" : "text-red-600"}`}>
                            {bookForUserMsg}
                          </p>
                        )}
                        <button type="submit" className="mt-4 bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition-colors font-medium text-sm">
                          Create Booking
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* BOOKINGS TAB */}
                {activeTab === "bookings" && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">All Bookings ({bookings.length})</h2>
                    <div className="space-y-3">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex flex-col sm:flex-row justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="font-semibold text-gray-800">{booking.listing_title}</span>
                                <span className={statusBadge(booking.status)}>{booking.status}</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-500">
                                <span>👤 {booking.user_email}</span>
                                <span>🔖 {booking.booking_reference}</span>
                                <span>👥 {booking.number_of_guests} guests</span>
                                <span className="font-semibold text-teal-700">💰 ${booking.total_price}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <select
                                defaultValue={booking.status}
                                onChange={(e) => handleUpdateBooking(booking.id, e.target.value)}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === "analytics" && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">📈 Analytics Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-700 mb-4">Booking Status</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie data={[
                              { name: "Confirmed", value: bookings.filter(b => b.status === "CONFIRMED").length },
                              { name: "Pending",   value: bookings.filter(b => b.status === "PENDING").length   },
                              { name: "Cancelled", value: bookings.filter(b => b.status === "CANCELLED").length },
                              { name: "Completed", value: bookings.filter(b => b.status === "COMPLETED").length },
                            ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                              {["#0d9488","#f59e0b","#ef4444","#3b82f6"].map((color, i) => <Cell key={i} fill={color} />)}
                            </Pie>
                            <Tooltip /><Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-700 mb-4">Top Destinations</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={listings.slice(0,5).map(l => ({ name: l.destination || l.title?.slice(0,10), seats: l.max_seats - l.available_seats }))}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                            <Tooltip /><Bar dataKey="seats" fill="#0d9488" name="Bookings" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-700 mb-4">Revenue by Listing</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={listings.slice(0,5).map(l => ({ name: l.destination || l.title?.slice(0,10), revenue: l.price_per_person * (l.max_seats - l.available_seats) }))}>
                            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis />
                            <Tooltip /><Bar dataKey="revenue" fill="#6366f1" name="Revenue ($)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-700 mb-4">User Roles</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie data={[
                              { name: "Customer",     value: users.filter(u => u.role === "CUSTOMER").length     },
                              { name: "Admin",        value: users.filter(u => u.role === "ADMIN").length        },
                              { name: "Travel Agent", value: users.filter(u => u.role === "TRAVEL_AGENT").length },
                              { name: "Manager",      value: users.filter(u => u.role === "MANAGER").length      },
                            ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                              {["#0d9488","#3b82f6","#8b5cf6","#f59e0b"].map((color, i) => <Cell key={i} fill={color} />)}
                            </Pie>
                            <Tooltip /><Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* LISTINGS TAB */}
                {activeTab === "listings" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">All Listings ({listings.length})</h2>
                      <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-800 transition-colors"
                      >
                        {showForm ? "Cancel" : "+ Add Listing"}
                      </button>
                    </div>

                    {showForm && (
                      <form onSubmit={handleCreateListing} className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4">Create New Listing</h3>

                        {/* AI Autofill box */}
                        <div className="bg-gradient-to-r from-teal-700 to-teal-500 rounded-xl p-5 mb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">✨</span>
                            <h4 className="text-white font-bold text-base">AI Autofill — Powered by Gemini</h4>
                          </div>
                          <p className="text-teal-100 text-xs mb-4">Type a destination and click Autofill. Gemini fills in all fields automatically.</p>
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
                              className="bg-white text-teal-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-50 transition-colors disabled:opacity-60 whitespace-nowrap"
                            >
                              {autofillLoading ? "⏳ Generating..." : "✨ Autofill with AI"}
                            </button>
                          </div>
                          {autofillMsg && (
                            <p className={`mt-3 text-xs font-medium ${
                              autofillMsg.includes("✅") ? "text-green-200" :
                              autofillMsg.includes("❌") ? "text-red-200" : "text-teal-100"
                            }`}>{autofillMsg}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { name:"title",            label:"Title",            type:"text"   },
                            { name:"origin",           label:"Origin",           type:"text"   },
                            { name:"destination",      label:"Destination",      type:"text"   },
                            { name:"country",          label:"Country",          type:"text"   },
                            { name:"city",             label:"City",             type:"text"   },
                            { name:"price_per_person", label:"Price Per Person", type:"number" },
                            { name:"discount_percent", label:"Discount %",       type:"number" },
                            { name:"available_seats",  label:"Available Seats",  type:"number" },
                            { name:"max_seats",        label:"Max Seats",        type:"number" },
                            { name:"duration_days",    label:"Duration (days)",  type:"number" },
                            { name:"start_date",       label:"Start Date",       type:"date"   },
                            { name:"end_date",         label:"End Date",         type:"date"   },
                          ].map(({ name, label, type }) => (
                            <div key={name}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                              <input
                                type={type}
                                required
                                value={newListing[name]}
                                onChange={(e) => setNewListing({ ...newListing, [name]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                          ))}
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input
                              type="url"
                              value={newListing.image_url}
                              onChange={(e) => setNewListing({ ...newListing, image_url: e.target.value })}
                              placeholder="https://images.unsplash.com/photo-..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            {newListing.image_url && (
                              <img src={newListing.image_url} alt="Preview" className="mt-2 h-24 w-40 object-cover rounded-lg border border-gray-200" onError={(e) => { e.target.style.display = "none"; }} />
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              required
                              value={newListing.description}
                              onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                            <select
                              value={newListing.listing_type}
                              onChange={(e) => setNewListing({ ...newListing, listing_type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            >
                              <option value="PACKAGE">Package</option>
                              <option value="HOTEL">Hotel</option>
                              <option value="FLIGHT">Flight</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-6 pt-6">
                            {[
                              { name:"includes_hotel",  label:"Hotel"  },
                              { name:"includes_flight", label:"Flight" },
                              { name:"includes_meals",  label:"Meals"  },
                            ].map(({ name, label }) => (
                              <label key={name} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newListing[name]}
                                  onChange={(e) => setNewListing({ ...newListing, [name]: e.target.checked })}
                                  className="w-4 h-4 accent-teal-600"
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <button type="submit" className="mt-6 bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition-colors font-medium">
                          Create Listing
                        </button>
                      </form>
                    )}

                    <div className="space-y-3">
                      {listings.map((listing) => (
                        <div key={listing.id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-3">
                          <div className="flex gap-4 items-start">
                            {listing.image_url ? (
                              <img src={listing.image_url} alt={listing.title} className="w-16 h-16 object-cover rounded-lg shrink-0" onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-2xl">{listing.listing_type === "HOTEL" ? "🏨" : listing.listing_type === "FLIGHT" ? "✈️" : "🌴"}</span>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-800">{listing.title}</span>
                                <span className={statusBadge(listing.status)}>{listing.status}</span>
                              </div>
                              <div className="text-sm text-gray-500 flex flex-wrap gap-3">
                                <span>📍 {listing.destination}</span>
                                <span>💰 ${listing.discounted_price}/person</span>
                                <span>💺 {listing.available_seats} seats</span>
                              </div>
                            </div>
                          </div>
                          {listing.status === "ACTIVE" && (
                            <button onClick={() => handleDeactivateListing(listing.id)} className="text-red-600 hover:text-red-800 text-sm font-medium self-start shrink-0">
                              Deactivate
                            </button>
                          )}
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

export default AdminDashboard;