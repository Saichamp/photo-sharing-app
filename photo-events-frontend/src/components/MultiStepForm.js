/* eslint-disable no-unused-vars */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationAPI, eventAPI } from '../services/api';
import './MultiStepForm.css';

const MultiStepForm = () => {
  const { eventId: eventIdFromUrl } = useParams(); // This is the QR code or URL param
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [eventInfo, setEventInfo] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const [formData, setFormData] = useState({
    eventId: '', // ✅ This will store the real MongoDB ObjectId
    name: '',
    email: '',
    phone: '',
    capturedImage: null,
    faceImageUrl: '',
    faceImageBlob: null
  });

  const [errors, setErrors] = useState({});

  // Load event info when component mounts
  useEffect(() => {
    const loadEventInfo = async () => {
      if (!eventIdFromUrl) {
        setLoadingEvent(false);
        return;
      }

      try {
        setLoadingEvent(true);
        // ✅ FIX: Use the QR/URL param to fetch event
        const response = await eventAPI.getByQRCode(eventIdFromUrl);
        const eventData = response.data?.data || response.data;
        
        setEventInfo(eventData);
        
        // ✅ CRITICAL FIX: Store the real MongoDB _id from the backend
        setFormData(prev => ({
          ...prev,
          eventId: eventData._id || eventData.id // Use the real ObjectId from DB
        }));
        
        console.log('✅ Event loaded successfully');
        console.log('   Event Name:', eventData.name);
        console.log('   Event MongoDB ID:', eventData._id || eventData.id);
      } catch (error) {
        console.error('Failed to load event:', error);
        setEventInfo(null);
        setErrors({ event: 'Invalid or expired event link' });
      } finally {
        setLoadingEvent(false);
      }
    };

    loadEventInfo();
  }, [eventIdFromUrl]);

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
    setErrors({});

    try {
      console.log('📝 Starting registration submission...');
      console.log('   Event MongoDB ID:', formData.eventId);
      console.log('   User Data:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });

      // ✅ FIX: Validate we have a real eventId before submitting
      if (!formData.eventId) {
        throw new Error('Event ID is missing. Please reload the page.');
      }

      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('eventId', formData.eventId); // ✅ Now sending real ObjectId
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);

      // Add the captured image blob
      if (formData.faceImageBlob) {
        formDataToSend.append('selfie', formData.faceImageBlob, 'selfie.jpg');
        console.log('✅ Selfie blob attached');
      } else if (formData.capturedImage && formData.capturedImage !== 'demo-image.jpg') {
        try {
          const response = await fetch(formData.capturedImage);
          const blob = await response.blob();
          formDataToSend.append('selfie', blob, 'selfie.jpg');
          console.log('✅ Selfie attached (converted from URL)');
        } catch (err) {
          console.warn('⚠️ Could not convert image URL to blob:', err);
        }
      } else {
        console.warn('⚠️ No selfie image available - proceeding without face data');
      }

      console.log('📤 Sending registration to API...');
      const response = await registrationAPI.register(formDataToSend);
      console.log('✅ Registration successful!');

      // Move to success screen
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('❌ Registration failed:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Registration failed. Please try again.';
      
      setErrors({ submit: errorMessage });
      alert(`Registration Error:\n${errorMessage}`);
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
      <div className="registration-page">
        <div className="loading-hero">
          <div className="loading-animation">
            <div className="loading-spinner-large"></div>
            <h2>Loading Event Details...</h2>
            <p>Preparing your registration experience</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if event not found
  if (!eventInfo && eventIdFromUrl) {
    return (
      <div className="registration-page">
        <div className="error-hero">
          <div className="error-content">
            <div className="error-icon-large">❌</div>
            <h2>Event Not Found</h2>
            <p>The event QR code is invalid or the event may have been removed.</p>
            <button onClick={() => navigate('/')} className="btn-primary-large">
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      {/* Premium Header with Event Info */}
      <div className="registration-hero">
        <div className="hero-background">
          <div className="hero-pattern"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-nav">
            <div className="brand-logo">
              <span className="logo-icon">📸</span>
              <span className="logo-text">PhotoEvents</span>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-nav-link"
            >
              Dashboard →
            </button>
          </div>

          {eventInfo && (
            <div className="event-showcase">
              <div className="event-badge">
                <span className="badge-icon">🎉</span>
                Live Event Registration
              </div>
              
              <h1 className="event-title">{eventInfo.name}</h1>
              
              <div className="event-details">
                <div className="detail-item">
                  <span className="detail-icon">📅</span>
                  <span>{new Date(eventInfo.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">👥</span>
                  <span>{eventInfo.expectedGuests} expected guests</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🤖</span>
                  <span>AI-powered photo delivery</span>
                </div>
              </div>

              <div className="registration-promise">
                <h2>Get Your Event Photos Automatically</h2>
                <p>Our AI will find and send you all your photos from this event. No more searching through hundreds of images!</p>
              </div>
            </div>
          )}

          {!eventInfo && (
            <div className="event-showcase">
              <div className="event-badge">
                <span className="badge-icon">✨</span>
                PhotoEvents Registration
              </div>
              
              <h1 className="event-title">Join the Photo Experience</h1>
              
              <div className="registration-promise">
                <h2>Never Miss Your Photos Again</h2>
                <p>Register once, and we'll automatically find and send you photos from all your events using AI face recognition.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Benefits Section */}
      <div className="progress-section">
        <div className="progress-container">
          <div className="progress-header">
            <h3>Quick Registration Process</h3>
            <p>Step {currentStep} of 4 - Only takes 2 minutes</p>
          </div>

          <div className="progress-visual">
            <div className="progress-bar-modern">
              <div 
                className="progress-fill" 
                style={{width: `${(currentStep / 4) * 100}%`}}
              ></div>
            </div>
            
            <div className="progress-steps">
              {[
                { number: 1, title: 'Your Details', icon: '👤', desc: 'Basic information' },
                { number: 2, title: 'Face Capture', icon: '📸', desc: 'For AI matching' },
                { number: 3, title: 'Review', icon: '✅', desc: 'Confirm details' },
                { number: 4, title: 'Success', icon: '🎉', desc: 'Ready to receive photos' }
              ].map(step => (
                <div 
                  key={step.number}
                  className={`progress-step ${step.number <= currentStep ? 'active' : ''} ${step.number < currentStep ? 'completed' : ''}`}
                >
                  <div className="step-circle">
                    <span className="step-icon">{step.icon}</span>
                    <span className="step-number">{step.number}</span>
                  </div>
                  <div className="step-info">
                    <div className="step-title">{step.title}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="form-section">
        <div className="form-layout">
          {/* Form Content */}
          <div className="form-content">
            <div className="form-card">
              {renderStepContent()}
            </div>
          </div>

          {/* Benefits Sidebar */}
          <div className="benefits-sidebar">
            <div className="benefits-card">
              <h3>Why Register?</h3>
              
              <div className="benefit-item">
                <div className="benefit-icon">🤖</div>
                <div>
                  <h4>AI-Powered Matching</h4>
                  <p>99.8% accurate face recognition finds all your photos automatically</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">📧</div>
                <div>
                  <h4>Instant Delivery</h4>
                  <p>Receive your personalized photo collection via email within hours</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">🔒</div>
                <div>
                  <h4>100% Private</h4>
                  <p>Your photos are securely processed and delivered only to you</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">⚡</div>
                <div>
                  <h4>Zero Effort</h4>
                  <p>No searching, no asking - photos come to you automatically</p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="trust-indicators">
              <h4>Trusted by 10,000+ users</h4>
              <div className="trust-badges">
                <div className="trust-badge">
                  <span className="trust-icon">🔒</span>
                  <span>GDPR Compliant</span>
                </div>
                <div className="trust-badge">
                  <span className="trust-icon">⚡</span>
                  <span>99.8% Accuracy</span>
                </div>
                <div className="trust-badge">
                  <span className="trust-icon">📱</span>
                  <span>Mobile Optimized</span>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="testimonial">
              <div className="testimonial-content">
                <p>"PhotoEvents found 47 photos of me at the wedding. I didn't have to ask anyone!"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">👤</div>
                  <div>
                    <div className="author-name">Sarah Johnson</div>
                    <div className="author-title">Wedding Guest</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      {currentStep === 2 && (
        <div className="how-it-works-section">
          <div className="how-it-works-container">
            <h3>How Our AI Finds Your Photos</h3>
            <div className="ai-process">
              <div className="process-step">
                <div className="process-icon">📸</div>
                <h4>Photo Upload</h4>
                <p>Event organizer uploads all event photos to our secure platform</p>
              </div>
              <div className="process-arrow">→</div>
              <div className="process-step">
                <div className="process-icon">🤖</div>
                <h4>AI Analysis</h4>
                <p>Our AI scans every face in every photo with 99.8% accuracy</p>
              </div>
              <div className="process-arrow">→</div>
              <div className="process-step">
                <div className="process-icon">📧</div>
                <h4>Smart Delivery</h4>
                <p>You receive a personalized collection of all photos containing you</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render step content function
  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-header">
              <h2>Tell us about yourself</h2>
              <p>We need a few details to create your photo delivery profile</p>
            </div>

            <div className="form-fields">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
                <div className="input-hint">We'll send your photos to this email</div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            <div className="step-actions">
              <button onClick={nextStep} className="btn-step-primary">
                Continue to Photo Capture →
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="step-header">
              <h2>Capture your photo</h2>
              <p>This helps our AI identify you in event photos with 99.8% accuracy</p>
            </div>

            {!formData.capturedImage ? (
              <div className="camera-section">
                <div className="camera-container">
                  <video ref={videoRef} autoPlay muted className="camera-preview" />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  
                  <div className="camera-overlay">
                    <div className="face-guide">
                      <div className="face-outline"></div>
                      <p>Position your face in the circle</p>
                    </div>
                  </div>
                </div>
                
                <div className="camera-controls">
                  {!stream ? (
                    <button onClick={startCamera} className="btn-camera-primary">
                      📷 Start Camera
                    </button>
                  ) : (
                    <button onClick={capturePhoto} className="btn-camera-capture">
                      📸 Capture Photo
                    </button>
                  )}
                </div>
                
                {errors.camera && <div className="error-message">{errors.camera}</div>}
                
                <div className="camera-tips">
                  <h4>For best results:</h4>
                  <ul>
                    <li>✓ Look directly at the camera</li>
                    <li>✓ Ensure good lighting</li>
                    <li>✓ Remove sunglasses or hats</li>
                  </ul>
                </div>

                <div className="demo-option">
                  <p>Testing the app?</p>
                  <button 
                    onClick={() => setFormData({...formData, capturedImage: 'demo-image.jpg'})}
                    className="btn-demo"
                  >
                    Skip Camera (Demo Mode)
                  </button>
                </div>
              </div>
            ) : (
              <div className="photo-success">
                <div className="success-animation">✅</div>
                <h3>Perfect! Photo captured successfully</h3>
                {formData.capturedImage !== 'demo-image.jpg' && (
                  <div className="captured-preview">
                    <img src={formData.capturedImage} alt="Captured face preview" className="preview-image" />
                  </div>
                )}
                <p>Our AI can now identify you in event photos with high accuracy</p>
                
                <div className="photo-actions">
                  <button onClick={retakePhoto} className="btn-retake">
                    🔄 Retake Photo
                  </button>
                </div>
              </div>
            )}

            <div className="step-actions">
              <button onClick={prevStep} className="btn-step-secondary">
                ← Back
              </button>
              {formData.capturedImage && (
                <button onClick={nextStep} className="btn-step-primary">
                  Continue to Review →
                </button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="step-header">
              <h2>Review your registration</h2>
              <p>Please confirm your details before completing registration</p>
            </div>

            <div className="review-summary">
              <div className="summary-section">
                <h3>Personal Information</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Name:</span>
                    <span className="summary-value">{formData.name}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Email:</span>
                    <span className="summary-value">{formData.email}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Phone:</span>
                    <span className="summary-value">{formData.phone}</span>
                  </div>
                </div>
              </div>

              {eventInfo && (
                <div className="summary-section">
                  <h3>Event Details</h3>
                  <div className="event-summary">
                    <div className="event-summary-header">
                      <h4>{eventInfo.name}</h4>
                      <span className="event-date">
                        {new Date(eventInfo.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="summary-section">
                <h3>Photo Recognition</h3>
                <div className="photo-status">
                  <span className="status-icon">✅</span>
                  <span>Photo captured and ready for AI matching</span>
                </div>
              </div>
            </div>

            <div className="registration-benefits">
              <h3>What happens next?</h3>
              <div className="next-steps">
                <div className="next-step">
                  <span className="next-icon">1️⃣</span>
                  <div>
                    <h4>Instant Processing</h4>
                    <p>Your registration is saved securely in our system</p>
                  </div>
                </div>
                <div className="next-step">
                  <span className="next-icon">2️⃣</span>
                  <div>
                    <h4>AI Photo Matching</h4>
                    <p>When photos are uploaded, our AI finds yours automatically</p>
                  </div>
                </div>
                <div className="next-step">
                  <span className="next-icon">3️⃣</span>
                  <div>
                    <h4>Automatic Delivery</h4>
                    <p>Receive your personalized photo collection via email</p>
                  </div>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="error-message-large">
                {errors.submit}
              </div>
            )}

            <div className="step-actions">
              <button onClick={prevStep} className="btn-step-secondary">
                ← Back to Edit
              </button>
              <button 
                onClick={nextStep} 
                disabled={isLoading}
                className="btn-step-primary final"
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Completing Registration...
                  </>
                ) : (
                  '🎉 Complete Registration'
                )}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content success">
            <div className="success-celebration">
              <div className="celebration-animation">🎉</div>
              <h2>Welcome to PhotoEvents!</h2>
              <p>Your registration is complete and you're ready to receive photos automatically</p>
            </div>

            <div className="success-details">
              <div className="success-card">
                <h3>Your Registration Summary</h3>
                <div className="registration-id">
                  <span className="id-label">Registration ID:</span>
                  <span className="id-value">#PE{Date.now().toString().slice(-6)}</span>
                </div>
                <div className="registered-details">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  {eventInfo && (
                    <p><strong>Event:</strong> {eventInfo.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="success-actions">
              <button onClick={() => navigate('/')} className="btn-success-primary">
                🏠 Return to Home
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-success-secondary">
                📊 View Dashboard
              </button>
            </div>

            <div className="success-tips">
              <h3>💡 Pro Tips</h3>
              <ul>
                <li>📧 Check your email for confirmation</li>
                <li>📸 Enjoy the event - photos will come to you automatically</li>
                <li>🔄 Processing typically takes 1-3 hours after photo upload</li>
                <li>📱 Save this page as a bookmark for future reference</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
};

export default MultiStepForm;