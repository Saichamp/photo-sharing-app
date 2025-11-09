import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Event API calls
export const eventAPI = {
  create: (eventData) => api.post('/events', eventData),
  getAll: () => api.get('/events'),
  getByQRCode: (qrCode) => api.get(`/events/${qrCode}`)
};

// Registration API calls
export const registrationAPI = {
  // ✅ FIX: Updated to handle FormData
  create: (registrationData) => {
    // If it's FormData, set proper headers
    if (registrationData instanceof FormData) {
      return api.post('/registrations', registrationData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    // Otherwise send as JSON
    return api.post('/registrations', registrationData);
  },
  getByEvent: (eventId) => api.get(`/registrations/${eventId}`)
};

export default api;
