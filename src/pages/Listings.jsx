import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Listings.css';

export default function Listings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    let results = listings;
    if (search.trim()) {
      results = results.filter(l =>
        l.destination?.toLowerCase().includes(search.toLowerCase()) ||
        l.title?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (typeFilter !== 'ALL') {
      results = results.filter(l => l.listing_type === typeFilter);
    }
    setFiltered(results);
  }, [search, typeFilter, listings]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/listings/');
      setListings(res.data);
      setFiltered(res.data);
    } catch (err) {
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = { FLIGHT: '🛫', HOTEL: '🏨', PACKAGE: '🗺', CAR: '🚗' };
    return icons[type] || '✈';
  };

  const getTypeClass = (type) => {
    const classes = { FLIGHT: 'type-flight', HOTEL: 'type-hotel', PACKAGE: 'type-package', CAR: 'type-car' };
    return classes[type] || 'type-default';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="listings-page">
      {/* Navbar */}
      <nav className="listings-nav">
        <div className="nav-logo" onClick={() => navigate('/')}>✈ STBS</div>
        <div className="nav-links">
          <button className="nav-link" onClick={() => navigate('/')}>Home</button>
          {localStorage.getItem('access_token') ? (
            <button className="nav-login-btn" onClick={() => navigate('/dashboard')}>
              My Dashboard
            </button>
          ) : (
            <button className="nav-login-btn" onClick={() => navigate('/login')}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      <div className="listings-container">
        {/* Page Header */}
        <div className="listings-header">
          <h1>Browse Travel Listings</h1>
          <p>Discover flights, hotels and packages — all secured with AES-256 encryption</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="filter-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by destination or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="type-filters">
            {['ALL', 'FLIGHT', 'HOTEL', 'PACKAGE'].map(type => (
              <button
                key={type}
                className={`filter-btn ${typeFilter === type ? 'active' : ''}`}
                onClick={() => setTypeFilter(type)}
              >
                {type === 'ALL' ? 'All' : `${getTypeIcon(type)} ${type}`}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Results count */}
        <div className="results-count">
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
        </div>

        {/* Listings Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span>🔍</span>
            <p>No listings match your search. Try different keywords or filters.</p>
          </div>
        ) : (
          <div className="listings-grid">
            {filtered.map((listing) => (
              <div
                key={listing.id}
                className="listing-card"
                onClick={() => setSelectedListing(listing)}
              >
                <div className="listing-card-top">
                  <div className={`listing-type-badge ${getTypeClass(listing.listing_type)}`}>
                    {getTypeIcon(listing.listing_type)} {listing.listing_type}
                  </div>
                  {listing.is_available === false && (
                    <div className="unavailable-badge">Unavailable</div>
                  )}
                </div>

                <div className="listing-card-body">
                  <h3 className="listing-title">{listing.title}</h3>
                  <div className="listing-destination">
                    📍 {listing.destination}
                  </div>
                  {listing.description && (
                    <p className="listing-description">
                      {listing.description.length > 100
                        ? listing.description.substring(0, 100) + '...'
                        : listing.description}
                    </p>
                  )}
                </div>

                <div className="listing-card-footer">
                  <div className="listing-price">
                    <span className="price-amount">${listing.price_per_person}</span>
                    <span className="price-label"> / person</span>
                  </div>
                  <button
                    className="book-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedListing(listing);
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedListing && (
        <BookingModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSuccess={() => {
            setSelectedListing(null);
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
}

// ── Booking Modal Component ──────────────────────────────────────────────────
function BookingModal({ listing, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [guests, setGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalPrice = (parseFloat(listing.price_per_person || 0) * guests).toFixed(2);

  const handleBook = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/bookings/create/', {
        listing: listing.id,
        number_of_guests: guests,
      });
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Booking failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 className="modal-title">Confirm Booking</h2>

        <div className="modal-listing-info">
          <div className="modal-destination">📍 {listing.destination}</div>
          <div className="modal-listing-title">{listing.title}</div>
        </div>

        <form onSubmit={handleBook} className="booking-form">
          <div className="form-group">
            <label>Number of Guests</label>
            <input
              type="number"
              min="1"
              max="20"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
              className="form-input"
              required
            />
          </div>

          <div className="price-summary">
            <div className="price-row">
              <span>Price per person</span>
              <span>${listing.price_per_person}</span>
            </div>
            <div className="price-row">
              <span>Guests</span>
              <span>× {guests}</span>
            </div>
            <div className="price-row total">
              <span>Total</span>
              <span>${totalPrice}</span>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : `Confirm Booking — $${totalPrice}`}
          </button>

          <p className="modal-note">
            🔒 Your booking is secured with AES-256 encryption
          </p>
        </form>
      </div>
    </div>
  );
}
