import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Event API
export const eventAPI = {
  create: (data) => api.post('/events', data),
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getStats: (id) => api.get(`/events/${id}/stats`),
  getByQRCode: (qrCode) => api.get(`/events/qr/${qrCode}`)
};

// Registration API
export const registrationAPI = {
  register: (formData) => api.post('/registrations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByEvent: (eventId, params) => api.get(`/registrations/event/${eventId}`, { params }),
  getById: (id) => api.get(`/registrations/${id}`)
};

// Photo API
export const photoAPI = {
  upload: (formData, onProgress) => api.post('/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      if (onProgress) onProgress(percentCompleted);
    }
  }),
  getByEvent: (eventId, params) => api.get(`/photos/event/${eventId}`, { params }),
  getById: (id) => api.get(`/photos/${id}`),
  delete: (id) => api.delete(`/photos/${id}`),
  getStats: (eventId) => api.get(`/photos/event/${eventId}/stats`)
};

// Face Matching API
export const faceMatchingAPI = {
  findPhotos: (data) => api.post('/face-matching/find', data)
};

export default api;
