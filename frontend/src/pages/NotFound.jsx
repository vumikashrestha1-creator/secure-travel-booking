import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-6">🗺️</div>
        <h1 className="text-6xl font-bold text-teal-900 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-500 text-lg mb-8">
          Oops! Looks like this destination doesn't exist on our map.
          Let's get you back on track!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="border-2 border-teal-700 text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-2xl font-bold transition-all"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md"
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;