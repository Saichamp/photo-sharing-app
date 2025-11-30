import api from './api';

const authService = {
  /**
   * Store authentication tokens in localStorage
   * @param {string} token - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  setTokens: (token, refreshToken) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  /**
   * Get stored access token
   * @returns {string|null} Access token
   */
  getToken: () => localStorage.getItem('token'),

  /**
   * Get stored refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken: () => localStorage.getItem('refreshToken'),

  /**
   * Get stored user data
   * @returns {Object|null} User object
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Store user data in localStorage
   * @param {Object} user - User object
   */
  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  /**
   * Remove all authentication data from localStorage
   */
  clearTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    
    // Store tokens and user data
    authService.setTokens(data.data.token, data.data.refreshToken);
    authService.setUser(data.data.user);
    
    return data;
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials (email, password)
   * @returns {Promise<Object>} Login response
   */
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    
    // Store tokens and user data
    authService.setTokens(data.data.token, data.data.refreshToken);
    authService.setUser(data.data.user);
    
    return data;
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Log error but still clear local tokens
      console.error('Logout API call failed:', error);
    } finally {
      authService.clearTokens();
    }
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise<Object>} New tokens
   * @throws {Error} If refresh token is missing or refresh fails
   */
  refreshToken: async () => {
    const refreshToken = authService.getRefreshToken();
    
    // Only call refresh if we have a refresh token
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Store new tokens
      if (data.data?.token) {
        authService.setTokens(data.data.token, data.data.refreshToken);
      }

      return data.data;
    } catch (error) {
      // Clear invalid tokens on refresh failure
      authService.clearTokens();
      throw error;
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  getProfile: async () => {
    const { data } = await api.get('/auth/me');
    authService.setUser(data.data);
    return data;
  },

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user data
   */
  updateProfile: async (updates) => {
    const { data } = await api.put('/auth/update-profile', updates);
    authService.setUser(data.data);
    return data;
  },

  /**
   * Change user password
   * @param {Object} passwords - Object with currentPassword and newPassword
   * @returns {Promise<Object>} Password change response
   */
  changePassword: async (passwords) => {
    const { data } = await api.put('/auth/change-password', passwords);
    return data;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has valid token
   */
  isAuthenticated: () => {
    const token = authService.getToken();
    return !!token;
  },

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole: (role) => {
    const user = authService.getUser();
    return user?.role === role;
  }
};

export default authService;