import React, { createContext, useState, useEffect, useContext } from 'react';
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
   * Check authentication status on mount
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated and load user data
   */
  const checkAuth = async () => {
    try {
      const token = authService.getToken();
      const storedUser = authService.getUser();
      
      if (token && storedUser) {
        // User data exists in localStorage
        setUser(storedUser);
        
        // Optionally fetch fresh user data from server
        try {
          const response = await authService.getProfile();
          setUser(response.data);
        } catch (err) {
          // If profile fetch fails, use stored data
          console.warn('Failed to fetch fresh profile, using cached data');
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
  };

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
      const userData = response.data.user;
      setUser(userData);
      
      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
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
      const newUser = response.data.user;
      setUser(newUser);
      
      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
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
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      setError(null);
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
      setUser(response.data);
      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Update failed';
      setError(message);
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
      throw err;
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data);
      return response;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      throw err;
    }
  };

  /**
   * Clear any authentication errors
   */
  const clearError = () => {
    setError(null);
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
    isAuthenticated: !!user,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;