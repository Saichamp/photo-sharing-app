import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventAPI, photoAPI } from '../../services/api';
import { formatters } from '../../utils/formatters';
import { Loader } from '../../components/common/Loader';
import './PhotoUpload.css';

const PhotoUpload = () => {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get('eventId');

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId || '');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const response = await eventAPI.getAll({ status: 'upcoming,active' });
        const eventsData = response.data?.events || [];
        setEvents(eventsData);
        
        if (preselectedEventId && eventsData.find(e => e._id === preselectedEventId)) {
          setSelectedEventId(preselectedEventId);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [preselectedEventId]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        setError(`${file.name} is not a valid image file`);
      }
      return isValid;
    });

    // Validate file sizes (10MB max per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validSizedFiles = validFiles.filter(file => {
      const isValid = file.size <= maxSize;
      if (!isValid) {
        setError(`${file.name} is too large (max 10MB)`);
      }
      return isValid;
    });

    setSelectedFiles(prev => [...prev, ...validSizedFiles]);
    
    // Create previews
    validSizedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, {
          file: file.name,
          url: e.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedEventId) {
      setError('Please select an event');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('eventId', selectedEventId);
      
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      await photoAPI.upload(formData, (progress) => {
        setUploadProgress(progress);
      });

      setSuccess(true);
      setSelectedFiles([]);
      setPreviews([]);
      
      // Reset success after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setUploadProgress(0);
      }, 3000);

    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const selectedEvent = events.find(e => e._id === selectedEventId);

  return (
    <div className="photo-upload-container">
      <div className="upload-header">
        <h2>Upload Event Photos</h2>
        <p>Upload photos and let AI match them to your guests automatically</p>
      </div>

      {/* Event Selection */}
      <div className="upload-section">
        <h3 className="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
          </svg>
          Step 1: Select Event
        </h3>

        {loading ? (
          <Loader size="sm" text="Loading events..." />
        ) : events.length === 0 ? (
          <div className="empty-message">
            <p>No upcoming or active events found. Create an event first!</p>
          </div>
        ) : (
          <div className="event-selector">
            {events.map(event => (
              <div
                key={event._id}
                className={`event-option ${selectedEventId === event._id ? 'selected' : ''}`}
                onClick={() => setSelectedEventId(event._id)}
              >
                <div className="event-option-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                  </svg>
                </div>
                <div className="event-option-info">
                  <h4>{event.name}</h4>
                  <p>{formatters.date(event.date)} • {event.location}</p>
                  <div className="event-option-stats">
                    <span>{event.photosUploaded || 0} photos</span>
                    <span>•</span>
                    <span>{event.registrationCount || 0} guests</span>
                  </div>
                </div>
                {selectedEventId === event._id && (
                  <div className="selected-check">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedEvent && (
          <div className="selected-event-info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
            </svg>
            <span>Selected: <strong>{selectedEvent.name}</strong></span>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="upload-section">
        <h3 className="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          Step 2: Select Photos
        </h3>

        <div className="file-upload-area">
          <input
            type="file"
            id="file-input"
            className="file-input-hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={!selectedEventId || uploading}
          />
          <label htmlFor="file-input" className={`file-upload-label ${!selectedEventId ? 'disabled' : ''}`}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <span className="upload-title">
              {selectedEventId ? 'Click to browse or drag & drop' : 'Select an event first'}
            </span>
            <span className="upload-subtitle">
              PNG, JPG, WebP • Max 10MB per file • Up to 100 files
            </span>
          </label>
        </div>

        {/* Preview Grid */}
        {previews.length > 0 && (
          <div className="preview-section">
            <div className="preview-header">
              <h4>{selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} selected</h4>
              <button
                className="btn-text"
                onClick={() => {
                  setSelectedFiles([]);
                  setPreviews([]);
                }}
              >
                Clear All
              </button>
            </div>
            <div className="preview-grid">
              {previews.map((preview, index) => (
                <div key={index} className="preview-item">
                  <img src={preview.url} alt={`Preview ${index + 1}`} />
                  <button
                    className="preview-remove"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                    </svg>
                  </button>
                  <div className="preview-info">
                    <span className="preview-name">{selectedFiles[index].name}</span>
                    <span className="preview-size">{formatters.fileSize(selectedFiles[index].size)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="upload-actions">
          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              Photos uploaded successfully! AI processing started.
            </div>
          )}

          {uploading && (
            <div className="upload-progress-container">
              <div className="upload-progress-bar">
                <div 
                  className="upload-progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="upload-progress-text">{uploadProgress}% uploaded</span>
            </div>
          )}

          <button
            className="btn btn-pink btn-lg w-full"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} />
                Uploading {uploadProgress}%...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
                </svg>
                Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Info Cards */}
      <div className="info-cards">
        <div className="info-card">
          <div className="info-card-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
          <div>
            <h4>AI Processing</h4>
            <p>Photos are processed with face detection after upload</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon pink">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <div>
            <h4>Privacy First</h4>
            <p>Your photos are encrypted and securely stored</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon rose">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </div>
          <div>
            <h4>Quick Matching</h4>
            <p>Guests receive their photos within minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;
