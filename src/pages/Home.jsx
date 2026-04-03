import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-logo">✈ STBS</div>
        <button className="nav-login-btn" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Secure · Reliable · Fast</div>
          <h1 className="hero-title">
            Your Journey Starts<br />
            <span className="hero-highlight">Here</span>
          </h1>
          <p className="hero-subtitle">
            Book flights, hotels and travel packages with confidence.
            Get the best deals, instant booking confirmation and
            24/7 support — all in one place.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Get Started
            </button>
            <button className="btn-secondary" onClick={() => navigate('/listings')}>
              Browse Listings
            </button>
          </div>
        </div>

        {/* Floating cards */}
        <div className="hero-cards">
          <div className="float-card card-1">
            <span className="card-icon">🛫</span>
            <div className="card-text">
              <div className="card-title">Flights</div>
              <div className="card-sub">100+ destinations</div>
            </div>
          </div>
          <div className="float-card card-2">
            <span className="card-icon">🏨</span>
            <div className="card-text">
              <div className="card-title">Hotels</div>
              <div className="card-sub">Best rates guaranteed</div>
            </div>
          </div>
          <div className="float-card card-3">
            <span className="card-icon">🗺</span>
            <div className="card-text">
              <div className="card-title">Packages</div>
              <div className="card-sub">All-inclusive deals</div>
            </div>
          </div>
          <div className="float-card card-4">
            <span className="card-icon">🔒</span>
            <div className="card-text">
              <div className="card-title">Secure</div>
              <div className="card-sub">Safe & encrypted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="features-title">Why Choose STBS?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✈️</div>
            <h3>Easy Booking</h3>
            <p>Book flights, hotels and travel packages in just a few clicks. Instant confirmation sent straight to you.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Safe Payments</h3>
            <p>Your payment details are always protected. We never store your full card number — your money is safe with us.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>100+ Destinations</h3>
            <p>Explore flights, hotels and packages to over 100 destinations worldwide. Your next adventure is waiting.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎧</div>
            <h3>24/7 Support</h3>
            <p>Our team is here whenever you need help. From booking to check-in, we have got you covered every step of the way.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="features-title">How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create an Account</h3>
            <p>Sign up in seconds with just your name and email. No complicated forms.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Browse & Choose</h3>
            <p>Search flights, hotels and packages. Filter by type and find the perfect deal.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Book Instantly</h3>
            <p>Select your guests, confirm your booking and get an instant booking reference.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Manage Your Trip</h3>
            <p>View all your bookings and payments anytime from your personal dashboard.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">✈ STBS</div>
        <p>Secure Travel Booking System &mdash; ICT946 Capstone Project &mdash; CIHE Australia 2026</p>
      </footer>
    </div>
  );
}
