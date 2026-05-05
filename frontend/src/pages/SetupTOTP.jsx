import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const SetupTOTP = () => {
  const [step,       setStep]       = useState(1);
  const [qrCode,     setQrCode]     = useState("");
  const [secretKey,  setSecretKey]  = useState("");
  const [code,       setCode]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const navigate = useNavigate();

  const handleGenerateQR = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/users/setup-totp/");
      setQrCode(res.data.qr_code);
      setSecretKey(res.data.secret_key);
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Failed to generate QR code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/api/users/confirm-totp/", { code });
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Invalid code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Setup Authenticator App
          </h1>
          <p className="text-gray-500 mt-2">
            Link Microsoft Authenticator to your SafeNest Travel account
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, label: "Start"   },
            { num: 2, label: "Scan QR" },
            { num: 3, label: "Done"    },
          ].map(({ num, label }, i) => (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm " +
                  (step >= num
                    ? "bg-teal-600 text-white"
                    : "bg-gray-200 text-gray-500")
                }>
                  {step > num ? "✓" : num}
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div className={
                  "w-16 h-1 mx-2 mb-4 rounded " +
                  (step > num ? "bg-teal-600" : "bg-gray-200")
                } />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* ── Step 1 — Introduction ──────────────────────── */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <span className="text-5xl">📱</span>
                <h2 className="text-xl font-bold text-gray-800 mt-4">
                  Before You Begin
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  Follow these steps to set up your authenticator app
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 bg-teal-50 rounded-xl p-4">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      Download Microsoft Authenticator
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Install it from the App Store or Google Play
                      on your phone. Google Authenticator also works.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-teal-50 rounded-xl p-4">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      Open the App
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Tap the + button to add a new account
                      then choose Other account
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-teal-50 rounded-xl p-4">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      Scan the QR Code
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      On the next screen we will show you a QR
                      code to scan with your phone camera
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="w-full bg-teal-700 text-white py-3 rounded-xl hover:bg-teal-800 transition-colors font-semibold disabled:bg-teal-300"
              >
                {loading ? "Generating QR Code..." : "Continue"}
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm py-2"
              >
                Cancel — Go Back to Dashboard
              </button>
            </div>
          )}

          {/* ── Step 2 — Scan QR Code ──────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Scan This QR Code
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Open Microsoft Authenticator and scan the
                code below with your phone camera
              </p>

              {/* QR Code image */}
              <div className="flex justify-center mb-6">
                <div className="border-4 border-teal-600 rounded-2xl p-3 bg-white shadow-lg">
                  {qrCode && (
                    <img
                      src={qrCode}
                      alt="QR Code for Microsoft Authenticator"
                      className="w-48 h-48"
                    />
                  )}
                </div>
              </div>

              {/* Manual entry option */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-sm text-teal-600 font-medium w-full text-center"
                >
                  {showSecret
                    ? "Hide secret key"
                    : "Cannot scan? Enter key manually"}
                </button>
                {showSecret && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500 mb-2">
                      Type this key manually in your authenticator app:
                    </p>
                    <p className="font-mono font-bold text-teal-700 bg-white px-4 py-2 rounded-lg border border-teal-200 text-sm tracking-widest break-all">
                      {secretKey}
                    </p>
                  </div>
                )}
              </div>

              {/* Enter confirmation code */}
              <form onSubmit={handleConfirm}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  After scanning enter the 6-digit code
                  shown in your app to confirm
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setCode(val);
                    setError("");
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-teal-500 mb-4"
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-teal-700 text-white py-3 rounded-xl hover:bg-teal-800 transition-colors font-semibold disabled:bg-teal-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Confirm and Enable MFA"}
                </button>
              </form>
            </div>
          )}

          {/* ── Step 3 — Success ───────────────────────────── */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Authenticator Linked!
              </h2>
              <p className="text-gray-500 mb-2">
                Microsoft Authenticator is now linked to your
                SafeNest Travel account.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                From now on you will need to enter a code from
                the app every time you log in.
              </p>

              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-teal-800 mb-2">
                  Important reminders:
                </p>
                <p className="text-xs text-teal-700 mb-1">
                  Do not delete the SafeNest Travel entry from your app
                </p>
                <p className="text-xs text-teal-700 mb-1">
                  If you lose your phone contact your administrator
                  to disable MFA
                </p>
                <p className="text-xs text-teal-700">
                  The code changes every 30 seconds
                </p>
              </div>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-teal-700 text-white py-3 rounded-xl hover:bg-teal-800 transition-colors font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupTOTP;