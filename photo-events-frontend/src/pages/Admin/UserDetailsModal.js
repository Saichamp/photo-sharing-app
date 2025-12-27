/**
 * User Details Modal
 * View and edit user information
 */

import React, { useState } from 'react';
import axios from 'axios';
import './UserDetailsModal.css';

const UserDetailsModal = ({ user, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'organizer'
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Save changes
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_URL}/admin/users/${user._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('User updated successfully');
      setIsEditing(false);
      onUpdate(); // Refresh user list
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!window.confirm('Are you sure you want to reset this user\'s password? A new temporary password will be sent to their email.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/admin/users/${user._id}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Password reset successfully! Temporary password: ${response.data.data.tempPassword}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            👤 User Details
          </h2>
          <button className="close-btn" onClick={onClose}>
            ❌
          </button>
        </div>

        <div className="modal-body">
          {/* User Avatar */}
          <div className="user-avatar-large">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          {/* User Info Form */}
          <div className="user-info-form">
            <div className="form-group">
              <label>
                👤 Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter name"
                />
              ) : (
                <p className="info-value">{user.name || 'N/A'}</p>
              )}
            </div>

            <div className="form-group">
              <label>
                📧 Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              ) : (
                <p className="info-value">{user.email}</p>
              )}
            </div>

            <div className="form-group">
              <label>
                🛡️ Role
              </label>
              {isEditing ? (
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <p className="info-value">
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </p>
              )}
            </div>

            <div className="form-group">
              <label>
                📅 Joined Date
              </label>
              <p className="info-value">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="form-group">
              <label>Status</label>
              <p className="info-value">
                <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          </div>

          {/* User Statistics */}
          <div className="user-stats-grid">
            <div className="stat-box">
              <div className="stat-icon events">
                🎉
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Events</span>
                <span className="stat-number">{user.eventCount || 0}</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon photos">
                📸
              </div>
              <div className="stat-info">
                <span className="stat-label">Photos Uploaded</span>
                <span className="stat-number">{user.quota?.photosUsed || 0}</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon storage">
                💾
              </div>
              <div className="stat-info">
                <span className="stat-label">Storage Used</span>
                <span className="stat-number">
                  {((user.quota?.storageUsed || 0) / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="subscription-info">
            <h3>Subscription Details</h3>
            <div className="subscription-grid">
              <div className="sub-item">
                <span className="sub-label">Plan:</span>
                <span className={`plan-badge ${user.subscription?.plan || 'free'}`}>
                  {user.subscription?.plan || 'Free'}
                </span>
              </div>
              <div className="sub-item">
                <span className="sub-label">Events Limit:</span>
                <span className="sub-value">
                  {user.quota?.eventsUsed || 0} / {user.quota?.eventsLimit || 3}
                </span>
              </div>
              <div className="sub-item">
                <span className="sub-label">Photos Limit:</span>
                <span className="sub-value">
                  {user.quota?.photosUsed || 0} / {user.quota?.photosLimit || 100}
                </span>
              </div>
              <div className="sub-item">
                <span className="sub-label">Storage Limit:</span>
                <span className="sub-value">
                  {((user.quota?.storageUsed || 0) / (1024 * 1024)).toFixed(2)} MB / 
                  {((user.quota?.storageLimit || 104857600) / (1024 * 1024)).toFixed(0)} MB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          {isEditing ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    role: user.role || 'organizer'
                  });
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleResetPassword}
                disabled={loading}
              >
                🔑 Reset Password
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit User
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
