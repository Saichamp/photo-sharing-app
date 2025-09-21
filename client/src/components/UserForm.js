import React from 'react';

const UserForm = ({ formData, errors, onUpdate, onSubmit, onBack }) => {
  const handleInputChange = (field, value) => {
    onUpdate({ [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[\d\s\-\\(\\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Phone validation
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit();
    } else {
      // Update errors in parent component
      onUpdate({ errors: newErrors });
    }
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1E2A38' }}>
        Your Details
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '30px', color: '#8A8A8A' }}>
        We'll send your photos to these details
      </p>

      <form onSubmit={handleSubmit}>
        {/* Name Field */}
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input 
            type="text" 
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter your full name"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            style={{
              borderColor: errors.name ? '#FF6F61' : undefined
            }}
          />
          {errors.name && (
            <span style={{ 
              color: '#FF6F61', 
              fontSize: '12px', 
              marginTop: '5px',
              display: 'block'
            }}>
              {errors.name}
            </span>
          )}
        </div>

        {/* Email Field */}
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input 
            type="email" 
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="Enter your email address"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            style={{
              borderColor: errors.email ? '#FF6F61' : undefined
            }}
          />
          {errors.email && (
            <span style={{ 
              color: '#FF6F61', 
              fontSize: '12px', 
              marginTop: '5px',
              display: 'block'
            }}>
              {errors.email}
            </span>
          )}
        </div>

        {/* Phone Field */}
        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input 
            type="tel" 
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="Enter your phone number"
            value={formData.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            style={{
              borderColor: errors.phone ? '#FF6F61' : undefined
            }}
          />
          {errors.phone && (
            <span style={{ 
              color: '#FF6F61', 
              fontSize: '12px', 
              marginTop: '5px',
              display: 'block'
            }}>
              {errors.phone}
            </span>
          )}
        </div>

        {/* Privacy Notice */}
        <div style={{
          background: 'rgba(222, 161, 147, 0.1)',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '12px',
          color: '#8A8A8A',
          lineHeight: '1.4'
        }}>
          🔒 Your data is secure. We only use it to send you event photos and will not share it with third parties.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button"
            className="btn-secondary" 
            onClick={onBack}
          >
            Back
          </button>
          <button 
            type="submit"
            className="btn-primary" 
            style={{ flex: 1 }}
          >
            Complete Registration
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
