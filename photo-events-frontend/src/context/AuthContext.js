import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService from '../services/authService';

/**
 * Authentication Context
 */
export const AuthContext = createContext();

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth methods to the app
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Check if user is authenticated and load user data
   */
  const checkAuth = useCallback(async () => {
    try {
      const token = authService.getToken();
      const storedUser = authService.getUser();
      
      if (!token) {
        // No token, user is not authenticated
        setUser(null);
        setLoading(false);
        return;
      }

      if (storedUser) {
        // Set cached user data immediately
        setUser(storedUser);
      }
      
      // Try to fetch fresh user data from server
      try {
        const response = await authService.getProfile();
        const freshUser = response.data.user || response.data;
        setUser(freshUser);
        
        // Update cached user data
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch (err) {
        console.warn('Failed to fetch fresh profile:', err.message);
        
        // If 401 Unauthorized, token is invalid
        if (err.response?.status === 401) {
          console.log('Token expired or invalid, clearing auth data');
          authService.clearTokens();
          setUser(null);
        } else if (storedUser) {
          // For other errors, use cached data
          console.log('Using cached user data');
          setUser(storedUser);
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Clear invalid auth data
      authService.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check authentication status on mount
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Login user with credentials
   * @param {string|Object} emailOrCredentials - Email string or credentials object
   * @param {string} password - Password (if first param is email string)
   * @returns {Promise<Object>} Login response
   */
  const login = async (emailOrCredentials, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Support both calling patterns: login(email, password) and login({ email, password })
      const credentials = typeof emailOrCredentials === 'string' 
        ? { email: emailOrCredentials, password }
        : emailOrCredentials;
      
      const response = await authService.login(credentials);
      
      // authService.login already stores tokens and user data
      const userData = response.data.user || response.data.data?.user;
      setUser(userData);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      
      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      console.error('Login error:', message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.register(userData);
      
      // authService.register already stores tokens and user data
      const newUser = response.data.user || response.data.data?.user;
      setUser(newUser);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(newUser));
      
      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
      console.error('Registration error:', message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call logout API (optional, may fail if token expired)
      try {
        await authService.logout();
      } catch (err) {
        console.warn('Logout API call failed:', err.message);
        // Continue with local logout even if API fails
      }
      
      // Clear all auth data
      authService.clearTokens();
      setUser(null);
      setError(null);
      
      console.log('User logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Update response
   */
  const updateProfile = async (updates) => {
    try {
      setError(null);
      const response = await authService.updateProfile(updates);
      const updatedUser = response.data.user || response.data.data?.user || response.data;
      
      setUser(updatedUser);
      
      // Update cached user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Update failed';
      setError(message);
      console.error('Profile update error:', message);
      throw err;
    }
  };

  /**
   * Change user password
   * @param {Object} passwords - Object with currentPassword and newPassword
   * @returns {Promise<Object>} Password change response
   */
  const changePassword = async (passwords) => {
    try {
      setError(null);
      const response = await authService.changePassword(passwords);
      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Password change failed';
      setError(message);
      console.error('Password change error:', message);
      throw err;
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      const freshUser = response.data.user || response.data.data?.user || response.data;
      
      setUser(freshUser);
      
      // Update cached user data
      localStorage.setItem('user', JSON.stringify(freshUser));
      
      return response;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      
      // If 401, clear auth data
      if (err.response?.status === 401) {
        authService.clearTokens();
        setUser(null);
      }
      
      throw err;
    }
  };

  /**
   * Clear any authentication errors
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return user?.role === role;
  };

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  /**
   * Check if user is organizer
   * @returns {boolean}
   */
  const isOrganizer = () => {
    return user?.role === 'organizer' || user?.role === 'admin';
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    clearError,
    checkAuth,
    hasRole,
    isAdmin,
    isOrganizer,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
