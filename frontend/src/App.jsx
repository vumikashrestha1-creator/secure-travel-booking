import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }    from "./context/AuthContext";
import Navbar              from "./components/Navbar";
import ProtectedRoute      from "./components/ProtectedRoute";
import AdminRoute          from "./components/AdminRoute";
import Login               from "./pages/Login";
import Register            from "./pages/Register";
import Dashboard           from "./pages/Dashboard";
import Listings            from "./pages/Listings";
import Bookings            from "./pages/Bookings";
import AdminDashboard      from "./pages/AdminDashboard";
import ListingDetail       from "./pages/ListingDetail";
import Payment             from "./pages/Payment";
import Home                from "./pages/Home";
import OTPVerify           from "./pages/OTPVerify";
import SetupTOTP           from "./pages/SetupTOTP";
import DisableTOTP         from "./pages/DisableTOTP";
import Profile             from "./pages/Profile";
import AIChatbot           from "./components/AIChatbot";
import TravelAgentDashboard from "./pages/TravelAgentDashboard";
import AboutUs             from "./pages/AboutUs";
import Contact             from "./pages/Contact";
import NotFound            from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/login"        element={<Login />} />
            <Route path="/register"     element={<Register />} />
            <Route path="/listings"     element={<Listings />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/about"        element={<AboutUs />} />
            <Route path="/contact"      element={<Contact />} />

            {/* MFA verification */}
            <Route path="/verify-otp"   element={<OTPVerify />} />

            {/* Customer protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            }/>
            <Route path="/bookings" element={
              <ProtectedRoute><Bookings /></ProtectedRoute>
            }/>
            <Route path="/payment/:bookingId" element={
              <ProtectedRoute><Payment /></ProtectedRoute>
            }/>

            {/* TOTP setup / disable */}
            <Route path="/setup-totp" element={
              <ProtectedRoute><SetupTOTP /></ProtectedRoute>
            }/>
            <Route path="/disable-totp" element={
              <ProtectedRoute><DisableTOTP /></ProtectedRoute>
            }/>
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            }/>

            {/* Admin only */}
            <Route path="/admin-dashboard" element={
              <AdminRoute><AdminDashboard /></AdminRoute>
            }/>

            {/* Travel Agent */}
            <Route path="/agent-dashboard" element={
              <ProtectedRoute><TravelAgentDashboard /></ProtectedRoute>
            }/>

            {/* Default */}
            <Route path="/" element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIChatbot />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;