import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Home = () => {
  const navigate  = useNavigate();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    api.get("/api/listings/?sort=rating").then((res) => {
      const data = res.data.results || res.data;
      setListings(Array.isArray(data) ? data.slice(0, 3) : []);
    }).catch(() => {});
  }, []);

  const destinations = [
    { name: "Bali",   img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400", tag: "🌴 Tropical" },
    { name: "Dubai",  img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400", tag: "✨ Luxury"   },
    { name: "Tokyo",  img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400", tag: "🍜 Culture"  },
    { name: "Paris",  img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400", tag: "🗼 Romance"  },
    { name: "Maldives", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400", tag: "🏖️ Beach"  },
    { name: "London", img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400", tag: "🎡 Historic" },
  ];

  const features = [
    { icon: "🔒", title: "Secure Booking",      desc: "JWT authentication and encrypted payments keep your data safe"    },
    { icon: "🤖", title: "AI Smart Search",      desc: "Gemini AI finds real hotels with live ratings from Google Places" },
    { icon: "💰", title: "Best Prices",          desc: "Exclusive deals with up to 25% off on top destinations"           },
    { icon: "⭐", title: "Verified Reviews",     desc: "Real reviews from travellers who have booked with us"             },
    { icon: "✈️", title: "Global Destinations", desc: "Hotels, flights and packages to destinations worldwide"            },
    { icon: "📱", title: "Easy Management",      desc: "Track all your bookings from one simple dashboard"                },
  ];

  const stats = [
    { value: "10+",   label: "Destinations"   },
    { value: "500+",  label: "Happy Travellers" },
    { value: "4.8★",  label: "Average Rating"  },
    { value: "24/7",  label: "Support"         },
  ];

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600"
          alt="Travel"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <span className="text-teal-300 text-sm font-medium">🤖 Now with AI Smart Search</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Discover Your
            <span className="text-teal-400"> Next</span>
            <br />Adventure
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-white/80 max-w-2xl mx-auto leading-relaxed">
            Secure, affordable travel packages to destinations worldwide — powered by AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/listings")}
              className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-lg"
            >
              Browse Packages 🌍
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105"
            >
              Get Started Free
            </button>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <p className="text-2xl font-bold text-teal-300">{s.value}</p>
                <p className="text-white/70 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────── */}
      <div className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-teal-900 mb-4">Why Choose SafeNest Travel?</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Everything you need for a perfect trip, all in one place
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Listings ─────────────────────────────────── */}
      {listings.length > 0 && (
        <div className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-4xl font-bold text-teal-900 mb-2">Top Rated Packages</h2>
                <p className="text-gray-500">Handpicked packages loved by our travellers</p>
              </div>
              <button
                onClick={() => navigate("/listings")}
                className="text-teal-700 font-semibold hover:text-teal-900 transition-colors text-sm border border-teal-200 px-4 py-2 rounded-xl hover:bg-teal-50"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {listings.map((l) => (
                <div
                  key={l.id}
                  onClick={() => navigate("/listings/" + l.id)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                >
                  <div className="relative h-48 overflow-hidden">
                    {l.image_url ? (
                      <img
                        src={l.image_url}
                        alt={l.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-teal-400 to-teal-700 h-full flex items-center justify-center text-5xl">
                        🌴
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 text-teal-800 text-xs px-2 py-1 rounded-full font-semibold">
                        {l.listing_type}
                      </span>
                    </div>
                    {l.discount_percent > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          {l.discount_percent}% OFF
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 mb-1 group-hover:text-teal-700 transition-colors">
                      {l.title}
                    </h3>
                    <p className="text-gray-400 text-xs mb-3">{l.origin} → {l.destination}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-bold text-teal-700">
                          ${l.discounted_price}
                          <span className="text-xs font-normal text-gray-400">/person</span>
                        </p>
                      </div>
                      {l.rating > 0 && (
                        <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full font-medium">
                          ⭐ {Number(l.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Popular Destinations ──────────────────────────────── */}
      <div className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-teal-900 mb-4">Popular Destinations</h2>
            <p className="text-gray-500 text-lg">Explore our most loved travel spots</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {destinations.map((d) => (
              <div
                key={d.name}
                onClick={() => navigate("/listings")}
                className="relative rounded-2xl overflow-hidden cursor-pointer group h-48"
              >
                <img
                  src={d.img}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-white font-bold text-xl">{d.name}</p>
                  <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                    {d.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI Feature Banner ─────────────────────────────────── */}
      <div className="py-16 px-4 bg-gradient-to-r from-teal-700 to-teal-900">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Try Our AI Smart Search
          </h2>
          <p className="text-teal-200 text-lg mb-8 max-w-xl mx-auto">
            Powered by Gemini AI + Google Places — search any destination and get real hotels with live ratings, photos and reviews
          </p>
          <button
            onClick={() => navigate("/listings")}
            className="bg-white text-teal-800 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-teal-50 transition-colors shadow-lg"
          >
            Try AI Search Now →
          </button>
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <div className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-teal-900 mb-4">Ready to Explore?</h2>
          <p className="text-gray-500 text-lg mb-10">
            Join thousands of travellers who trust SafeNest Travel for their adventures
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="bg-teal-700 hover:bg-teal-800 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-md"
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate("/listings")}
              className="border-2 border-teal-700 text-teal-700 hover:bg-teal-50 px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105"
            >
              Browse Packages
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-teal-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <div>
                <span className="text-xl font-bold">SafeNest</span>
                <span className="text-teal-300 text-xl font-light"> Travel</span>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-teal-300">
              <button onClick={() => navigate("/listings")} className="hover:text-white transition-colors">Browse</button>
              <button onClick={() => navigate("/login")}    className="hover:text-white transition-colors">Login</button>
              <button onClick={() => navigate("/register")} className="hover:text-white transition-colors">Register</button>
            </div>
            <p className="text-teal-400 text-sm">
              © 2026 SafeNest Travel — ICT946 Capstone
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
