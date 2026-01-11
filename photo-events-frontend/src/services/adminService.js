import api from './api';

export const adminAPI = {
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload),
  resetUserPassword: (id, newPassword) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  updateSubscription: (id, payload) =>
    api.patch(`/admin/users/${id}/subscription`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Dashboard stats
  getStats: () => api.get('/admin/stats'),

  // System health
  getSystemHealth: () => api.get('/admin/system/health'),
  getSystemTrend: (hours = 24) =>
    api.get('/admin/system/health/trend', { params: { hours } }),
  getSystemSummary: () => api.get('/admin/system/summary')
};


export default adminAPI;
