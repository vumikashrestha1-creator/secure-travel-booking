import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, isLoggedIn, logout, isAdmin, isManager, isTravelAgent } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    "text-sm font-medium transition-colors duration-200 " +
    (isActive(path) ? "text-white" : "text-teal-200 hover:text-white");

  return (
    <nav className="bg-gradient-to-r from-teal-800 to-teal-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🏠</span>
            <div className="leading-tight">
              <span className="text-xl font-bold tracking-wide">SafeNest</span>
              <span className="text-teal-300 text-xl font-light"> Travel</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/listings" className={linkClass("/listings")}>
              Browse Packages
            </Link>

            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className={linkClass("/dashboard")}>
                  Dashboard
                </Link>
                <Link to="/bookings" className={linkClass("/bookings")}>
                  My Bookings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin-dashboard"
                    className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold hover:bg-yellow-300 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {isManager && (
                  <Link
                    to="/dashboard"
                    className="bg-orange-400 text-white px-3 py-1 rounded-full text-sm font-bold hover:bg-orange-500 transition-colors"
                  >
                    Manager
                  </Link>
                )}
                
                {isTravelAgent && (
                <Link to="/agent-dashboard" className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold hover:bg-blue-600 transition-colors">
                  Agent
                </Link>
              )}
                
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 text-teal-200 hover:text-white text-sm transition-colors"
                >
                  <span className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <span className="max-w-24 truncate">{user?.full_name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={linkClass("/login")}>Login</Link>
                <Link
                  to="/register"
                  className="bg-teal-500 hover:bg-teal-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-teal-700 transition-colors"
            aria-label="Toggle menu"
          >
            <span className={"block w-5 h-0.5 bg-white transition-all duration-300 " + (menuOpen ? "rotate-45 translate-y-2" : "")} />
            <span className={"block w-5 h-0.5 bg-white transition-all duration-300 " + (menuOpen ? "opacity-0" : "")} />
            <span className={"block w-5 h-0.5 bg-white transition-all duration-300 " + (menuOpen ? "-rotate-45 -translate-y-2" : "")} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-teal-900 border-t border-teal-700 px-4 py-4 space-y-3">
          <Link
            to="/listings"
            onClick={() => setMenuOpen(false)}
            className="block text-teal-200 hover:text-white text-sm font-medium py-2 border-b border-teal-800"
          >
            🌍 Browse Packages
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block text-teal-200 hover:text-white text-sm font-medium py-2 border-b border-teal-800"
              >
                📊 Dashboard
              </Link>
              <Link
                to="/bookings"
                onClick={() => setMenuOpen(false)}
                className="block text-teal-200 hover:text-white text-sm font-medium py-2 border-b border-teal-800"
              >
                🎫 My Bookings
              </Link>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block text-teal-200 hover:text-white text-sm font-medium py-2 border-b border-teal-800"
              >
                👤 {user?.full_name}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin-dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block bg-yellow-400 text-gray-900 text-sm font-bold py-2 px-3 rounded-lg mb-2"
                >
                  ⚙️ Admin Dashboard
                </Link>
              )}
              {isManager && (
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block bg-orange-400 text-white text-sm font-bold py-2 px-3 rounded-lg mb-2"
                >
                  📊 Manager Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center border border-teal-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center bg-teal-500 hover:bg-teal-400 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;