// src/App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Loader } from './components/common/Loader';

// Pages
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/Dashboard/DashboardPage';

// Guest Registration Pages
import MultiStepForm from './components/MultiStepForm';           // old version
import GuestRegistration from './pages/Guest/GuestRegistration'; // new version
import GuestGallery from './pages/Guest/GuestGallery';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';

// Components
import { Navbar } from './components/common/Navbar';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

import './App.css';
import UserManagement from './pages/Admin/UserManagement';
import AllEvents from './pages/Admin/AllEvents';
import API from './services/api'; // or the correct path to your API client

import SecurityLogs from './pages/Admin/SecurityLogs';

import SystemMonitor from './pages/Admin/SystemMonitor';
import ManageUsers from './pages/Admin/ManageUsers';
import ManageEvents from './pages/Admin/ManageEvents';
import ManagePhotos from './pages/Admin/ManagePhotos';
import AnalyticsDashboard from './pages/Admin/AnalyticsDashboard';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader size="lg" text="Loading..." />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Public Route (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader size="lg" text="Loading..." />;
  }

  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        {/* ================================
            PUBLIC ROUTES
            ================================ */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
          
        />
      <Route path="/admin/users" element={<ManageUsers />} />
      <Route path="/admin/events" element={<ManageEvents />} />
      <Route path="/admin/photos" element={<ManagePhotos />} />
      <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
        {/* ================================
            GUEST REGISTRATION ROUTES
            ================================ */}
        {/* NEW: redesigned version */}
        <Route
          path="/event/register/:eventId"
          element={<GuestRegistration />}
        />

        {/* OLD: Multi-step version */}
        <Route
          path="/register/:eventId"
          element={<MultiStepForm />}
        />

        {/* Guest gallery – MultiStepForm / GuestRegistration navigate here */}
        <Route
          path="/guest/gallery/:registrationId"
          element={<GuestGallery />}
        />

        {/* ================================
            PROTECTED ROUTES (ORGANIZER)
            ================================ */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ================================
            ADMIN ROUTES (ADMIN ONLY)
            ================================ */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

    
<Route
  path="/admin/users"
  element={
    <ProtectedAdminRoute>
      <UserManagement />
    </ProtectedAdminRoute>
  }
/>


       <Route
  path="/admin/events"
  element={
    <ProtectedAdminRoute>
      <AllEvents />
    </ProtectedAdminRoute>
  }
/>

<Route
  path="/admin/logs"
  element={
    <ProtectedAdminRoute>
      <SecurityLogs />
    </ProtectedAdminRoute>
  }
/>

<Route
  path="/admin/system"
  element={
    <ProtectedAdminRoute>
      <SystemMonitor />
    </ProtectedAdminRoute>
  }
/>
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
// Admin API endpoints
export const adminAPI = {
  // Get dashboard stats
  getStats: () => API.get('/admin/stats'),

  // User management
  getUsers: (params) => API.get('/admin/users', { params }),
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
  updateUserStatus: (userId, isActive) => 
    API.patch(`/admin/users/${userId}/status`, { isActive }),

  // Event management
  getAllEvents: (params) => API.get('/admin/events', { params }),
  deleteEvent: (eventId) => API.delete(`/admin/events/${eventId}`),

  // Security logs
  getLogs: (params) => API.get('/admin/logs', { params }),

  // System health
  getSystemHealth: () => API.get('/admin/system-health')
};

export default App;
