import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { photoAPI } from '../../services/api';
import './PhotoUpload.css';

const PhotoUpload = ({ events = [], selectedEvent, onEventSelect, onPhotosUploaded }) => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // ✅ ONLY IMAGE TYPE CHECK - NO SIZE/COUNT LIMITS!
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    const event = events.find(ev => ev._id === eventId);
    if (onEventSelect) onEventSelect(event);
    setUploadError(null);
    setUploadSuccess(false);
  };

  // Generate thumbnail preview
  const generateThumbnail = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // ✅ SIMPLIFIED VALIDATION - ONLY CHECK TYPE
  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'Invalid file type (only images allowed)' };
    }
    return { valid: true };
  };

  // Handle file selection
  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files);
    console.log(`📂 Selected ${fileArray.length} files`);
    
    const newQueue = [];
    for (const file of fileArray) {
      const validation = validateFile(file);
      const thumbnail = await generateThumbnail(file);
      
      newQueue.push({
        id: Date.now() + Math.random(),
        file,
        thumbnail,
        status: validation.valid ? 'pending' : 'error',
        progress: 0,
        error: validation.valid ? null : validation.error
      });
    }
    
    setUploadQueue([...uploadQueue, ...newQueue]);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Remove file from queue
  const removeFile = (id) => {
    setUploadQueue(uploadQueue.filter(item => item.id !== id));
  };

  // Clear all files
  const clearAll = () => {
    setUploadQueue([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Upload files
  const handleUpload = async () => {
    if (!selectedEvent) {
      setUploadError('Please select an event first');
      return;
    }

    const validFiles = uploadQueue.filter(item => item.status !== 'error');
    
    if (validFiles.length === 0) {
      setUploadError('No valid photos to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('eventId', selectedEvent._id);
      
      // ✅ Append all files
      validFiles.forEach(item => {
        formData.append('photos', item.file);
      });

      console.log('📤 Uploading', validFiles.length, 'photos to event:', selectedEvent._id);

      // Update status
      setUploadQueue(prev => 
        prev.map(item => 
          item.status === 'pending' ? { ...item, status: 'uploading' } : item
        )
      );

      const response = await photoAPI.upload(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          
          setUploadQueue(prev => 
            prev.map(item => 
              item.status === 'uploading' 
                ? { ...item, progress: percentCompleted } 
                : item
            )
          );
        }
      });

      console.log('✅ Upload successful:', response.data);

      // Mark as completed
      setUploadQueue(prev => 
        prev.map(item => 
          item.status === 'uploading' 
            ? { ...item, status: 'completed', progress: 100 } 
            : item
        )
      );

      setUploadSuccess(true);

      // Redirect to preview page
      setTimeout(() => {
        navigate(`/events/${selectedEvent._id}/photos`);
      }, 1500);

    } catch (error) {
      console.error('❌ Upload failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      setUploadError(errorMsg);
      
      setUploadQueue(prev => 
        prev.map(item => 
          item.status === 'uploading' 
            ? { ...item, status: 'error', error: errorMsg } 
            : item
        )
      );
    } finally {
      setUploading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: uploadQueue.length,
    pending: uploadQueue.filter(i => i.status === 'pending').length,
    error: uploadQueue.filter(i => i.status === 'error').length,
    completed: uploadQueue.filter(i => i.status === 'completed').length,
    totalSize: uploadQueue.reduce((sum, item) => sum + item.file.size, 0)
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (events.length === 0) {
    return (
      <div className="photo-upload-empty">
        <div className="empty-icon">📸</div>
        <h2>Create an event first</h2>
        <p>You need to create an event before uploading photos</p>
        <button onClick={() => navigate('/events/create')} className="create-event-btn">
          Create Event
        </button>
      </div>
    );
  }

  return (
    <div className="photo-upload-container">
      <div className="upload-header">
        <h1>Upload Event Photos</h1>
        <p>Upload photos for AI-powered face matching and automatic delivery to guests</p>
      </div>

      {/* Event Selector */}
      <div className="event-selector">
        <label htmlFor="event-select">Select Event *</label>
        <select 
          id="event-select"
          value={selectedEvent?._id || ''} 
          onChange={handleEventChange}
          className="event-dropdown"
        >
          <option value="">Choose an event...</option>
          {events.map(event => (
            <option key={event._id} value={event._id}>
              {event.name} ({event.status})
            </option>
          ))}
        </select>
      </div>

      {/* Drop Zone */}
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="drop-zone-content">
          <div className="upload-icon">📷</div>
          <h3>Drag & Drop Photos Here</h3>
          <p>or click to browse</p>
          <div className="file-info">
            <p>✅ Supports: JPG, PNG, WebP, GIF, HEIC</p>
            <p>✅ <strong>Unlimited</strong> photos & file size</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="upload-queue">
          <div className="queue-header">
            <h3>Upload Queue ({stats.total} photos, {formatFileSize(stats.totalSize)})</h3>
            <button onClick={clearAll} className="clear-btn" disabled={uploading}>
              Clear All
            </button>
          </div>

          <div className="queue-grid">
            {uploadQueue.map(item => (
              <div key={item.id} className={`queue-item status-${item.status}`}>
                <img src={item.thumbnail} alt={item.file.name} />
                
                <div className="item-info">
                  <span className="item-name" title={item.file.name}>{item.file.name}</span>
                  <span className="item-size">{formatFileSize(item.file.size)}</span>
                </div>

                {item.status === 'uploading' && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${item.progress}%` }}>
                      <span className="progress-text">{item.progress}%</span>
                    </div>
                  </div>
                )}

                {item.status === 'error' && (
                  <div className="item-error">{item.error}</div>
                )}

                {item.status === 'pending' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.id);
                    }} 
                    className="remove-btn"
                  >
                    ✕
                  </button>
                )}

                {item.status === 'completed' && (
                  <div className="item-success">✓</div>
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="upload-actions">
            {uploadError && <div className="error-message">❌ {uploadError}</div>}
            {uploadSuccess && <div className="success-message">✅ Upload successful! Redirecting...</div>}
            
            <button 
              onClick={handleUpload}
              disabled={uploading || stats.pending === 0}
              className="upload-btn"
            >
              {uploading 
                ? `⏳ Uploading... ${stats.completed}/${stats.total}` 
                : `📤 Upload ${stats.pending} Photos`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
