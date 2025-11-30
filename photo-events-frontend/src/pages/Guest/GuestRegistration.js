// src/pages/Guest/GuestRegistration.js
import React, {
  useState,
  useRef,
  useEffect,
  useCallback
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationAPI, eventAPI } from '../../services/api';
import './GuestRegistration.css';

const GuestRegistration = () => {
  // URL param from QR/link (not the MongoDB _id)
  const { eventId: eventIdFromUrl } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stream, setStream] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    eventId: '',          // Will store real MongoDB _id from backend
    name: '',
    email: '',
    phone: '',
    capturedImage: null,
    faceBlob: null
  });

  // Load event by QR/URL param and store real MongoDB _id
  const loadEvent = useCallback(async () => {
    if (!eventIdFromUrl) {
      setLoading(false);
      setErrors({ event: 'No event ID provided' });
      return;
    }

    try {
      setLoading(true);
      console.log('📥 Loading event with URL param:', eventIdFromUrl);

      const response = await eventAPI.getByQRCode(eventIdFromUrl);
      const eventData = response.data?.data || response.data;

      setEventInfo(eventData);

      // Store real MongoDB _id in formData.eventId
      setFormData(prev => ({
        ...prev,
        eventId: eventData._id || eventData.id
      }));

      console.log('✅ Event loaded successfully');
      console.log('   Event Name:', eventData.name);
      console.log('   Real MongoDB ID:', eventData._id || eventData.id);
    } catch (error) {
      console.error('❌ Failed to load event:', error);
      setErrors({ event: 'Invalid event link' });
    } finally {
      setLoading(false);
    }
  }, [eventIdFromUrl]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Effect: load event when URL param changes, clean up camera on unmount
  useEffect(() => {
    loadEvent();
    return () => stopCamera();
  }, [loadEvent, stopCamera]);

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Please enter your full name (min 2 characters)';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' }
      });
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setErrors({});
    } catch (error) {
      setErrors({
        camera: 'Camera access denied. Please enable camera permissions.'
      });
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setFormData(prev => ({
            ...prev,
            capturedImage: URL.createObjectURL(blob),
            faceBlob: blob
          }));
          stopCamera();
        }
      },
      'image/jpeg',
      0.95
    );
  };

  const retakePhoto = () => {
    setFormData(prev => ({
      ...prev,
      capturedImage: null,
      faceBlob: null
    }));
    startCamera();
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && formData.capturedImage) {
      setCurrentStep(3);
    } else if (!formData.capturedImage) {
      setErrors({ camera: 'Please capture your photo' });
    }
  };

  // Submit registration and navigate to GuestGallery with registrationId
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const submitData = new FormData();

      // Use MongoDB ObjectId from formData.eventId
      submitData.append('eventId', formData.eventId);
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      if (formData.faceBlob) {
        submitData.append('selfie', formData.faceBlob, 'selfie.jpg');
      }

      const response = await registrationAPI.register(submitData);

      const registrationId =
        response.data?.data?.id ||
        response.data?.data?._id ||
        response.data?.data?.registrationId;

      if (registrationId) {
        navigate(`/guest/gallery/${registrationId}`);
      } else {
        setCurrentStep(4);
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Registration failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="reg-loading">
        <div className="spinner"></div>
        <p>Loading event...</p>
      </div>
    );
  }

  // Invalid event state
  if (errors.event) {
    return (
      <div className="reg-error">
        <div className="error-icon">⚠️</div>
        <h2>Event Not Found</h2>
        <p>{errors.event}</p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="registration-wrapper">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="registration-content">
        {/* Header */}
        <div className="reg-header">
          <div className="logo">
            <div className="logo-circle">📸</div>
            <span>PhotoManEa</span>
          </div>
          {eventInfo && (
            <div className="event-badge">
              <h3>{eventInfo.name}</h3>
              <p>
                {new Date(eventInfo.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="progress-wrapper">
          <div className="progress-line">
            <div
              className="progress-active"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
          <div className="progress-dots">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`dot ${currentStep >= step ? 'active' : ''}`}
              >
                <span>{step}</span>
                <label>{['Info', 'Photo', 'Review', 'Done'][step - 1]}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="reg-card">
          {/* Step 1: Information */}
          {currentStep === 1 && (
            <div className="step-content fade-in">
              <h2>Welcome! Let&apos;s get you registered 👋</h2>
              <p className="subtitle">
                We need a few details to set up your photo delivery
              </p>

              <div className="form-grid">
                <div className="input-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && (
                    <span className="error-msg">{errors.name}</span>
                  )}
                </div>

                <div className="input-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && (
                    <span className="error-msg">{errors.email}</span>
                  )}
                </div>

                <div className="input-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="9876543210"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && (
                    <span className="error-msg">{errors.phone}</span>
                  )}
                </div>
              </div>

              <div className="info-box">
                <span className="icon">💡</span>
                <div>
                  <strong>Why we need this:</strong>
                  <p>
                    Our AI will find all your photos and send them to your
                    email automatically!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Photo Capture */}
          {currentStep === 2 && (
            <div className="step-content fade-in">
              <h2>Smile for the camera! 📸</h2>
              <p className="subtitle">
                Take a clear selfie so our AI can find you in photos
              </p>

              {!formData.capturedImage ? (
                <>
                  <div className="camera-box">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="video-stream"
                    ></video>
                    <canvas
                      ref={canvasRef}
                      style={{ display: 'none' }}
                    ></canvas>
                    <div className="face-outline"></div>
                  </div>

                  {errors.camera && (
                    <div className="alert-error">{errors.camera}</div>
                  )}

                  <div className="camera-controls">
                    {!stream ? (
                      <button
                        onClick={startCamera}
                        className="btn-primary btn-lg"
                      >
                        <span>📷</span> Start Camera
                      </button>
                    ) : (
                      <button
                        onClick={capturePhoto}
                        className="btn-primary btn-lg pulse"
                      >
                        <span>✨</span> Capture
                      </button>
                    )}
                  </div>

                  <div className="tips">
                    <p>
                      <strong>Tips:</strong>
                    </p>
                    <ul>
                      <li>Face the camera directly</li>
                      <li>Ensure good lighting</li>
                      <li>Remove sunglasses</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="photo-preview">
                    <img
                      src={formData.capturedImage}
                      alt="Registration selfie preview"
                    />
                    <div className="preview-badge">✓ Perfect!</div>
                  </div>
                  <button
                    onClick={retakePhoto}
                    className="btn-secondary"
                  >
                    Retake Photo
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="step-content fade-in">
              <h2>Confirm your details ✓</h2>
              <p className="subtitle">Review before submitting</p>

              <div className="review-card">
                <div className="review-section">
                  <h4>Personal Information</h4>
                  <div className="detail">
                    <span>Name:</span>
                    <strong>{formData.name}</strong>
                  </div>
                  <div className="detail">
                    <span>Email:</span>
                    <strong>{formData.email}</strong>
                  </div>
                  <div className="detail">
                    <span>Phone:</span>
                    <strong>{formData.phone}</strong>
                  </div>
                </div>

                <div className="review-section">
                  <h4>Your Selfie</h4>
                  <img
                    src={formData.capturedImage}
                    alt="Selfie confirmation"
                    className="review-photo"
                  />
                </div>

                {eventInfo && (
                  <div className="review-section">
                    <h4>Event Details</h4>
                    <div className="detail">
                      <span>Event:</span>
                      <strong>{eventInfo.name}</strong>
                    </div>
                    <div className="detail">
                      <span>Date:</span>
                      <strong>
                        {new Date(eventInfo.date).toLocaleDateString()}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="alert-error">{errors.submit}</div>
              )}

              <div className="info-box success">
                <span className="icon">🔒</span>
                <div>
                  <strong>Privacy Protected:</strong>
                  <p>
                    Your data is encrypted and only used for photo matching.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success (fallback if we ever stay here) */}
          {currentStep === 4 && (
            <div className="step-content fade-in success-state">
              <div className="success-icon">✓</div>
              <h2>Registration Complete! 🎉</h2>
              <p className="subtitle">
                You&apos;re all set to receive your photos
              </p>

              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-icon">📸</div>
                  <div>
                    <strong>Photos Uploaded</strong>
                    <p>Event organizer uploads photos</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-icon">🤖</div>
                  <div>
                    <strong>AI Processing</strong>
                    <p>We find all your photos instantly</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-icon">📧</div>
                  <div>
                    <strong>Email Delivery</strong>
                    <p>Photos arrive in your inbox</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="btn-primary btn-lg"
              >
                Back to Home
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          {currentStep < 4 && (
            <div className="nav-buttons">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="btn-secondary"
                >
                  ← Back
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="btn-primary"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting
                    ? 'Submitting...'
                    : '🎉 Complete Registration'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestRegistration;
