/**
 * Event Details Modal
 * View and edit event information, view QR code, stats
 */

import React, { useState } from 'react';
import axios from 'axios';
import './EventDetailsModal.css';

const EventDetailsModal = ({ event, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [formData, setFormData] = useState({
    name: event.name || '',
    description: event.description || '',
    location: event.location || '',
    date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
    status: event.status || 'active'
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
        `${API_URL}/admin/events/${event._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Event updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating event:', error);
      alert(error.response?.data?.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Copy QR link
  const copyQRLink = () => {
    const link = `${window.location.origin}/register/${event.qrCode || event._id}`;
    navigator.clipboard.writeText(link);
    alert('Registration link copied to clipboard!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎉 Event Details</h2>
          <button className="close-btn" onClick={onClose}>
            ❌
          </button>
        </div>

        <div className="modal-body">
          {/* Event Info */}
          <div className="event-info-section">
            {isEditing ? (
              <>
                <div className="form-group">
                  <label>Event Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter event name"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter event description"
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Enter location"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="info-item">
                  <span className="info-label">Event Name:</span>
                  <span className="info-value">{event.name}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Description:</span>
                  <span className="info-value">{event.description || 'No description'}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Location:</span>
                  <span className="info-value">📍 {event.location}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Date:</span>
                  <span className="info-value">📅 {formatDate(event.date)}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">Organizer:</span>
                  <span className="info-value">
                    <div className="organizer-badge">
                      <div className="organizer-avatar-small">
                        {event.organizer?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {event.organizer?.name || 'Unknown'}
                    </div>
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge status-${event.status}`}>
                    {event.status || 'Active'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Statistics */}
          <div className="event-stats-section">
            <h3>📊 Statistics</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-icon">👥</span>
                <div className="stat-info">
                  <span className="stat-number">{event.registrationCount || 0}</span>
                  <span className="stat-label">Registrations</span>
                </div>
              </div>

              <div className="stat-box">
                <span className="stat-icon">📸</span>
                <div className="stat-info">
                  <span className="stat-number">{event.photoCount || 0}</span>
                  <span className="stat-label">Photos</span>
                </div>
              </div>

              <div className="stat-box">
                <span className="stat-icon">💾</span>
                <div className="stat-info">
                  <span className="stat-number">
                    {((event.storageUsed || 0) / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="stat-label">Storage</span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {!isEditing && (
            <div className="qr-section">
              <h3>📱 Registration QR Code</h3>
              <div className="qr-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowQR(!showQR)}
                >
                  {showQR ? '🙈 Hide QR' : '👁️ Show QR'}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={copyQRLink}
                >
                  📋 Copy Link
                </button>
              </div>

              {showQR && event.qrCode && (
                <div className="qr-display">
                  <img 
                    src={`${API_URL}/events/${event._id}/qr`}
                    alt="Event QR Code"
                    className="qr-image"
                  />
                  <p className="qr-hint">Guests can scan this to register</p>
                </div>
              )}
            </div>
          )}
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
                    name: event.name || '',
                    description: event.description || '',
                    location: event.location || '',
                    date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
                    status: event.status || 'active'
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
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Event
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
