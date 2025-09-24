import React, { useState } from 'react';
import { eventAPI } from '../../services/api';

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

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Event date is required';
    } else if (new Date(formData.date) < new Date()) {
      newErrors.date = 'Event date cannot be in the past';
    }
    
    if (!formData.expectedGuests || formData.expectedGuests < 1) {
      newErrors.expectedGuests = 'Expected guests must be at least 1';
    }
    
    if (!formData.organizerEmail.trim()) {
      newErrors.organizerEmail = 'Organizer email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.organizerEmail)) {
      newErrors.organizerEmail = 'Please enter a valid email';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await eventAPI.create(formData);
      
      // Call parent callback with new event
      onEventCreated(response.data.event);
      
      // Reset form
      setFormData({
        name: '',
        date: '',
        description: '',
        expectedGuests: '',
        organizerEmail: ''
      });
      setErrors({});
      
      alert('Event created successfully! QR code: ' + response.data.event.qrCode);
      
    } catch (error) {
      console.error('Create event error:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Rest of your component JSX stays the same, just add organizerEmail field:
  return (
    <div>
      <h2 style={{ color: '#1E2A38', marginBottom: '25px' }}>Create New Event</h2>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        {/* Event Name - same as before */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#1E2A38',
            fontWeight: '600'
          }}>
            Event Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Wedding - John & Jane"
            style={{
              width: '100%',
              padding: '12px 15px',
              border: `2px solid ${errors.name ? '#FF6F61' : '#e0e0e0'}`,
              borderRadius: '10px',
              fontSize: '16px'
            }}
          />
          {errors.name && (
            <span style={{ color: '#FF6F61', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              {errors.name}
            </span>
          )}
        </div>

        {/* Event Date - same as before */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#1E2A38',
            fontWeight: '600'
          }}>
            Event Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              padding: '12px 15px',
              border: `2px solid ${errors.date ? '#FF6F61' : '#e0e0e0'}`,
              borderRadius: '10px',
              fontSize: '16px'
            }}
          />
          {errors.date && (
            <span style={{ color: '#FF6F61', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              {errors.date}
            </span>
          )}
        </div>

        {/* Expected Guests - same as before */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#1E2A38',
            fontWeight: '600'
          }}>
            Expected Guests *
          </label>
          <input
            type="number"
            value={formData.expectedGuests}
            onChange={(e) => handleInputChange('expectedGuests', e.target.value)}
            placeholder="e.g., 50"
            min="1"
            style={{
              width: '100%',
              padding: '12px 15px',
              border: `2px solid ${errors.expectedGuests ? '#FF6F61' : '#e0e0e0'}`,
              borderRadius: '10px',
              fontSize: '16px'
            }}
          />
          {errors.expectedGuests && (
            <span style={{ color: '#FF6F61', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              {errors.expectedGuests}
            </span>
          )}
        </div>

        {/* NEW: Organizer Email Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#1E2A38',
            fontWeight: '600'
          }}>
            Organizer Email *
          </label>
          <input
            type="email"
            value={formData.organizerEmail}
            onChange={(e) => handleInputChange('organizerEmail', e.target.value)}
            placeholder="your.email@example.com"
            style={{
              width: '100%',
              padding: '12px 15px',
              border: `2px solid ${errors.organizerEmail ? '#FF6F61' : '#e0e0e0'}`,
              borderRadius: '10px',
              fontSize: '16px'
            }}
          />
          {errors.organizerEmail && (
            <span style={{ color: '#FF6F61', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              {errors.organizerEmail}
            </span>
          )}
        </div>

        {/* Description - same as before */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#1E2A38',
            fontWeight: '600'
          }}>
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of the event..."
            rows="4"
            style={{
              width: '100%',
              padding: '12px 15px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '16px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Submit Button - same as before */}
        <button
          type="submit"
          disabled={isCreating}
          style={{
            width: '100%',
            padding: '15px 30px',
            background: isCreating 
              ? '#e0e0e0' 
              : 'linear-gradient(135deg, #DEA193 0%, #C8907F 100%)',
            color: isCreating ? '#8A8A8A' : 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isCreating ? 'not-allowed' : 'pointer'
          }}
        >
          {isCreating ? 'Creating Event...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
