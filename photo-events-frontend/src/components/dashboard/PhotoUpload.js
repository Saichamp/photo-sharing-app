import React, { useState, useRef, useCallback } from 'react';
import './PhotoUpload.css';

const PhotoUpload = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({});
  const fileInputRef = useRef(null);

  const activeEvents = events.filter(
    event => event.status === 'active' || event.status === 'upcoming'
  );

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxFiles = 100;
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateFiles = (files) => {
    const errors = [];
    const validFiles = [];

    Array.from(files).forEach(file => {
      if (!supportedTypes.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type`);
      } else if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max 10MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > maxFiles) {
      errors.push(`Too many files selected (max ${maxFiles})`);
      return { validFiles: validFiles.slice(0, maxFiles), errors };
    }

    return { validFiles, errors };
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  };

  const processFiles = (files) => {
    const { validFiles, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      showNotification('⚠️ ' + errors[0], 'error');
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setUploadComplete(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setUploadComplete(false);
    setUploadProgress(0);
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `upload-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const simulateAIProcessing = async () => {
    const stages = [
      { name: 'face-detection', label: 'Detecting faces in photos...', duration: 2000 },
      { name: 'face-analysis', label: 'Analyzing facial features...', duration: 3000 },
      { name: 'matching', label: 'Matching with registered guests...', duration: 2500 },
      { name: 'grouping', label: 'Organizing photos by person...', duration: 1500 },
      { name: 'complete', label: 'Processing complete!', duration: 500 }
    ];

    for (let stage of stages) {
      setProcessingStatus(prev => ({ ...prev, [stage.name]: 'processing' }));
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      setProcessingStatus(prev => ({ ...prev, [stage.name]: 'complete' }));
    }
  };

  const handleUpload = async () => {
    if (!selectedEvent) {
      showNotification('⚠️ Please select an event first', 'error');
      return;
    }

    if (uploadedFiles.length === 0) {
      showNotification('⚠️ Please select photos to upload', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Wait for upload to complete
    await new Promise(resolve => {
      const checkComplete = () => {
        if (uploadProgress >= 100) {
          resolve();
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    });

    clearInterval(uploadInterval);
    setUploadProgress(100);

    // Start AI processing
    await simulateAIProcessing();

    setIsUploading(false);
    setUploadComplete(true);
    showNotification(`🎉 ${uploadedFiles.length} photos processed successfully!`);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSelectedEventInfo = () => {
    return events.find(event => event.id === selectedEvent);
  };

  if (activeEvents.length === 0) {
    return (
      <div className="photo-upload-container">
        <div className="empty-state">
          <div className="empty-state-icon">📸</div>
          <div className="empty-state-content">
            <h3>No Active Events</h3>
            <p>Create an active event first to upload photos</p>
            <div className="empty-state-features">
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span>AI will automatically detect faces in your photos</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📧</span>
                <span>Matching photos will be sent to registered guests</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Processing typically takes just a few minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-upload-container">
      {/* Event Selection */}
      <div className="event-selection-section">
        <div className="section-header">
          <h3>Select Event</h3>
          <p>Choose which event these photos belong to</p>
        </div>
        
        <div className="event-selector">
          {activeEvents.map(event => (
            <div
              key={event.id}
              className={`event-card ${selectedEvent === event.id ? 'selected' : ''}`}
              onClick={() => setSelectedEvent(event.id)}
            >
              <div className="event-card-header">
                <div className="event-name">{event.name}</div>
                <div className="event-status">
                  <span className={`status-dot ${event.status}`}></span>
                  <span className="status-text">{event.status}</span>
                </div>
              </div>
              <div className="event-details">
                <div className="event-date">
                  📅 {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="event-guests">
                  👥 {event.registrations} registered guests
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      {selectedEvent && (
        <div className="upload-section">
          <div className="section-header">
            <h3>Upload Photos</h3>
            <p>
              Drag and drop photos or click to browse. 
              Our AI will automatically process and deliver them to guests.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={`drop-zone ${dragActive ? 'drag-active' : ''} ${uploadedFiles.length > 0 ? 'has-files' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDrag}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
            />

            {uploadedFiles.length === 0 ? (
              <div className="drop-zone-content">
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  <h4>Drop photos here or click to browse</h4>
                  <p>
                    Supports JPG, PNG, WebP • Max {maxFiles} photos • Up to 10MB each
                  </p>
                </div>
                <div className="upload-features">
                  <div className="feature-badge">🤖 AI Processing</div>
                  <div className="feature-badge">⚡ Fast Upload</div>
                  <div className="feature-badge">📧 Auto Delivery</div>
                </div>
              </div>
            ) : (
              <div className="files-preview">
                <div className="files-header">
                  <div className="files-count">
                    📸 {uploadedFiles.length} photo{uploadedFiles.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="files-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPreview(!showPreview);
                      }}
                      className="toggle-preview-btn"
                    >
                      {showPreview ? '🙈 Hide' : '👁️ Show'} Preview
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllFiles();
                      }}
                      className="clear-all-btn"
                    >
                      🗑️ Clear All
                    </button>
                  </div>
                </div>

                {showPreview && (
                  <div className="files-grid">
                    {uploadedFiles.slice(0, 12).map((file, index) => (
                      <div key={index} className="file-preview">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="preview-image"
                        />
                        <div className="file-info">
                          <div className="file-name">{file.name}</div>
                          <div className="file-size">{formatFileSize(file.size)}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="remove-file-btn"
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                    {uploadedFiles.length > 12 && (
                      <div className="more-files">
                        +{uploadedFiles.length - 12} more
                      </div>
                    )}
                  </div>
                )}

                <div className="add-more-section">
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="add-more-btn"
                  >
                    ➕ Add More Photos
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="upload-progress-section">
              <div className="progress-header">
                <h4>Processing Photos with AI</h4>
                <div className="progress-percentage">{Math.round(uploadProgress)}%</div>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>

              <div className="processing-stages">
                {[
                  { key: 'face-detection', label: 'Detecting faces in photos...', icon: '🔍' },
                  { key: 'face-analysis', label: 'Analyzing facial features...', icon: '🧠' },
                  { key: 'matching', label: 'Matching with registered guests...', icon: '🎯' },
                  { key: 'grouping', label: 'Organizing photos by person...', icon: '📚' },
                  { key: 'complete', label: 'Processing complete!', icon: '✅' }
                ].map(stage => (
                  <div 
                    key={stage.key}
                    className={`processing-stage ${processingStatus[stage.key] || 'pending'}`}
                  >
                    <div className="stage-icon">{stage.icon}</div>
                    <div className="stage-label">{stage.label}</div>
                    <div className="stage-status">
                      {processingStatus[stage.key] === 'processing' && (
                        <div className="processing-spinner"></div>
                      )}
                      {processingStatus[stage.key] === 'complete' && (
                        <div className="complete-check">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadComplete && (
            <div className="upload-success">
              <div className="success-animation">🎉</div>
              <h4>Photos Processed Successfully!</h4>
              <p>
                {uploadedFiles.length} photos have been processed and organized. 
                Guests will receive their photos automatically via email.
              </p>
              
              <div className="success-stats">
                <div className="stat-item">
                  <span className="stat-number">{uploadedFiles.length}</span>
                  <span className="stat-label">Photos Processed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{getSelectedEventInfo()?.registrations || 0}</span>
                  <span className="stat-label">Guests Notified</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">99.8%</span>
                  <span className="stat-label">AI Accuracy</span>
                </div>
              </div>

              <div className="success-actions">
                <button 
                  onClick={clearAllFiles}
                  className="btn btn-primary"
                >
                  Upload More Photos
                </button>
                <button 
                  onClick={() => {/* Navigate to analytics */}}
                  className="btn btn-secondary"
                >
                  View Analytics
                </button>
              </div>
            </div>
          )}

          {/* Upload Actions */}
          {uploadedFiles.length > 0 && !isUploading && !uploadComplete && (
            <div className="upload-actions">
              <div className="upload-info">
                <div className="info-item">
                  <span className="info-label">Total Photos:</span>
                  <span className="info-value">{uploadedFiles.length}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Size:</span>
                  <span className="info-value">
                    {formatFileSize(uploadedFiles.reduce((sum, file) => sum + file.size, 0))}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Event:</span>
                  <span className="info-value">{getSelectedEventInfo()?.name}</span>
                </div>
              </div>
              
              <button 
                onClick={handleUpload}
                className="btn btn-upload"
              >
                🚀 Process {uploadedFiles.length} Photo{uploadedFiles.length !== 1 ? 's' : ''} with AI
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="upload-guidelines">
        <h4>📋 Photo Upload Guidelines</h4>
        <div className="guidelines-grid">
          <div className="guideline-item">
            <span className="guideline-icon">📏</span>
            <div>
              <strong>Image Quality:</strong>
              <p>High-resolution photos work best for face detection</p>
            </div>
          </div>
          <div className="guideline-item">
            <span className="guideline-icon">👥</span>
            <div>
              <strong>Group Photos:</strong>
              <p>Include group shots for better guest coverage</p>
            </div>
          </div>
          <div className="guideline-item">
            <span className="guideline-icon">💡</span>
            <div>
              <strong>Lighting:</strong>
              <p>Well-lit photos improve AI face recognition accuracy</p>
            </div>
          </div>
          <div className="guideline-item">
            <span className="guideline-icon">🔒</span>
            <div>
              <strong>Privacy:</strong>
              <p>Photos are processed securely and only shared with registered guests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;
