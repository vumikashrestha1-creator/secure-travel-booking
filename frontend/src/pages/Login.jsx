import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email:    "",
    password: "",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);

      // MFA required — go to OTP screen
      if (result.mfa_required) {
        navigate("/verify-otp", {
          state: {
            user_id:  result.user_id,
            email:    result.email,
            mfa_type: result.mfa_type,
          },
        });
        return;
      }

      // No MFA — redirect by role
      if (result.user.role === "ADMIN") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      const data = err.response?.data;

      if (!data) {
        setError("Cannot connect to server. Please try again.");
        return;
      }

      // Handle all possible error formats from DRF
      if (Array.isArray(data)) {
        setError(data[0]);
      } else if (typeof data === "string") {
        setError(data);
      } else if (data.non_field_errors) {
        setError(
          Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors
        );
      } else if (data.detail) {
        setError(data.detail);
      } else if (data.email) {
        setError(
          Array.isArray(data.email)
            ? data.email[0]
            : data.email
        );
      } else if (data.password) {
        setError(
          Array.isArray(data.password)
            ? data.password[0]
            : data.password
        );
      } else if (data.account) {
        setError(
          Array.isArray(data.account)
            ? data.account[0]
            : data.account
        );
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏠</div>
          <h1 className="text-3xl font-bold text-teal-800">
            SafeNest Travel
          </h1>
          <p className="text-gray-500 mt-2">
            Sign in to your account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* MFA info */}
        <div className="mt-4 bg-teal-50 border border-teal-100 rounded-lg px-4 py-3">
          <p className="text-teal-700 text-xs text-center">
            If you have MFA enabled you will be asked to
            verify your identity after signing in
          </p>
        </div>

        {/* Register link */}
        <p className="text-center text-gray-600 mt-6">
          Do not have an account?{" "}
          <Link
            to="/register"
            className="text-teal-600 hover:text-teal-800 font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;