import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    if (!token) {
      navigate('/login');
      return;
    }
    if (role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        api.get('/bookings/admin/all/'),
	api.get('/payments/admin/all/'),
      ]);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : 	bookingsRes.data.results || []);
	setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : 	paymentsRes.data.results || []);
      // Audit logs endpoint — gracefully handle if not yet implemented
      try {
        const auditRes = await api.get('/users/audit-logs/');
        setAuditLogs(auditRes.data);
      } catch {
        setAuditLogs([]);
      }
    } catch (err) {
      setError('Failed to load admin data. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
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

  // Summary stats
  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    .toFixed(2);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-logo">✈ STBS Admin</div>

        <div className="sidebar-profile">
          <div className="avatar admin-avatar">AD</div>
          <div className="sidebar-name">Administrator</div>
          <div className="sidebar-role admin-role-badge">ADMIN</div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeTab === 'bookings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('bookings')}
          >
            🗓 All Bookings
          </button>
          <button
            className={activeTab === 'payments' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('payments')}
          >
            💳 All Payments
          </button>
          <button
            className={activeTab === 'audit' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('audit')}
          >
            📋 Audit Logs
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
            {activeTab === 'bookings' && 'All Bookings'}
            {activeTab === 'payments' && 'All Payments'}
            {activeTab === 'audit'    && 'Audit Logs'}
          </h2>
          <span className="header-date">
            {new Date().toLocaleDateString('en-AU', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </span>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* ── Overview Stats (always visible) ── */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-number">{bookings.length}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card green">
            <div className="stat-number">
              {bookings.filter(b => b.status === 'CONFIRMED').length}
            </div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-number">
              {bookings.filter(b => b.status === 'PENDING').length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-number">${totalRevenue}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        {/* ── All Bookings Tab ── */}
        {activeTab === 'bookings' && (
          <div className="tab-content">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <span>🗓</span>
                <p>No bookings found in the system.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Customer</th>
                      <th>Destination</th>
                      <th>Guests</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="mono">{booking.booking_reference}</td>
                        <td>{booking.user?.email || 'N/A'}</td>
                        <td>{booking.listing?.destination || 'N/A'}</td>
                        <td>{booking.number_of_guests}</td>
                        <td>${booking.total_price}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getPaymentBadge(booking.payment_status)}`}>
                            {booking.payment_status}
                          </span>
                        </td>
                        <td>{new Date(booking.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── All Payments Tab ── */}
        {activeTab === 'payments' && (
          <div className="tab-content">
            {payments.length === 0 ? (
              <div className="empty-state">
                <span>💳</span>
                <p>No payment records found.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Customer</th>
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
                        <td>{payment.user?.email || 'N/A'}</td>
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

        {/* ── Audit Logs Tab ── */}
        {activeTab === 'audit' && (
          <div className="tab-content">
            {auditLogs.length === 0 ? (
              <div className="empty-state">
                <span>📋</span>
                <p>No audit logs available. Logs will appear once users perform actions.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Action</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, index) => (
                      <tr key={index}>
                        <td>{log.user?.email || 'System'}</td>
                        <td>{log.action}</td>
                        <td className="mono">{log.ip_address || 'N/A'}</td>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
