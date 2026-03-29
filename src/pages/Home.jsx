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
            Your data is protected with AES-256 encryption, multi-factor
            authentication and real-time fraud detection.
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
              <div className="card-sub">AES-256 encrypted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="features-title">Why Choose STBS?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>JWT Authentication</h3>
            <p>Secure login with JSON Web Tokens and multi-factor authentication to protect your account.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Safe Payments</h3>
            <p>PCI DSS compliant payment processing with tokenization. Your card details are never stored.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Role Based Access</h3>
            <p>Separate dashboards for customers, travel agents and administrators with strict access control.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Audit Logging</h3>
            <p>Every action is logged and monitored in real time for full transparency and accountability.</p>
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
