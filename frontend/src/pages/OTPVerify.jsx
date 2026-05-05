import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation }     from "react-router-dom";
import api                              from "../api/axios";
import { useAuth }                      from "../context/AuthContext";

const OTPVerify = () => {
  const [otp,       setOtp]       = useState(["", "", "", "", "", ""]);
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [countdown, setCountdown] = useState(300);

  const navigate   = useNavigate();
  const location   = useLocation();
  const { loginWithTokens } = useAuth();
  const inputRefs  = useRef([]);

  const userId  = location.state?.user_id;
  const email   = location.state?.email;
  const mfaType = location.state?.mfa_type || "EMAIL";

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    // Only start countdown for email OTP
    // TOTP codes refresh every 30 seconds automatically
    if (mfaType !== "EMAIL") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [userId, navigate, mfaType]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ":" + (s < 10 ? "0" + s : s);
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp  = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    // Auto move to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move back on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/users/verify-otp/", {
        user_id:  userId,
        otp_code: otpCode,
      });
      const { user, tokens } = res.data;
      loginWithTokens(user, tokens);
      setSuccess("Verification successful! Redirecting...");
      setTimeout(() => {
        if (user.role === "ADMIN") {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Invalid code. Please try again."
      );
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await api.post("/api/users/resend-otp/", { user_id: userId });
      setCountdown(300);
      setSuccess("New code sent to " + email);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">
              {mfaType === "TOTP" ? "📱" : "🔐"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {mfaType === "TOTP"
              ? "Authenticator Verification"
              : "Email Verification"}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {mfaType === "TOTP"
              ? "Enter the 6-digit code from Microsoft Authenticator"
              : "We sent a 6-digit code to"}
          </p>
          {mfaType === "EMAIL" && (
            <p className="text-teal-700 font-semibold text-sm mt-1">
              {email}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        {/* OTP input boxes */}
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={
                  "w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all " +
                  (digit
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-300 text-gray-800 focus:border-teal-500")
                }
              />
            ))}
          </div>

          {/* Countdown timer — only for Email OTP */}
          {mfaType === "EMAIL" && (
            <div className="text-center mb-4">
              {countdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Code expires in{" "}
                  <span className={
                    "font-semibold " +
                    (countdown < 60 ? "text-red-500" : "text-teal-600")
                  }>
                    {formatTime(countdown)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-red-500 font-medium">
                  Code has expired. Please request a new one.
                </p>
              )}
            </div>
          )}

          {/* TOTP hint */}
          {mfaType === "TOTP" && (
            <div className="text-center mb-4">
              <p className="text-xs text-gray-400">
                Open Microsoft Authenticator on your phone
              </p>
              <p className="text-xs text-gray-400 mt-1">
                The code refreshes every 30 seconds
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full bg-teal-700 text-white py-3 rounded-xl hover:bg-teal-800 transition-colors font-semibold disabled:bg-teal-300 disabled:cursor-not-allowed mb-4"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        {/* Resend — only for Email OTP */}
        {mfaType === "EMAIL" && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Did not receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resending || countdown > 240}
              className="text-teal-600 hover:text-teal-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resending ? "Sending..." : "Resend Code"}
            </button>
            {countdown > 240 && (
              <p className="text-xs text-gray-400 mt-1">
                You can resend in {formatTime(countdown - 240)}
              </p>
            )}
          </div>
        )}

        {/* Back to login */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/login")}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerify;