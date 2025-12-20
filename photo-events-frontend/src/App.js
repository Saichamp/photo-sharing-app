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
import UserManagement from './pages/Admin/UserManagement';
import SystemMonitor from './pages/Admin/SystemMonitor';
import PhotoManager from './pages/Admin/PhotoManager';

// Components
import { Navbar } from './components/common/Navbar';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader size="lg" text="Loading..." />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Admin Route Component - restricts access to admin users only
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader size="lg" text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
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
        {/* Public Routes */}
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

        {/* Guest Registration Routes */}
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

        {/* Protected Routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Protected by admin role */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/system"
          element={
            <AdminRoute>
              <SystemMonitor />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/photos"
          element={
            <AdminRoute>
              <PhotoManager />
            </AdminRoute>
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

export default App;
