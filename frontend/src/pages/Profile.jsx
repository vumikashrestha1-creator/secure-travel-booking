import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    country: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/users/profile/');
      setProfile(res.data);
      setForm({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        phone_number: res.data.phone_number || '',
        address: res.data.address || '',
        city: res.data.city || '',
        country: res.data.country || '',
      });
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await api.put('/api/users/profile/', form);
      setProfile(res.data);
      setEditing(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#0f4c3a' }}>
      Loading profile...
    </div>
  );

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f4c3a, #1a7a5e)',
        borderRadius: '16px',
        padding: '32px',
        color: 'white',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', fontWeight: 'bold'
        }}>
          {profile?.first_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px' }}>
            {profile?.first_name} {profile?.last_name}
          </h2>
          <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{profile?.email}</p>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 12px', borderRadius: '20px',
            fontSize: '12px', marginTop: '8px', display: 'inline-block'
          }}>
            {profile?.role || 'CUSTOMER'}
          </span>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          background: '#d4edda', color: '#155724',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px'
        }}>
          ✅ {message}
        </div>
      )}
      {error && (
        <div style={{
          background: '#f8d7da', color: '#721c24',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Profile Card */}
      <div style={{
        background: 'white', borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, color: '#0f4c3a' }}>Personal Information</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                background: '#0f4c3a', color: 'white', border: 'none',
                padding: '8px 20px', borderRadius: '8px', cursor: 'pointer'
              }}>
              ✏️ Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { label: 'First Name', value: profile?.first_name },
              { label: 'Last Name', value: profile?.last_name },
              { label: 'Email', value: profile?.email },
              { label: 'Phone Number', value: profile?.phone_number || 'Not provided' },
              { label: 'Role', value: profile?.role || 'CUSTOMER' },
              { label: 'Member Since', value: profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : 'N/A' },
              { label: 'Address', value: profile?.address || 'Not provided' },
              { label: 'City', value: profile?.city || 'Not provided' },
              { label: 'Country', value: profile?.country || 'Not provided' },
            ].map((item, i) => (
              <div key={i}>
                <p style={{ margin: '0 0 4px', color: '#888', fontSize: '13px' }}>{item.label}</p>
                <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>{item.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'First Name', name: 'first_name' },
                { label: 'Last Name', name: 'last_name' },
                { label: 'Email', name: 'email', type: 'email' },
                { label: 'Phone Number', name: 'phone_number' },
                { label: 'Address', name: 'address' },
                { label: 'City', name: 'city' },
                { label: 'Country', name: 'country' },
              ].map((field, i) => (
                <div key={i}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    style={{
                      width: '100%', padding: '10px 12px',
                      border: '1px solid #ddd', borderRadius: '8px',
                      fontSize: '14px', boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" style={{
                background: '#0f4c3a', color: 'white', border: 'none',
                padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}>
                Save Changes
              </button>
              <button type="button" onClick={() => setEditing(false)} style={{
                background: '#f0f0f0', color: '#333', border: 'none',
                padding: '10px 24px', borderRadius: '8px', cursor: 'pointer'
              }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security Section */}
      <div style={{
        background: 'white', borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        padding: '20px 32px', marginTop: '16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: '0 0 4px', color: '#0f4c3a' }}>🔒 Security</h4>
          <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>Manage your password and security settings</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#f0f0f0', color: '#333', border: 'none',
            padding: '8px 20px', borderRadius: '8px', cursor: 'pointer'
          }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Profile;