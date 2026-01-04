import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventAPI } from '../../services/api';
import './CreateEvent.css';

const CreateEvent = ({ onEventCreated }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    expectedGuests: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Event name must be at least 3 characters';
    }
    
    if (!formData.date) {
      newErrors.date = 'Event date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Event date cannot be in the past';
      }
    }
    
    if (!formData.location || formData.location.trim().length < 3) {
      newErrors.location = 'Location must be at least 3 characters';
    }
    
    if (!formData.expectedGuests) {
      newErrors.expectedGuests = 'Expected guests is required';
    } else if (parseInt(formData.expectedGuests) < 1) {
      newErrors.expectedGuests = 'Must have at least 1 guest';
    } else if (parseInt(formData.expectedGuests) > 10000) {
      newErrors.expectedGuests = 'Maximum 10,000 guests allowed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.input-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);
    
    try {
      // ✅ USE YOUR OLD WORKING FORMAT
      await eventAPI.create({
        ...formData,
        expectedGuests: parseInt(formData.expectedGuests),
        organizerEmail: user?.email
      });
      
      // Call callback if provided
      if (onEventCreated) {
        onEventCreated();
      }
      
      // Navigate to dashboard immediately
      navigate('/dashboard');
      
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create event';
      setErrors({ submit: message });
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasData = Object.values(formData).some(val => 
      typeof val === 'string' && val.trim() !== ''
    );
    
    if (hasData) {
      if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="create-event-page">
      <div className="create-event-container">
        {/* Back Button */}
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <span className="back-arrow">←</span>
          <span>Back to Events</span>
        </button>

        {/* Main Card */}
        <div className="create-event-card">
          {/* Header */}
          <div className="card-header">
            <div className="header-icon">📝</div>
            <h1 className="card-title">Create New Event</h1>
            <p className="card-subtitle">
              Fill in the details below to create your event and start collecting memories
            </p>
          </div>

          {/* Error Alert */}
          {errors.submit && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{errors.submit}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="event-form">
            {/* Section: Event Information */}
            <div className="form-section">
              <h2 className="section-title">Event Information</h2>
              <div className="section-divider"></div>

              {/* Event Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Event Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Sarah's Birthday Party"
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                  maxLength={100}
                  disabled={loading}
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              {/* Event Date */}
              <div className="form-group">
                <label htmlFor="date" className="form-label">
                  <span className="label-icon">📅</span>
                  Event Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`form-input ${errors.date ? 'input-error' : ''}`}
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.date && (
                  <span className="error-message">{errors.date}</span>
                )}
              </div>

              {/* Location */}
              <div className="form-group">
                <label htmlFor="location" className="form-label">
                  <span className="label-icon">📍</span>
                  Location <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Grand Ballroom, Downtown"
                  className={`form-input ${errors.location ? 'input-error' : ''}`}
                  maxLength={200}
                  disabled={loading}
                />
                {errors.location && (
                  <span className="error-message">{errors.location}</span>
                )}
              </div>

              {/* Expected Guests */}
              <div className="form-group">
                <label htmlFor="expectedGuests" className="form-label">
                  <span className="label-icon">👥</span>
                  Expected Guests <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="expectedGuests"
                  name="expectedGuests"
                  value={formData.expectedGuests}
                  onChange={handleChange}
                  placeholder="e.g., 50"
                  className={`form-input ${errors.expectedGuests ? 'input-error' : ''}`}
                  min="1"
                  max="10000"
                  disabled={loading}
                />
                {errors.expectedGuests && (
                  <span className="error-message">{errors.expectedGuests}</span>
                )}
              </div>
            </div>

            {/* Section: Additional Details */}
            <div className="form-section">
              <h2 className="section-title">Additional Details</h2>
              <div className="section-divider"></div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  <span className="label-icon">📝</span>
                  Description <span className="optional">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add any additional details about your event..."
                  className="form-textarea"
                  rows="4"
                  maxLength={500}
                  disabled={loading}
                />
                <div className="character-count">
                  {formData.description.length}/500 characters
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="info-box">
              <span className="info-icon">💡</span>
              <div className="info-content">
                <strong>What happens next?</strong>
                <p>Your event QR code will be generated automatically. Share it with guests for easy registration and photo collection!</p>
              </div>
            </div>

            {/* Organizer Info */}
            {user && (
              <div className="organizer-info">
                <span className="organizer-label">Organizer:</span>
                <span className="organizer-email">{user.name || user.email}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-cancel"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Creating Event...</span>
                  </>
                ) : (
                  <>
                    <span>Create Event</span>
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Tips */}
        <div className="bottom-tips">
          <div className="tip-item">
            <span className="tip-icon">✨</span>
            <span className="tip-text">AI-powered face recognition included</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🔒</span>
            <span className="tip-text">Your data is secure and private</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">⚡</span>
            <span className="tip-text">Instant photo delivery to guests</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
