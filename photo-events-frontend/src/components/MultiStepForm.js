/* eslint-disable no-unused-vars */
import React, { useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QRScanner from './QRScanner';
import FaceCapture from './FaceCapture';
import UserForm from './UserForm';

const MultiStepForm = () => {
  const { eventId } = useParams();
  const [currentStep, setCurrentStep] = useState(eventId ? 2 : 1); // Skip QR if eventId exists
  const [formData, setFormData] = useState({
    eventId: eventId || '',
    capturedImage: null,
    name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const totalSteps = 4;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data) => {
    setFormData({ ...formData, ...data });
  };

  const renderStepIndicator = () => {
    return (
      <div className="step-indicator">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`step-dot ${
              step === currentStep ? 'active' : step < currentStep ? 'completed' : ''
            }`}
          ></div>
        ))}
      </div>
    );
  };

  const renderProgressBar = () => {
    const progress = (currentStep / totalSteps) * 100;
    return (
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <QRScanner 
            onScanSuccess={(result) => {
              updateFormData({ eventId: result });
              nextStep();
            }}
          />
        );
      
      case 2:
        return (
          <FaceCapture 
            onCapture={(imageData) => {
              updateFormData({ capturedImage: imageData });
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      
      case 3:
        return (
          <UserForm 
            formData={formData}
            errors={errors}
            onUpdate={updateFormData}
            onSubmit={() => {
              // Validate form here
              const newErrors = {};
              if (!formData.name.trim()) newErrors.name = 'Name is required';
              if (!formData.email.trim()) newErrors.email = 'Email is required';
              if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
              
              if (Object.keys(newErrors).length === 0) {
                // Form is valid, proceed
                console.log('Registration Data:', formData);
                nextStep();
              } else {
                setErrors(newErrors);
              }
            }}
            onBack={prevStep}
          />
        );
      
      case 4:
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '60px', 
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #2AC4A0 0%, #20A085 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ✓
            </div>
            <h2 style={{ marginBottom: '20px', color: '#1E2A38' }}>
              Registration Complete!
            </h2>
            <p style={{ marginBottom: '30px', color: '#8A8A8A' }}>
              You'll receive your event photos within 24-48 hours after the event ends.
            </p>
            <button 
              className="btn-primary" 
              onClick={() => {
                setCurrentStep(1);
                setFormData({
                  eventId: '',
                  capturedImage: null,
                  name: '',
                  email: '',
                  phone: ''
                });
                setErrors({});
              }}
            >
              Register Another Person
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container">
<div style={{ 
  position: 'absolute', 
  top: '20px', 
  right: '20px' 
}}>
  <button 
    onClick={() => window.location.href = '/dashboard'}
    style={{
      background: 'rgba(222, 161, 147, 0.9)',
      color: 'white',
      border: 'none',
      padding: '8px 15px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}
  >
    📊 Dashboard
  </button>
</div>

      <div className="card">
        {renderStepIndicator()}
        {renderProgressBar()}
        {renderStepContent()}
      </div>
    </div>
  );
};

export default MultiStepForm;
