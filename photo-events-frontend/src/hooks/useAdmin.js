import { useState, useCallback } from 'react';
import adminAPI from '../services/adminService';

export function useAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const safeCall = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fn();
      return res.data?.data ?? res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = (params) =>
    safeCall(() => adminAPI.getUsers(params));

  const fetchUserById = (id) =>
    safeCall(() => adminAPI.getUserById(id));

  const updateUser = (id, payload) =>
    safeCall(() => adminAPI.updateUser(id, payload));

  const resetUserPassword = (id, newPassword) =>
    safeCall(() => adminAPI.resetUserPassword(id, newPassword));

  const toggleUserStatus = (id) =>
    safeCall(() => adminAPI.toggleUserStatus(id));

  const updateSubscription = (id, payload) =>
    safeCall(() => adminAPI.updateSubscription(id, payload));

  const fetchStats = () =>
    safeCall(() => adminAPI.getStats());

  const fetchSystemSummary = () =>
    safeCall(() => adminAPI.getSystemSummary());

  const fetchSystemHealth = () =>
    safeCall(() => adminAPI.getSystemHealth());

  const fetchSystemTrend = (hours) =>
    safeCall(() => adminAPI.getSystemTrend(hours));

  return {
    loading,
    error,
    fetchUsers,
    fetchUserById,
    updateUser,
    resetUserPassword,
    toggleUserStatus,
    updateSubscription,
    fetchStats,
    fetchSystemSummary,
    fetchSystemHealth,
    fetchSystemTrend
  };
}
