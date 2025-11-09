import React, { useState } from 'react';
import { eventAPI } from '../../services/api';
import './CreateEvent.css';

const CreateEvent = ({ onEventCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    expectedGuests: '',
    organizerEmail: ''
  });

  const [errors, setErrors] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEvent, setCreatedEvent] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Event name must be at least 3 characters';
    }

    if (!formData.date) {
      newErrors.date = 'Event date is required';
    } else if (new Date(formData.date) < new Date().setHours(0, 0, 0, 0)) {
      newErrors.date = 'Event date cannot be in the past';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.expectedGuests || formData.expectedGuests < 1) {
      newErrors.expectedGuests = 'Expected guests must be at least 1';
    } else if (formData.expectedGuests > 10000) {
      newErrors.expectedGuests = 'Maximum 10,000 guests allowed';
    }

    if (!formData.organizerEmail.trim()) {
      newErrors.organizerEmail = 'Organizer email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.organizerEmail)) {
      newErrors.organizerEmail = 'Please enter a valid email address';
    }

    return newErrors;
  };

  // ✅ FIX: Changed to regular function, not form submission
  const handleNextStep = (e) => {
    if (e) e.preventDefault(); // Prevent form submission
    
    const newErrors = validateStep1();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCurrentStep(2);
    setErrors({});
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateStep2();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsCreating(true);

    try {
      console.log('📤 Creating event:', formData);
      
      const response = await eventAPI.create(formData);
      
      console.log('✅ Event created:', response.data);
      
      // Handle both response formats
      const eventData = response.data.data || response.data.event || response.data;
      
      setCreatedEvent(eventData);
      setShowSuccess(true);
      
      // Call parent callback
      if (onEventCreated) {
        onEventCreated(eventData);
      }
      
    } catch (error) {
      console.error('❌ Create event error:', error);
      setErrors({ 
        submit: error.response?.data?.message || error.message || 'Failed to create event. Please try again.' 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      description: '',
      expectedGuests: '',
      organizerEmail: ''
    });
    setErrors({});
    setCurrentStep(1);
    setShowSuccess(false);
    setCreatedEvent(null);
  };

  const copyRegistrationLink = () => {
    if (!createdEvent || !createdEvent.qrCode) return;
    
    const link = `${window.location.origin}/register/${createdEvent.qrCode}`;
    navigator.clipboard.writeText(link);
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = '✅ Registration link copied!';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  };

  // Success View
  if (showSuccess && createdEvent) {
    return (
      <div className="create-event-container">
        <div className="success-view">
          <div className="success-animation">🎉</div>
          
          <div className="success-content">
            <h2>Event Created Successfully!</h2>
            <p>Your event is ready for guest registrations</p>
          </div>

          <div className="event-summary-card">
            <div className="summary-header">
              <h3>{createdEvent.name}</h3>
              <div className="event-status">
                <span className="status-dot"></span>
                <span>Ready for Registration</span>
              </div>
            </div>
            
            <div className="summary-details">
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date(createdEvent.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              {createdEvent.expectedGuests && (
                <div className="detail-row">
                  <span className="detail-label">Expected Guests:</span>
                  <span className="detail-value">{createdEvent.expectedGuests}</span>
                </div>
              )}
              
              {createdEvent.qrCode && (
                <div className="detail-row">
                  <span className="detail-label">Event ID:</span>
                  <span className="detail-value event-id">{createdEvent.qrCode}</span>
                </div>
              )}
            </div>

            {createdEvent.qrCode && (
              <div className="registration-link-section">
                <h4>Registration Link</h4>
                <div className="link-container">
                  <input 
                    type="text" 
                    value={`${window.location.origin}/register/${createdEvent.qrCode}`}
                    readOnly
                    className="link-input"
                  />
                  <button 
                    onClick={copyRegistrationLink}
                    className="copy-link-btn"
                  >
                    📋 Copy
                  </button>
                </div>
                <p className="link-help">Share this link with guests to register for the event</p>
              </div>
            )}
          </div>

          <div className="success-actions">
            <button 
              onClick={resetForm}
              className="btn btn-secondary"
            >
              Create Another Event
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="btn btn-primary"
            >
              View All Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Form View
  return (
    <div className="create-event-container">
      {/* Progress Indicator */}
      <div className="form-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(currentStep / 2) * 100}%` }}
          ></div>
        </div>
        
        <div className="progress-steps">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-circle">
              <span className="step-number">1</span>
            </div>
            <span className="step-label">Event Details</span>
          </div>
          
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-circle">
              <span className="step-number">2</span>
            </div>
            <span className="step-label">Configuration</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="form-content">
        <div className="form-header">
          <h2>
            {currentStep === 1 ? 'Create New Event' : 'Event Configuration'}
          </h2>
          <p>
            {currentStep === 1 
              ? 'Set up your event details for automated photo delivery'
              : 'Configure guest capacity and organizer settings'
            }
          </p>
        </div>

        {/* ✅ FIX: Only Step 2 has form submission */}
        <form onSubmit={currentStep === 2 ? handleSubmit : (e) => e.preventDefault()} className="event-form">
          {/* Step 1: Event Details */}
          {currentStep === 1 && (
            <div className="form-step">
              <div className="form-group">
                <label className="form-label">
                  Event Name *
                  <span className="label-help">Choose a memorable name for your event</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g., Sarah & John's Wedding"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  maxLength={100}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
                <div className="character-count">
                  {formData.name.length}/100 characters
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Event Date *
                  <span className="label-help">When is your event taking place?</span>
                </label>
                <input
                  type="date"
                  className={`form-input ${errors.date ? 'error' : ''}`}
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Event Description *
                  <span className="label-help">Describe your event for guests</span>
                </label>
                <textarea
                  className={`form-textarea ${errors.description ? 'error' : ''}`}
                  placeholder="Tell guests about your special event..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                {errors.description && <span className="form-error">{errors.description}</span>}
                <div className="character-count">
                  {formData.description.length}/500 characters
                </div>
              </div>

              {/* ✅ FIX: Button with type="button" */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn btn-primary"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {currentStep === 2 && (
            <div className="form-step">
              <div className="form-group">
                <label className="form-label">
                  Expected Guests *
                  <span className="label-help">Approximately how many people will attend?</span>
                </label>
                <input
                  type="number"
                  className={`form-input ${errors.expectedGuests ? 'error' : ''}`}
                  placeholder="e.g., 150"
                  value={formData.expectedGuests}
                  onChange={(e) => handleInputChange('expectedGuests', parseInt(e.target.value) || '')}
                  min="1"
                  max="10000"
                />
                {errors.expectedGuests && <span className="form-error">{errors.expectedGuests}</span>}
                <div className="form-help">
                  This helps us optimize photo processing for your event size
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Organizer Email *
                  <span className="label-help">We'll send event updates and analytics here</span>
                </label>
                <input
                  type="email"
                  className={`form-input ${errors.organizerEmail ? 'error' : ''}`}
                  placeholder="organizer@example.com"
                  value={formData.organizerEmail}
                  onChange={(e) => handleInputChange('organizerEmail', e.target.value)}
                />
                {errors.organizerEmail && <span className="form-error">{errors.organizerEmail}</span>}
              </div>

              <div className="form-info-card">
                <h4>📊 What happens after creation?</h4>
                <ul>
                  <li>✅ Unique registration link generated</li>
                  <li>✅ QR code created for easy sharing</li>
                  <li>✅ Event dashboard becomes available</li>
                  <li>✅ Ready to receive guest registrations</li>
                </ul>
              </div>

              {errors.submit && (
                <div className="form-error-banner">
                  <span className="error-icon">⚠️</span>
                  <span>{errors.submit}</span>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="btn btn-secondary"
                >
                  ← Back
                </button>
                
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn btn-primary"
                >
                  {isCreating ? (
                    <>
                      <span className="loading-spinner"></span>
                      Creating Event...
                    </>
                  ) : (
                    '🎉 Create Event'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Preview Card */}
      {currentStep === 1 && formData.name && formData.date && (
        <div className="event-preview">
          <h4>Preview</h4>
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-date">
                {new Date(formData.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              <div className="preview-status">Draft</div>
            </div>
            <h5>{formData.name}</h5>
            {formData.description && (
              <p>{formData.description.substring(0, 80)}{formData.description.length > 80 ? '...' : ''}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEvent;
