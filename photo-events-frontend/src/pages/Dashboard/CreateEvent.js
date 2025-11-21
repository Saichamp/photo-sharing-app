import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // ← ADD THIS
import { eventAPI } from '../../services/api';
import './CreateEvent.css';

const CreateEvent = ({ onEventCreated }) => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ← ADD THIS to get logged-in user
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    expectedGuests: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    } else if (new Date(formData.date) < new Date()) {
      newErrors.date = 'Event date must be in the future';
    }

    if (!formData.location || formData.location.trim().length < 3) {
      newErrors.location = 'Location must be at least 3 characters';
    }

    if (!formData.expectedGuests || parseInt(formData.expectedGuests) < 1) {
      newErrors.expectedGuests = 'Expected guests must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);
  try {
    // Create event - no need to store response if not used
    await eventAPI.create({
      ...formData,
      expectedGuests: parseInt(formData.expectedGuests),
      organizerEmail: user?.email
    });

    setSuccess(true);
    
    // Call callback if provided
    if (onEventCreated) {
      onEventCreated();
    }

    // Show success message for 2 seconds, then navigate
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);

  } catch (err) {
    const message = err.response?.data?.message || 'Failed to create event';
    setErrors({ submit: message });
  } finally {
    setLoading(false);
  }
};

  if (success) {
    return (
      <div className="success-state">
        <div className="success-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h2>Event Created Successfully! 🎉</h2>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h2>Create New Event</h2>
        <p>Set up your event and start collecting photos with AI</p>
      </div>

      <form onSubmit={handleSubmit} className="create-event-form">
        {errors.submit && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
            {errors.submit}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Event Name *
            </label>
            <input
              type="text"
              name="name"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Sarah & Mike's Wedding"
              value={formData.name}
              onChange={handleChange}
              maxLength={100}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Event Date *
            </label>
            <input
              type="date"
              name="date"
              className={`form-input ${errors.date ? 'error' : ''}`}
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Location *
            </label>
            <input
              type="text"
              name="location"
              className={`form-input ${errors.location ? 'error' : ''}`}
              placeholder="Grand Hotel, New York"
              value={formData.location}
              onChange={handleChange}
              maxLength={200}
            />
            {errors.location && <span className="form-error">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Expected Guests *
            </label>
            <input
              type="number"
              name="expectedGuests"
              className={`form-input ${errors.expectedGuests ? 'error' : ''}`}
              placeholder="150"
              value={formData.expectedGuests}
              onChange={handleChange}
              min="1"
              max="10000"
            />
            {errors.expectedGuests && <span className="form-error">{errors.expectedGuests}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Description (Optional)
          </label>
          <textarea
            name="description"
            className="form-textarea"
            placeholder="Tell us more about your event..."
            value={formData.description}
            onChange={handleChange}
            rows={4}
            maxLength={500}
          />
          <span className="form-hint">
            {formData.description.length}/500 characters
          </span>
        </div>

        {/* Display organizer email (read-only info) */}
        <div className="info-box">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
          </svg>
          <div>
            <strong>Organizer:</strong> {user?.name} ({user?.email})
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/dashboard')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-pink"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} />
                Creating...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                Create Event
              </>
            )}
          </button>
        </div>
      </form>

      <div className="feature-preview">
        <h3>What happens next?</h3>
        <div className="feature-steps">
          <div className="feature-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Get QR Code</h4>
              <p>Share unique QR code with guests for registration</p>
            </div>
          </div>
          <div className="feature-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Upload Photos</h4>
              <p>Upload event photos for AI processing</p>
            </div>
          </div>
          <div className="feature-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>AI Matching</h4>
              <p>Guests automatically receive their photos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
