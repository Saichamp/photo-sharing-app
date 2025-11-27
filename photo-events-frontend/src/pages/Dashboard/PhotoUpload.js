import React, { useState, useRef } from 'react';
import { photoAPI } from '../../services/api';
import './PhotoUpload.css';

const PhotoUpload = ({ events = [], selectedEvent, onEventSelect, onPhotosUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    const event = events.find(ev => ev._id === eventId);
    if (onEventSelect) onEventSelect(event);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedEvent) {
      setUploadError('Please select an event first');
      return;
    }

    if (selectedFiles.length === 0) {
      setUploadError('Please select photos to upload');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setUploadError(null);

      const formData = new FormData();
      formData.append('eventId', selectedEvent._id);
      
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      console.log('📤 Uploading photos:', selectedFiles.length, 'files');

      const response = await photoAPI.upload(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      console.log('✅ Upload successful:', response.data);
      
      setUploadSuccess(true);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Notify parent to refresh
      if (onPhotosUploaded) {
        onPhotosUploaded();
      }

      // Reset success message after 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);

    } catch (error) {
      console.error('❌ Upload failed:', error);
      setUploadError(error.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  if (events.length === 0) {
    return (
      <div className="photo-upload-empty">
        <div className="empty-icon">📸</div>
        <h3>No Events Available</h3>
        <p>Create an event first before uploading photos</p>
        <a href="/dashboard/create" className="btn btn-primary">
          Create Event
        </a>
      </div>
    );
  }

  return (
    <div className="photo-upload-container">
      <div className="upload-header">
        <h2>Upload Event Photos</h2>
        <p>Upload photos to your event for AI-powered face matching</p>
      </div>

      {/* Event Selection */}
      <div className="event-selection">
        <label className="form-label">Select Event *</label>
        <select 
          value={selectedEvent?._id || ''} 
          onChange={handleEventChange}
          className="event-select"
          disabled={uploading}
        >
          <option value="">Choose an event...</option>
          {events.map(event => (
            <option key={event._id} value={event._id}>
              {event.name} - {new Date(event.date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload Area */}
      {selectedEvent && (
        <>
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
              id="photo-input"
            />
            
            <label htmlFor="photo-input" className="upload-dropzone">
              <div className="dropzone-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <h3>Click to select photos</h3>
                <p>or drag and drop</p>
                <span className="file-types">JPG, PNG, WEBP up to 10MB each</span>
              </div>
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>Selected Photos ({selectedFiles.length})</h4>
              <div className="file-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="btn-remove"
                      disabled={uploading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="progress-text">Uploading... {progress}%</p>
            </div>
          )}

          {/* Messages */}
          {uploadError && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              Photos uploaded successfully! AI processing started.
            </div>
          )}

          {/* Upload Button */}
          <div className="upload-actions">
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="btn btn-primary btn-large"
            >
              {uploading ? (
                <>
                  <span className="spinner-small"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                  </svg>
                  Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoUpload;
