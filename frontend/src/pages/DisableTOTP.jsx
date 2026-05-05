import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const DisableTOTP = () => {
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const navigate = useNavigate();
  const { user, loginWithTokens } = useAuth();

  const handleDisable = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/api/users/disable-totp/", { code });

      // Update local user state
      const updatedUser = {
        ...user,
        mfa_enabled:    false,
        mfa_type:       "EMAIL",
        totp_confirmed: false,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      loginWithTokens(updatedUser, {
        access:  localStorage.getItem("access_token"),
        refresh: localStorage.getItem("refresh_token"),
      });

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Invalid code. Please try again."
      );
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Remove Authenticator App
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Enter your current authenticator code to confirm
            you want to disable MFA
          </p>
        </div>

        {/* Warning */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <p className="text-orange-700 text-sm font-medium">
            After removing the authenticator your account
            will have no MFA protection.
          </p>
          <p className="text-orange-600 text-xs mt-1">
            You can re-enable MFA at any time from your dashboard.
          </p>
        </div>

        <form onSubmit={handleDisable}>

          {/* Code input */}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter the current code from Microsoft Authenticator
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            placeholder="000000"
            autoFocus
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-red-400 mb-4"
          />

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Remove button */}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:bg-red-300 disabled:cursor-not-allowed mb-3"
          >
            {loading ? "Removing..." : "Remove Authenticator App"}
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
          >
            Cancel — Keep MFA Enabled
          </button>
        </form>
      </div>
    </div>
  );
};

export default DisableTOTP;