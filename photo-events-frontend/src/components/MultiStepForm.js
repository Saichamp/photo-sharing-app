/* eslint-disable no-unused-vars */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRScanner from './QRScanner';
import FaceCapture from './FaceCapture';
import UserForm from './UserForm';
import { registrationAPI, eventAPI } from '../services/api';
import './MultiStepForm.css';

  
 

  // Rest of your component...


const MultiStepForm = () => {
  
  const { eventId } = useParams(); // Get eventId from URL
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [eventInfo, setEventInfo] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
   // DEBUG: Log everything about the URL
  console.log('🔍 CURRENT URL:', window.location.href);
  console.log('🔍 URL PATHNAME:', window.location.pathname);
  console.log('🔍 useParams eventId:', eventId);
  console.log('🔍 useParams all params:', useParams());
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
// Submit registration to backend
const submitRegistration = async () => {
  setIsLoading(true);
  try {
    console.log('🔍 DEBUG: eventId from URL:', eventId);
    console.log('🔍 DEBUG: formData.eventId:', formData.eventId);
    
    // Use eventId from URL params, not from formData
    const registrationData = {
      eventId: eventId,  // Use the eventId from URL params directly
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      faceImageUrl: formData.capturedImage || 'placeholder-face-image.jpg'
    };

    console.log('📤 Submitting registration with data:', registrationData);
    
    const response = await registrationAPI.create(registrationData);
    
    console.log('✅ Registration successful:', response.data);
    
    // Move to success step
    setCurrentStep(4);
    
  } catch (error) {
    console.error('❌ Registration failed:', error);
    
    // Handle specific error messages
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
      // Submit to backend instead of just moving to step 4
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
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <h2>Loading Event...</h2>
            <p style={{ color: '#8A8A8A' }}>Please wait while we load the event details.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if event not found
  if (!eventInfo && eventId) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <h2 style={{ color: '#FF6F61' }}>Event Not Found</h2>
            <p style={{ color: '#8A8A8A', marginBottom: '30px' }}>
              The event QR code is invalid or the event may have been removed.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="btn-primary"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step">
            <h2>📝 Registration Details</h2>
            {eventInfo && (
              <div style={{
                background: 'linear-gradient(135deg, #DEA193 0%, #C8907F 100%)',
                color: 'white',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '25px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 5px 0' }}>📅 {eventInfo.name}</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>
                  {new Date(eventInfo.date).toLocaleDateString()} • Expected: {eventInfo.expectedGuests} guests
                </p>
              </div>
            )}
            <p>Please provide your details to register for this photo event.</p>
            
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step">
            <h2>📸 Face Capture</h2>
            <p>We'll use your photo to find and send you pictures from the event.</p>
            
            {!formData.capturedImage ? (
              <div className="camera-container">
                <video ref={videoRef} autoPlay muted className="camera-preview" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div className="camera-controls">
                  {!stream ? (
                    <button onClick={startCamera} className="btn-primary">
                      📷 Start Camera
                    </button>
                  ) : (
                    <button onClick={capturePhoto} className="btn-primary">
                      📸 Capture Photo
                    </button>
                  )}
                </div>
                
                {errors.camera && <div className="error-text">{errors.camera}</div>}
                
                <div className="demo-option">
                  <p style={{color: '#8A8A8A', fontSize: '14px'}}>For demo purposes:</p>
                  <button 
                    onClick={() => setFormData({...formData, capturedImage: 'demo-image.jpg'})}
                    className="btn-secondary"
                  >
                    Skip Camera (Demo)
                  </button>
                </div>
              </div>
            ) : (
              <div className="photo-preview">
                <h3>✅ Photo Captured Successfully!</h3>
                {formData.capturedImage !== 'demo-image.jpg' && (
                  <img src={formData.capturedImage} alt="Captured" className="captured-image" />
                )}
                <div className="photo-actions">
                  <button onClick={retakePhoto} className="btn-secondary">
                    🔄 Retake Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step">
            <h2>✅ Review & Confirm</h2>
            <p>Please review your information before submitting.</p>
            
            <div className="review-info">
              {eventInfo && (
                <div className="review-item">
                  <strong>Event:</strong> {eventInfo.name}
                </div>
              )}
              <div className="review-item">
                <strong>Name:</strong> {formData.name}
              </div>
              <div className="review-item">
                <strong>Email:</strong> {formData.email}
              </div>
              <div className="review-item">
                <strong>Phone:</strong> {formData.phone}
              </div>
              <div className="review-item">
                <strong>Photo:</strong> {formData.capturedImage ? '✅ Captured' : '❌ Not captured'}
              </div>
            </div>
            
            <div className="info-box">
              <h4>📧 What happens next?</h4>
              <ul>
                <li>Your registration will be saved securely</li>
                <li>When photos are uploaded, we'll find yours using face recognition</li>
                <li>You'll receive your photos via email automatically</li>
                <li>No spam - only your event photos!</li>
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step">
            <div className="success-animation">🎉</div>
            <h2>🎊 Registration Successful!</h2>
            <p>Welcome to the photo sharing experience!</p>
            
            <div className="success-info">
              {eventInfo && (
                <>
                  <h3>📅 {eventInfo.name}</h3>
                  <p><strong>Date:</strong> {new Date(eventInfo.date).toLocaleDateString()}</p>
                </>
              )}
              <p><strong>Registered as:</strong> {formData.name}</p>
              <p><strong>Email:</strong> {formData.email}</p>
            </div>
            
            <div className="next-steps">
              <h4>📱 What's Next?</h4>
              <div className="step-item">
                <span className="step-number">1</span>
                <div>
                  <strong>Enjoy the event!</strong>
                  <p>Have fun and smile for the camera</p>
                </div>
              </div>
              <div className="step-item">
                <span className="step-number">2</span>
                <div>
                  <strong>Photos will be processed</strong>
                  <p>Our AI will find your photos automatically</p>
                </div>
              </div>
              <div className="step-item">
                <span className="step-number">3</span>
                <div>
                  <strong>Receive your photos</strong>
                  <p>We'll email them to: {formData.email}</p>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                onClick={() => window.location.href = '/'}
                className="btn-primary"
              >
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

      {/* Progress section */}
      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress" style={{width: `${(currentStep / 4) * 100}%`}}></div>
        </div>
        
        <div className="step-indicator">
          Step {currentStep} of 4
        </div>
        
        {/* NEW: Add step dots */}
        <div className="step-dots">
          {[1, 2, 3, 4].map(step => (
            <div 
              key={step}
              className={`dot ${step <= currentStep ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Render step content */}
      {renderStep()}

      {/* Add navigation button inside the component's return */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button 
          onClick={nextStep}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading && <span className="loading"></span>}
          {isLoading ? 'Submitting...' : currentStep === 3 ? 'Submit Registration' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

export default MultiStepForm;

