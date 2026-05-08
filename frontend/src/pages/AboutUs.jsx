import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  const team = [
    { name: "Vumika Shrestha", role: "Project Lead & Full Stack Developer", emoji: "👩‍💻" },
    { name: "Sweta Manandhar", role: "Frontend Developer & Admin Features", emoji: "👩‍💻" },
    { name: "Prasanna Shrestha", role: "Backend Developer & User Profiles", emoji: "👨‍💻" },
    { name: "Alekhya Gunda", role: "Frontend Developer & Booking Features", emoji: "👩‍💻" },
    { name: "Sonika Gauchan", role: "Frontend Developer & Analytics", emoji: "👩‍💻" },
  ];

  const values = [
    { icon: "🔒", title: "Security First", desc: "We use JWT authentication, 2FA and encrypted payments to keep your data safe." },
    { icon: "🤖", title: "AI Powered", desc: "Gemini AI and Google Places API power our smart search and recommendations." },
    { icon: "✈️", title: "Travel Made Easy", desc: "From search to booking, we make travel planning simple and stress-free." },
    { icon: "💚", title: "Built With Care", desc: "Developed as part of ICT946 Capstone at Crown Institute of Higher Education." },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-4">🏡</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About SafeNest Travel</h1>
          <p className="text-teal-200 text-lg max-w-2xl mx-auto">
            A secure, AI-powered travel booking platform built by students at Crown Institute of Higher Education, Canberra.
          </p>
        </div>
      </div>

      <div className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-teal-900 mb-6">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
            SafeNest Travel was created to make travel booking secure, affordable and intelligent.
            We combine modern security practices with AI technology to deliver a seamless travel experience
            for everyone — from solo travellers to families and travel agents.
          </p>
        </div>
      </div>

      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-teal-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-teal-900 text-center mb-12">Meet the Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center hover:shadow-md transition-all">
                <div className="text-5xl mb-4">{member.emoji}</div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{member.name}</h3>
                <p className="text-teal-600 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 px-4 bg-teal-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-teal-900 mb-4">Ready to Travel?</h2>
          <p className="text-gray-500 text-lg mb-8">
            Join thousands of travellers who trust SafeNest Travel for their adventures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/listings")}
              className="bg-teal-700 hover:bg-teal-800 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-md"
            >
              Browse Packages
            </button>
            <button
              onClick={() => navigate("/register")}
              className="border-2 border-teal-700 text-teal-700 hover:bg-teal-100 px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;