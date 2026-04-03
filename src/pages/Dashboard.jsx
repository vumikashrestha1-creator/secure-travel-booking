import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, bookingsRes, paymentsRes] = await Promise.all([
        api.get('/users/profile/'),
	api.get('/bookings/my-bookings/'),
	api.get('/payments/my-payments/'),
      ]);
      setProfile(profileRes.data);
      setBookings(bookingsRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel/`);
      fetchAll();
    } catch (err) {
      alert('Could not cancel booking. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      CONFIRMED: 'badge-confirmed',
      PENDING:   'badge-pending',
      CANCELLED: 'badge-cancelled',
      COMPLETED: 'badge-completed',
    };
    return map[status] || 'badge-pending';
  };

  const getPaymentBadge = (status) => {
    const map = {
      COMPLETED: 'badge-confirmed',
      PENDING:   'badge-pending',
      FAILED:    'badge-cancelled',
      REFUNDED:  'badge-refunded',
    };
    return map[status] || 'badge-pending';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">✈ STBS</div>

        {profile && (
          <div className="sidebar-profile">
            <div className="avatar">
              {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
            </div>
            <div className="sidebar-name">{profile.full_name}</div>
            <div className="sidebar-role">{profile.role}</div>
          </div>
        )}

        <nav className="sidebar-nav">
          <button
            className={activeTab === 'bookings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('bookings')}
          >
            🗓 My Bookings
          </button>
          <button
            className={activeTab === 'payments' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('payments')}
          >
            💳 Payments
          </button>
          <button
            className={activeTab === 'profile' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          ⬅ Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-header">
          <h2>
            {activeTab === 'bookings' && 'My Bookings'}
            {activeTab === 'payments' && 'Payment History'}
            {activeTab === 'profile'  && 'My Profile'}
          </h2>
          <span className="header-date">
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* ── Bookings Tab ── */}
        {activeTab === 'bookings' && (
          <div className="tab-content">
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-number">{bookings.length}</div>
                <div className="summary-label">Total Bookings</div>
              </div>
              <div className="summary-card green">
                <div className="summary-number">
                  {bookings.filter(b => b.status === 'CONFIRMED').length}
                </div>
                <div className="summary-label">Confirmed</div>
              </div>
              <div className="summary-card amber">
                <div className="summary-number">
                  {bookings.filter(b => b.status === 'PENDING').length}
                </div>
                <div className="summary-label">Pending</div>
              </div>
              <div className="summary-card red">
                <div className="summary-number">
                  {bookings.filter(b => b.status === 'CANCELLED').length}
                </div>
                <div className="summary-label">Cancelled</div>
              </div>
            </div>

            {/* Booking Cards */}
            {bookings.length === 0 ? (
              <div className="empty-state">
                <span>🗓</span>
                <p>No bookings found. Start exploring travel listings!</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {bookings.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-card-header">
                      <div>
                        <div className="booking-ref">{booking.booking_reference}</div>
                        <div className="booking-destination">
                          {booking.listing?.destination || 'N/A'}
                        </div>
                      </div>
                      <span className={`badge ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="booking-card-body">
                      <div className="booking-detail">
                        <span className="detail-label">Type</span>
                        <span className="detail-value">
                          {booking.listing?.listing_type || 'N/A'}
                        </span>
                      </div>
                      <div className="booking-detail">
                        <span className="detail-label">Guests</span>
                        <span className="detail-value">{booking.number_of_guests}</span>
                      </div>
                      <div className="booking-detail">
                        <span className="detail-label">Total Price</span>
                        <span className="detail-value">${booking.total_price}</span>
                      </div>
                      <div className="booking-detail">
                        <span className="detail-label">Payment</span>
                        <span className={`badge ${getPaymentBadge(booking.payment_status)}`}>
                          {booking.payment_status}
                        </span>
                      </div>
                      <div className="booking-detail">
                        <span className="detail-label">Booked On</span>
                        <span className="detail-value">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <div className="booking-card-footer">
                        <button
                          className="cancel-btn"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Payments Tab ── */}
        {activeTab === 'payments' && (
          <div className="tab-content">
            {payments.length === 0 ? (
              <div className="empty-state">
                <span>💳</span>
                <p>No payment records found.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="mono">{payment.payment_reference}</td>
                        <td>${payment.amount} {payment.currency}</td>
                        <td>{payment.method}</td>
                        <td>
                          <span className={`badge ${getPaymentBadge(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && profile && (
          <div className="tab-content">
            <div className="profile-card">
              <div className="profile-avatar-large">
                {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
              </div>
              <div className="profile-details">
                <div className="profile-row">
                  <span className="profile-label">Full Name</span>
                  <span className="profile-value">{profile.full_name}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{profile.email}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Phone</span>
                  <span className="profile-value">{profile.phone_number || 'Not provided'}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Role</span>
                  <span className={`badge ${profile.role === 'ADMIN' ? 'badge-confirmed' : 'badge-pending'}`}>
                    {profile.role}
                  </span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Verified</span>
                  <span className={`badge ${profile.is_verified ? 'badge-confirmed' : 'badge-cancelled'}`}>
                    {profile.is_verified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Member Since</span>
                  <span className="profile-value">
                    {new Date(profile.date_joined).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
