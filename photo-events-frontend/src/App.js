import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Loader } from './components/common/Loader';

// Pages
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MultiStepForm from './components/MultiStepForm';

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

        {/* Guest Registration (Public) */}
        <Route path="/register/:eventId" element={<MultiStepForm />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
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
