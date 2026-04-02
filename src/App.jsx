import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Listings from './pages/Listings';

// Role-based redirect: sends user to correct dashboard based on stored role
function DashboardRouter() {
  const role = localStorage.getItem('user_role');
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Dashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/listings"  element={<Listings />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/admin"     element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
