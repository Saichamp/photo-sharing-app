/**
 * User Management Page
 * Admin can view, search, filter, ban, and delete users
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { 
  requireAdmin, 
  formatNumber, 
  getUserStatusBadge, 
  getPlanBadge, 
  getRoleBadge 
} from '../../utils/adminHelper';
import './UserManagement.css';

const UserManagement = () => {
  const navigate = useNavigate();
  
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Pagination
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    plan: '',
    page: 1,
    limit: 10
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });

  // ✅ FIXED: Use useCallback to memoize fetchUsers
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers(filters);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ✅ Check admin access on mount
  useEffect(() => {
    if (!requireAdmin(navigate)) return;
  }, [navigate]);

  // ✅ Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleToggleStatus = async (user) => {
    if (window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}?`)) {
      try {
        setActionLoading(true);
        await adminAPI.updateUserStatus(user._id, !user.isActive);
        await fetchUsers();
        alert(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update user status');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await adminAPI.deleteUser(selectedUser._id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      await fetchUsers();
      alert('User deleted successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setSelectedUser(null);
    setShowDeleteModal(false);
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>👥 User Management</h1>
          <p className="subtitle">
            Manage all users and their subscriptions
          </p>
        </div>
        <button onClick={fetchUsers} className="btn-refresh" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-grid">
          {/* Search */}
          <div className="filter-group">
            <label>🔍 Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={handleSearch}
              className="filter-input"
            />
          </div>

          {/* Role Filter */}
          <div className="filter-group">
            <label>👤 Role</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="filter-select"
            >
              <option value="">All Roles</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>📊 Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="filter-group">
            <label>💳 Plan</label>
            <select
              value={filters.plan}
              onChange={(e) => handleFilterChange('plan', e.target.value)}
              className="filter-select"
            >
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="results-info">
          Showing {users.length} of {formatNumber(pagination.totalUsers)} users
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Users Table */}
      {users.length > 0 ? (
        <>
          <div className="table-card">
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Plan</th>
                    <th>Events</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const statusBadge = getUserStatusBadge(user.isActive);
                    const planBadge = getPlanBadge(user.subscription?.plan);
                    const roleBadge = getRoleBadge(user.role);

                    return (
                      <tr key={user._id}>
                        {/* User Info */}
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-small">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                              <div className="user-name">{user.name}</div>
                              <div className="user-email">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          <span className={`badge ${roleBadge.className}`}>
                            {roleBadge.text}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`badge ${statusBadge.className}`}>
                            {statusBadge.text}
                          </span>
                        </td>

                        {/* Plan */}
                        <td>
                          <span className={`badge ${planBadge.className}`}>
                            {planBadge.text}
                          </span>
                        </td>

                        {/* Events Count */}
                        <td>
                          <span className="event-count-badge">
                            {user.eventCount || 0}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="date-cell">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`btn-action ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                              disabled={actionLoading}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive ? '🔒' : '✅'}
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="btn-action btn-danger"
                              disabled={actionLoading}
                              title="Delete User"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1 || loading}
                className="pagination-btn"
              >
                ← Previous
              </button>

              <div className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.totalPages || loading}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No users found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Delete User</h3>
              <button onClick={closeDeleteModal} className="modal-close">
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete this user?</p>
              <div className="user-delete-info">
                <strong>{selectedUser.name}</strong>
                <span>{selectedUser.email}</span>
              </div>
              <div className="warning-box">
                <strong>⚠️ Warning:</strong> This will permanently delete:
                <ul>
                  <li>User account</li>
                  <li>All events created by this user</li>
                  <li>All photos uploaded by this user</li>
                  <li>All registrations</li>
                </ul>
                <strong>This action cannot be undone!</strong>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={closeDeleteModal}
                className="btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="btn-danger"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
