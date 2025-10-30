/* eslint-disable no-unused-vars */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationAPI, eventAPI } from '../services/api';
import './MultiStepForm.css';

const MultiStepForm = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [eventInfo, setEventInfo] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const [formData, setFormData] = useState({
    eventId: '',
    name: '',
    email: '',
    phone: '',
    capturedImage: null,
    faceImageUrl: ''
  });

  const [errors, setErrors] = useState({});

  // Load event info when component mounts
  useEffect(() => {
    const loadEventInfo = async () => {
      if (!eventId) {
        setLoadingEvent(false);
        return;
      }

      try {
        setLoadingEvent(true);
        const response = await eventAPI.getByQRCode(eventId);
        setEventInfo(response.data);
        setFormData(prev => ({ ...prev, eventId: eventId }));
      } catch (error) {
        console.error('Failed to load event:', error);
        setEventInfo(null);
      } finally {
        setLoadingEvent(false);
      }
    };

    loadEventInfo();
  }, [eventId]);

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Invalid phone number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (!formData.capturedImage) {
      setErrors({ camera: 'Please capture your photo to continue' });
      return false;
    }
    setErrors({});
    return true;
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Camera access error:', error);
      setErrors({ camera: 'Camera access denied. Please allow camera access and refresh.' });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        setFormData({ ...formData, capturedImage: imageUrl, faceImageBlob: blob });
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const retakePhoto = () => {
    setFormData({ ...formData, capturedImage: null, faceImageBlob: null });
    startCamera();
  };

  // Submit registration to backend
  const submitRegistration = async () => {
    setIsLoading(true);
    try {
      const registrationData = {
        eventId: eventId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        faceImageUrl: formData.capturedImage || 'placeholder-face-image.jpg'
      };

      const response = await registrationAPI.create(registrationData);
      setCurrentStep(4);
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      if (error.response?.data?.error) {
        alert('Registration failed: ' + error.response.data.error);
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      submitRegistration();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Show loading screen while loading event
  if (loadingEvent) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading Event...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if event not found
  if (!eventInfo && eventId) {
    return (
      <div className="registration-container">
        <div className="registration-card">
          <div className="error-container">
            <h2 className="error-title">Event Not Found</h2>
            <p className="error-message">
              The event QR code is invalid or the event may have been removed.
            </p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2 className="step-title">Personal Details</h2>
            <p className="step-subtitle">
              Please provide your information to register for this event
            </p>

            {eventInfo && (
              <div className="event-banner">
                <h3 className="event-name">{eventInfo.name}</h3>
                <p className="event-details">
                  {new Date(eventInfo.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} • {eventInfo.expectedGuests} expected guests
                </p>
              </div>
            )}

            <div className="form-field">
              <label className="field-label">Full Name *</label>
              <input
                type="text"
                className={`field-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-field">
              <label className="field-label">Email Address *</label>
              <input
                type="email"
                className={`field-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label className="field-label">Phone Number *</label>
              <input
                type="tel"
                className={`field-input ${errors.phone ? 'error' : ''}`}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2 className="step-title">Face Recognition</h2>
            <p className="step-subtitle">
              We'll use your photo to automatically find and send you pictures from the event
            </p>

            {!formData.capturedImage ? (
              <div className="camera-section">
                <video ref={videoRef} autoPlay muted className="camera-preview" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div className="camera-controls">
                  {!stream ? (
                    <button onClick={startCamera} className="btn btn-primary">
                      📷 Start Camera
                    </button>
                  ) : (
                    <button onClick={capturePhoto} className="btn btn-primary">
                      📸 Capture Photo
                    </button>
                  )}
                </div>
                
                {errors.camera && <div className="field-error">{errors.camera}</div>}
                
                <div className="demo-section">
                  <p className="demo-text">For demo purposes:</p>
                  <button 
                    onClick={() => setFormData({...formData, capturedImage: 'demo-image.jpg'})}
                    className="btn btn-secondary"
                  >
                    Skip Camera (Demo Mode)
                  </button>
                </div>
              </div>
            ) : (
              <div className="photo-preview-section">
                <h3 className="preview-success">Photo Captured Successfully!</h3>
                {formData.capturedImage !== 'demo-image.jpg' && (
                  <img src={formData.capturedImage} alt="Captured" className="captured-photo" />
                )}
                <div>
                  <button onClick={retakePhoto} className="btn btn-secondary">
                    🔄 Retake Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2 className="step-title">Review & Confirm</h2>
            <p className="step-subtitle">
              Please review your information before submitting
            </p>
            
            <div className="review-section">
              {eventInfo && (
                <div className="review-row">
                  <span className="review-label">Event:</span>
                  <span className="review-value">{eventInfo.name}</span>
                </div>
              )}
              <div className="review-row">
                <span className="review-label">Name:</span>
                <span className="review-value">{formData.name}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Email:</span>
                <span className="review-value">{formData.email}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Phone:</span>
                <span className="review-value">{formData.phone}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Photo:</span>
                <span className="review-value">{formData.capturedImage ? '✅ Captured' : '❌ Not captured'}</span>
              </div>
            </div>
            
            <div className="info-panel">
              <h4 className="info-title">📧 What happens next?</h4>
              <ul className="info-list">
                <li className="info-item">Your registration will be saved securely</li>
                <li className="info-item">When photos are uploaded, we'll find yours using AI</li>
                <li className="info-item">You'll receive your photos via email automatically</li>
                <li className="info-item">No spam - only your event photos!</li>
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <div className="success-section">
              <div className="success-icon">🎉</div>
              <h2 className="success-title">Registration Successful!</h2>
              <p className="success-message">
                Welcome to the photo sharing experience!
              </p>
              
              <div className="success-details">
                {eventInfo && (
                  <>
                    <h3>{eventInfo.name}</h3>
                    <p><strong>Date:</strong> {new Date(eventInfo.date).toLocaleDateString()}</p>
                  </>
                )}
                <p><strong>Registered as:</strong> {formData.name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
              </div>
              
              <div className="next-steps">
                <h4 className="steps-title">What's Next?</h4>
                <div className="step-row">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <div className="step-action">Enjoy the event!</div>
                    <div className="step-description">Have fun and smile for the camera</div>
                  </div>
                </div>
                <div className="step-row">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <div className="step-action">Photos will be processed</div>
                    <div className="step-description">Our AI will find your photos automatically</div>
                  </div>
                </div>
                <div className="step-row">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <div className="step-action">Receive your photos</div>
                    <div className="step-description">We'll email them to: {formData.email}</div>
                  </div>
                </div>
              </div>

              <button onClick={() => navigate('/')} className="btn btn-primary">
                🏠 Return Home
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        {/* Header */}
        <div className="form-header">
          {currentStep > 1 && currentStep < 4 && (
            <button onClick={prevStep} className="back-btn">
              ←
            </button>
          )}
          <div></div>
          <a href="/dashboard" className="dashboard-link">
            📊 Dashboard
          </a>
        </div>

        {/* Progress */}
        <div className="progress-section">
          <div className="progress-header">
            <div className="step-counter">
              Step {currentStep} of 4
            </div>
          </div>
          
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${(currentStep / 4) * 100}%`}}></div>
          </div>
          
          <div className="step-dots">
            {[1, 2, 3, 4].map(step => (
              <div 
                key={step}
                className={`step-dot ${step <= currentStep ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="btn-navigation">
            <div></div>
            <button 
              onClick={nextStep}
              disabled={isLoading}
              className="btn btn-primary btn-nav"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" style={{width: '16px', height: '16px'}}></div>
                  Submitting...
                </>
              ) : currentStep === 3 ? 'Submit Registration' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiStepForm;
