/**
 * Protected Admin Route Component
 * Ensures only admin users can access admin pages
 */

import { Navigate } from 'react-router-dom';
import { isAdmin } from '../utils/adminHelper';
import authService from '../services/authService';

const ProtectedAdminRoute = ({ children }) => {
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if authenticated and admin
  return children;
};

export default ProtectedAdminRoute;
