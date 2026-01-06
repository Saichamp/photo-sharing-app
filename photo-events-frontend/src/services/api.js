// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Token Management (Simple & Reliable)
 */
const TokenService = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  removeToken: () => localStorage.removeItem('token'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),
};

/**
 * Axios instance with default configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor - Add auth token to ALL requests
 */
api.interceptors.request.use(
  (config) => {
    const token = TokenService.getToken();
    
    // ✅ DEBUG: Log token status
    console.log('🔑 Request to:', config.url, '| Token:', token ? 'EXISTS' : 'MISSING');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('⚠️ 401 Unauthorized - Token invalid or expired');
      
      originalRequest._retry = true;

      try {
        const refreshToken = TokenService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh token
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        TokenService.setToken(data.data.token);
        TokenService.setRefreshToken(data.data.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        TokenService.removeToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Auth API endpoints
 */
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    
    // ✅ Save tokens after successful login
    if (response.data.success && response.data.data.token) {
      TokenService.setToken(response.data.data.token);
      if (response.data.data.refreshToken) {
        TokenService.setRefreshToken(response.data.data.refreshToken);
      }
      console.log('✅ Login successful - Token saved');
    }
    
    return response;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    // ✅ Save tokens after successful registration
    if (response.data.success && response.data.data.token) {
      TokenService.setToken(response.data.data.token);
      if (response.data.data.refreshToken) {
        TokenService.setRefreshToken(response.data.data.refreshToken);
      }
      console.log('✅ Registration successful - Token saved');
    }
    
    return response;
  },
  
  logout: () => {
    TokenService.removeToken();
    return api.post('/auth/logout');
  },
  
  getProfile: () => api.get('/auth/me'),
  updateProfile: (updates) => api.put('/auth/update-profile', updates),
  changePassword: (passwords) => api.put('/auth/change-password', passwords)
};


export const eventAPI = {
  // Get all events for logged-in user
  getAll: () => api.get('/events'),
  
  // Create new event
  create: (eventData) => api.post('/events', eventData),
  
  // Get single event
  getById: (id) => api.get(`/events/${id}`),
  
  // Update event
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  
  // Delete event
  delete: (id) => api.delete(`/events/${id}`),
};

/**
 * Registration API endpoints
 */
export const registrationAPI = {
  register: (formData) =>
    api.post('/registrations/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 90000
    }),
  getByEvent: (eventId) => api.get(`/registrations/event/${eventId}`),
  getByEmail: (email) => api.get(`/registrations/email/${email}`),
  getById: (id) => api.get(`/registrations/${id}`),
  update: (id, data) => api.put(`/registrations/${id}`, data),
  delete: (id) => api.delete(`/registrations/${id}`)
};

/**
 * ✅ COMPLETE Photo API endpoints
 */
export const photoAPI = {
  // Upload photos (with progress tracking)
  upload: (formData, config = {}) => 
    api.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000, // 5 minutes for large uploads
      ...config
    }),
  
  // Get ALL photos for preview page (no pagination)
  getAllPhotos: (eventId) => 
    api.get(`/photos/event/${eventId}/all`),
  
  // Get photos by event (paginated - for public gallery)
  getByEvent: (eventId, page = 1, limit = 50) => 
    api.get(`/photos/event/${eventId}?page=${page}&limit=${limit}`),
  
  // Alternative name for getByEvent (for compatibility)
  getEventPhotos: (eventId, page = 1, limit = 50) => 
    api.get(`/photos/event/${eventId}?page=${page}&limit=${limit}`),
  
  // Get photo statistics for an event
  getStats: (eventId) => 
    api.get(`/photos/event/${eventId}/stats`),
  
  // Get single photo by ID
  getById: (photoId) => 
    api.get(`/photos/${photoId}`),
  
  // Process/reprocess a single photo's faces
  processPhoto: (photoId) => 
    api.post(`/photos/process/${photoId}`),
  
  // Delete a photo
  deletePhoto: (photoId) => 
    api.delete(`/photos/${photoId}`),
  
  // Get matched photos for a guest
  getMatchedPhotos: (registrationId) => 
    api.get(`/photos/matches/${registrationId}`),
  
  // Trigger batch matching for all photos in event
  batchMatch: (eventId) => 
    api.post(`/photos/event/${eventId}/batch-match`),
  
  // Bulk delete photos
  bulkDelete: (photoIds) => 
    api.post('/photos/bulk-delete', { photoIds }),
};

/**
 * Face matching API endpoints
 */
export const faceAPI = {
  // Get matched photos by registration ID
  getMatchedPhotos: (registrationId) =>
    api.get(`/photos/matches/${registrationId}`),
  
  // Find matches using face recognition service
  findMatches: (registrationId) =>
    api.post('/face-matching/find-by-registration', { registrationId }),
  
  // Extract faces from a photo
  extractFaces: (formData) =>
    api.post('/face-matching/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  
  // Test face recognition
  testRecognition: (formData) =>
    api.post('/face-matching/test', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
};

/**
 * Admin API endpoints
 */
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllEvents: (params) => api.get('/admin/events', { params }),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  getLogs: (params) => api.get('/admin/logs', { params }),
  getSystemHealth: () => api.get('/admin/system/health'),
  updateSettings: (settings) => api.put('/admin/settings', settings),
  getSettings: () => api.get('/admin/settings'),
};

/**
 * Analytics API endpoints
 */
export const analyticsAPI = {
  getEventAnalytics: (eventId) => api.get(`/analytics/event/${eventId}`),
  getOverviewStats: () => api.get('/analytics/overview'),
  getPhotoStats: (eventId) => api.get(`/analytics/photos/${eventId}`),
  getRegistrationStats: (eventId) => api.get(`/analytics/registrations/${eventId}`),
};

// ✅ Export TokenService for manual access if needed
export { TokenService };

export default api;
