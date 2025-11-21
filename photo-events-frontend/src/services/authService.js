import api from './api';

export const authService = {
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data;
  },

  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  getProfile: async () => {
    const { data } = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(data.data));
    return data;
  },

  updateProfile: async (updates) => {
    const { data } = await api.put('/auth/update-profile', updates);
    localStorage.setItem('user', JSON.stringify(data.data));
    return data;
  },

  changePassword: async (passwords) => {
    const { data } = await api.put('/auth/change-password', passwords);
    return data;
  }
};
