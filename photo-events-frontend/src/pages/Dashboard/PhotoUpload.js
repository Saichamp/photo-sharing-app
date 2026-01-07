import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { photoAPI, eventAPI } from '../../services/api';
import './PhotoUpload.css';

const PhotoUpload = () => {
  const navigate = useNavigate();
  
  // ✅ FIX: Ensure events is ALWAYS an array
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingInfo, setProcessingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const uploadCancelRef = useRef(false);

  // ✅ ONLY IMAGE TYPE CHECK - NO SIZE/COUNT LIMITS!
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

  // ✅ Load events on mount
  React.useEffect(() => {
    loadEvents();
  }, []);

const loadEvents = async () => {
  try {
    setLoading(true);
    console.log('📡 Loading events...');
    
    const response = await eventAPI.getAll();
    console.log('✅ Full API response:', response);
    console.log('✅ response.data:', response.data);
    
    // ✅ CORRECT: Backend returns { success: true, data: { events: [...], pagination: {...} } }
    let eventsData = [];
    
    if (response.data) {
      // Check if events array is at response.data.data.events
      if (response.data.data && Array.isArray(response.data.data.events)) {
        eventsData = response.data.data.events;
      }
      // Or at response.data.events
      else if (Array.isArray(response.data.events)) {
        eventsData = response.data.events;
      }
      // Or directly at response.data
      else if (Array.isArray(response.data)) {
        eventsData = response.data;
      }
    }
    
    console.log('📋 Parsed events:', eventsData.length, 'events found');
    console.log('Events:', eventsData);
    
    setEvents(eventsData);
    
    // Auto-select first active event
    if (eventsData.length > 0) {
      const activeEvent = eventsData.find(e => e.status === 'active') || eventsData[0];
      setSelectedEvent(activeEvent);
      console.log('✅ Auto-selected event:', activeEvent?.name);
    }
    
  } catch (error) {
    console.error('❌ Failed to load events:', error);
    console.error('Error details:', error.response?.data);
    setUploadError(`Failed to load events: ${error.message}`);
    setEvents([]);
  } finally {
    setLoading(false);
  }
};

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    const event = events.find(ev => ev._id === eventId);
    setSelectedEvent(event);
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
    if (uploading) {
      if (!window.confirm('Upload in progress. Are you sure you want to cancel?')) {
        return;
      }
      uploadCancelRef.current = true;
    }
    
    setUploadQueue([]);
    setUploadError(null);
    setUploadSuccess(false);
    setProcessingInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      uploadCancelRef.current = false;

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
          if (uploadCancelRef.current) {
            throw new Error('Upload cancelled by user');
          }

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

      // ✅ Show processing info
      const uploadResult = response.data.data || response.data;
      if (uploadResult.queueSize || uploadResult.estimatedTime) {
        setProcessingInfo({
          queueSize: uploadResult.queueSize,
          estimatedTime: uploadResult.estimatedTime,
          uploaded: uploadResult.uploaded
        });
      }

      // Redirect to preview page after 2 seconds
      setTimeout(() => {
        navigate(`/events/${selectedEvent._id}/photos`);
      }, 2000);

    } catch (error) {
      if (uploadCancelRef.current) {
        console.log('Upload cancelled');
        setUploadError('Upload cancelled');
        setUploadQueue([]);
        return;
      }

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

  // ✅ Loading state
  if (loading) {
    return (
      <div className="photo-upload-loading">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  // ✅ No events state
  if (events.length === 0) {
    return (
      <div className="photo-upload-empty">
        <div className="empty-icon">📸</div>
        <h2>Create an event first</h2>
        <p>You need to create an event before uploading photos</p>
        <button onClick={() => navigate('/dashboard/create-event')} className="create-event-btn">
          Create Event
        </button>
      </div>
    );
  }

  return (
    <div className="photo-upload-container">
      {/* Header */}
      <div className="upload-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <div className="header-content">
          <h1>Upload Event Photos</h1>
          <p>Upload photos for AI-powered face matching and automatic delivery to guests</p>
        </div>
      </div>

      {/* Event Selector */}
      <div className="event-selector">
        <label htmlFor="event-select">Select Event *</label>
        <select 
          id="event-select"
          value={selectedEvent?._id || ''} 
          onChange={handleEventChange}
          className="event-dropdown"
          disabled={uploading}
        >
          <option value="">Choose an event...</option>
          {events.map(event => (
            <option key={event._id} value={event._id}>
              {event.name} ({event.status})
            </option>
          ))}
        </select>
        {selectedEvent && (
          <p className="event-info">
            📅 {new Date(selectedEvent.eventDate).toLocaleDateString()} | 
            📍 {selectedEvent.location || 'No location'} |
            👥 {selectedEvent.registrations || 0} guests
          </p>
        )}
      </div>

      {/* Drop Zone */}
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <div className="drop-zone-content">
          <div className="upload-icon">📷</div>
          <h3>Drag & Drop Photos Here</h3>
          <p>or click to browse</p>
          <div className="file-info">
            <p>✅ Supports: JPG, PNG, WebP, GIF, HEIC</p>
            <p>✅ <strong>Unlimited</strong> photos & file size</p>
            <p>⚡ Processing: ~3-5 seconds per photo</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="upload-queue">
          <div className="queue-header">
            <div className="queue-stats">
              <h3>Upload Queue</h3>
              <span className="queue-count">{stats.total} photos</span>
              <span className="queue-size">{formatFileSize(stats.totalSize)}</span>
            </div>
            <button 
              onClick={clearAll} 
              className="clear-btn" 
              disabled={uploading && !uploadCancelRef.current}
            >
              {uploading ? '🛑 Cancel Upload' : '🗑️ Clear All'}
            </button>
          </div>

          {/* Stats Bar */}
          {stats.total > 0 && (
            <div className="queue-stats-bar">
              {stats.pending > 0 && (
                <div className="stat-item pending">
                  <span className="stat-icon">⏳</span>
                  <span className="stat-label">Pending: {stats.pending}</span>
                </div>
              )}
              {stats.completed > 0 && (
                <div className="stat-item completed">
                  <span className="stat-icon">✅</span>
                  <span className="stat-label">Uploaded: {stats.completed}</span>
                </div>
              )}
              {stats.error > 0 && (
                <div className="stat-item error">
                  <span className="stat-icon">❌</span>
                  <span className="stat-label">Failed: {stats.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Photo Grid */}
          <div className="queue-grid">
            {uploadQueue.map(item => (
              <div key={item.id} className={`queue-item status-${item.status}`}>
                <div className="item-thumbnail">
                  <img src={item.thumbnail} alt={item.file.name} />
                  
                  {/* Status Badges */}
                  {item.status === 'uploading' && (
                    <div className="status-badge uploading">
                      <div className="spinner-small"></div>
                    </div>
                  )}
                  {item.status === 'completed' && (
                    <div className="status-badge completed">✓</div>
                  )}
                  {item.status === 'error' && (
                    <div className="status-badge error">✕</div>
                  )}
                </div>
                
                <div className="item-details">
                  <span className="item-name" title={item.file.name}>
                    {item.file.name}
                  </span>
                  <span className="item-size">{formatFileSize(item.file.size)}</span>
                </div>

                {/* Progress Bar */}
                {item.status === 'uploading' && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${item.progress}%` }}
                    >
                      <span className="progress-text">{item.progress}%</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {item.status === 'error' && (
                  <div className="item-error">{item.error}</div>
                )}

                {/* Remove Button */}
                {item.status === 'pending' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.id);
                    }} 
                    className="remove-btn"
                    title="Remove photo"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload Actions */}
          <div className="upload-actions">
            {uploadError && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                <span>{uploadError}</span>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                <div className="success-content">
                  <strong>Upload successful!</strong>
                  {processingInfo && (
                    <p className="processing-info">
                      🤖 Processing {processingInfo.uploaded} photos... 
                      Estimated time: {processingInfo.estimatedTime}
                    </p>
                  )}
                  <p>Redirecting to preview page...</p>
                </div>
              </div>
            )}
            
            <button 
              onClick={handleUpload}
              disabled={uploading || stats.pending === 0 || !selectedEvent}
              className="upload-btn"
            >
              {uploading 
                ? (
                  <>
                    <span className="btn-spinner"></span>
                    Uploading... {stats.completed}/{stats.total}
                  </>
                )
                : (
                  <>
                    📤 Upload {stats.pending} Photo{stats.pending !== 1 ? 's' : ''}
                  </>
                )
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
