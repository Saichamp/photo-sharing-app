import React, { useState, useEffect } from 'react';
import '../../styles/Admin.css';

const UserEditModal = ({
  user,
  isOpen,
  onClose,
  onSave,
  onResetPassword,
  onToggleStatus
}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'organizer',
    plan: '',
    isActive: true
  });
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'organizer',
        plan: user.subscription?.plan || '',
        isActive: user.isActive
      });
      setPassword('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    onSave &&
      onSave(user._id, {
        name: form.name,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        subscription: { plan: form.plan }
      });
  };

  const handleResetPassword = () => {
    if (!password.trim()) return;
    onResetPassword && onResetPassword(user._id, password);
  };

  const handleToggleStatus = () => {
    onToggleStatus && onToggleStatus(user._id);
  };

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h3>Edit User</h3>
          <button className="admin-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="admin-modal-body">
          <div className="admin-form-group">
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              type="text"
            />
          </div>

          <div className="admin-form-group">
            <label>Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
            />
          </div>

          <div className="admin-form-group">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label>Plan</label>
            <select name="plan" value={form.plan} onChange={handleChange}>
              <option value="">Unknown</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="admin-form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              Active
            </label>
            <button
              type="button"
              className="admin-btn-secondary small"
              onClick={handleToggleStatus}
            >
              {user.isActive ? 'Disable Account' : 'Enable Account'}
            </button>
          </div>

          <hr />

          <div className="admin-form-group">
            <label>Set New Password</label>
            <input
              type="password"
              value={password}
              placeholder="New password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="admin-btn-warning small"
              onClick={handleResetPassword}
              disabled={!password.trim()}
            >
              Reset Password
            </button>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="admin-btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
