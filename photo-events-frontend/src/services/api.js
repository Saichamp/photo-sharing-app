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
  // Create new event
  create: (eventData) => api.post('/events', eventData),
  
  // Get all events
  getAll: () => api.get('/events'),
  
  // Get single event by QR code
  getByQRCode: (qrCode) => api.get(`/events/${qrCode}`)
};

// Registration API calls
export const registrationAPI = {
  // Create new registration
  create: (registrationData) => api.post('/registrations', registrationData),
  
  // Get registrations for an event
  getByEvent: (eventId) => api.get(`/registrations/${eventId}`)
};

export default api;
