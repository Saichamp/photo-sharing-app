// src/services/api.js

import axios from 'axios';
import authService from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Axios instance with default configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // ✅ INCREASED: 90 seconds for face recognition operations
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor - Add auth token to requests
 */
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - Handle 401 errors and token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );
        
        authService.setTokens(data.data.token, data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        authService.clearTokens();
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
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (updates) => api.put('/auth/update-profile', updates),
  changePassword: (passwords) => api.put('/auth/change-password', passwords)
};

/**
 * Event API endpoints
 */
export const eventAPI = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  getByQRCode: (qrCode) => api.get(`/events/qr/${qrCode}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`)
};

/**
 * Registration API endpoints
 * ✅ Increased timeout for face recognition processing
 */
export const registrationAPI = {
  register: (formData) =>
    api.post('/registrations/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 90000 // ✅ 90 seconds for face processing
    }),
  getByEvent: (eventId) => api.get(`/registrations/event/${eventId}`),
  getByEmail: (email) => api.get(`/registrations/email/${email}`),
  getById: (id) => api.get(`/registrations/${id}`),
  update: (id, data) => api.put(`/registrations/${id}`, data),
  delete: (id) => api.delete(`/registrations/${id}`)
};

/**
 * Photo API endpoints
 * ✅ Increased timeout for photo upload and processing
 */
export const photoAPI = {
  upload: (formData, config = {}) =>
    api.post('/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000, // ✅ 2 minutes for photo upload with face matching
      ...config
    }),
  getByEvent: (eventId, params = {}) =>
    api.get(`/photos/event/${eventId}`, { params }),
  getByRegistration: (registrationId) =>
    api.get(`/photos/registration/${registrationId}`),
  getById: (id) => api.get(`/photos/${id}`),
  delete: (id) => api.delete(`/photos/${id}`),
  processPhoto: (photoId) => api.post(`/photos/process/${photoId}`),
  getStats: (eventId) => api.get(`/photos/event/${eventId}/stats`)
};

/**
 * Face matching API endpoints
 */
/**
 * Face matching API endpoints
 
export const faceAPI = {
  getMatchedPhotos: async (registrationId) => {
    return api.post('/face-matching/find-by-registration', { registrationId });
  }
};*/

// Face matching API endpoints
export const faceAPI = {
  getMatchedPhotos: (registrationId) =>
    api.post('/face-matching/find-by-registration', { registrationId }),
};

// ========================================
// 🆕 ADMIN API ENDPOINTS (ADD THIS)
// ========================================
export const adminAPI = {
  // Platform Statistics
  getStats: () => api.get('/admin/stats'),

  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Event Management (All Events)
  getAllEvents: (params) => api.get('/admin/events', { params }),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),

  // Logs & Monitoring
  getLogs: (params) => api.get('/admin/logs', { params })
};


export default api;
