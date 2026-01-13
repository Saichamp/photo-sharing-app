import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setMessage(null);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        company: formData.company
      });

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Password change failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>Profile Settings</h2>
        <p>Manage your personal information and security</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Personal Info */}
      <div className="profile-section">
        <div className="section-header">
          <h3>Personal Information</h3>
          {!isEditing && (
            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleUpdateProfile} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-input readonly"
                value={user?.email || ''}
                disabled
              />
              <span className="field-hint">Email cannot be changed</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={!isEditing}
                placeholder="Optional"
              />
            </div>

            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                className="form-input"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                disabled={!isEditing}
                placeholder="Optional"
              />
            </div>
          </div>

          {isEditing && (
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Change Password */}
      <div className="profile-section">
        <h3>Change Password</h3>
        <form className="password-form" onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" className="form-input" onChange={(e) => handleChange('currentPassword', e.target.value)} />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input type="password" className="form-input" onChange={(e) => handleChange('newPassword', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" className="form-input" onChange={(e) => handleChange('confirmPassword', e.target.value)} />
          </div>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
