import React, { useState, useEffect, useCallback } from 'react';  // ✅ Add useCallback
import { useParams, useNavigate } from 'react-router-dom';
import { photoAPI, eventAPI } from '../../services/api';
import './PhotoPreview.css';

const PhotoPreview = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, processed: 0, withFaces: 0, processing: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ WRAP loadData in useCallback
  const loadData = useCallback(async () => {
    try {
      const [eventRes, photosRes] = await Promise.all([
        eventAPI.getById(eventId),
        photoAPI.getAllPhotos(eventId)
      ]);
      
      setEvent(eventRes.data.data || eventRes.data);
      const allPhotos = photosRes.data.data?.photos || photosRes.data.photos || [];
      setPhotos(allPhotos);
      
      // Calculate stats
      const total = allPhotos.length;
      const processed = allPhotos.filter(p => p.processed).length;
      const processing = total - processed;
      const withFaces = allPhotos.filter(p => p.processed && p.faceCount > 0).length;
      
      setStats({ total, processed, withFaces, processing });
      
      // Check if still processing
      setIsProcessing(processing > 0);
      
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]); // ✅ Add eventId as dependency

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 3 seconds while processing
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [loadData]); // ✅ Add loadData as dependency

  const retryFailedPhotos = async () => {
    const failedPhotos = photos.filter(p => p.processed && p.processingError);
    
    if (failedPhotos.length === 0) {
      alert('No failed photos to retry');
      return;
    }

    if (!window.confirm(`Retry processing ${failedPhotos.length} failed photos?`)) {
      return;
    }

    for (const photo of failedPhotos) {
      try {
        await photoAPI.processPhoto(photo.id);
      } catch (err) {
        console.error(`Failed to reprocess ${photo.filename}:`, err);
      }
    }
    
    alert('✅ Retry started! Refresh in a few moments.');
    setTimeout(loadData, 2000);  // ✅ Now this works!
  };

  const deletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;

    try {
      await photoAPI.deletePhoto(photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
      alert('Photo deleted');
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  const getProgressPercentage = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.processed / stats.total) * 100);
  };

  if (loading) {
    return (
      <div className="photo-preview-loading">
        <div className="spinner"></div>
        <p>Loading photos...</p>
      </div>
    );
  }

  return (
    <div className="photo-preview-container">
      {/* Header */}
      <div className="photo-preview-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>{event?.name || 'Event Photos'}</h1>
      </div>

      {/* Processing Status Banner */}
      {isProcessing && (
        <div className="processing-banner">
          <div className="processing-banner-content">
            <div className="processing-icon">🤖</div>
            <div className="processing-info">
              <h3>AI Processing in Progress...</h3>
              <p>Processing {stats.processing} of {stats.total} photos. This may take a few minutes.</p>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  <span className="progress-text">{getProgressPercentage()}%</span>
                </div>
              </div>
            </div>
            <div className="processing-spinner"></div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="photo-stats-bar">
        <div className="stat-card">
          <span className="stat-icon">📷</span>
          <div className="stat-info">
            <span className="stat-label">Total Photos</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-label">Processed</span>
            <span className="stat-value">{stats.processed}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <span className="stat-icon">👤</span>
          <div className="stat-info">
            <span className="stat-label">With Faces</span>
            <span className="stat-value">{stats.withFaces}</span>
          </div>
        </div>
        
        {isProcessing && (
          <div className="stat-card processing-stat">
            <span className="stat-icon">⏳</span>
            <div className="stat-info">
              <span className="stat-label">Processing</span>
              <span className="stat-value">{stats.processing}</span>
            </div>
          </div>
        )}

        {!isProcessing && photos.filter(p => p.processingError).length > 0 && (
          <button onClick={retryFailedPhotos} className="retry-btn">
            🔄 Retry Failed
          </button>
        )}
      </div>

      {/* Photo Grid */}
      <div className="photo-preview-grid">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className={`photo-preview-item ${!photo.processed ? 'processing' : ''}`}
          >
            <img 
              src={photo.url} 
              alt={photo.filename}
              loading="lazy"
            />
            
            {/* Processing Overlay */}
            {!photo.processed && (
              <div className="processing-overlay">
                <div className="processing-spinner-small"></div>
                <span>Processing...</span>
              </div>
            )}

            {/* Info Overlay (on hover) */}
            <div className="photo-overlay">
              <div className="photo-info">
                <span className="photo-filename" title={photo.filename}>
                  {photo.filename}
                </span>
                
                {photo.processed && !photo.processingError && (
                  <>
                    <span className="photo-status processed">
                      ✓ Processed
                    </span>
                    {photo.faceCount > 0 && (
                      <span className="face-count">
                        👤 {photo.faceCount} {photo.faceCount === 1 ? 'face' : 'faces'}
                      </span>
                    )}
                    {photo.matchCount > 0 && (
                      <span className="match-count">
                        🎯 {photo.matchCount} {photo.matchCount === 1 ? 'match' : 'matches'}
                      </span>
                    )}
                  </>
                )}
                
                {photo.processingError && (
                  <span className="photo-status error">
                    ❌ {photo.processingError}
                  </span>
                )}
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deletePhoto(photo.id);
                }}
                className="delete-photo-btn"
                title="Delete photo"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="no-photos-message">
          <div className="empty-state-icon">📷</div>
          <h2>No photos uploaded yet</h2>
          <p>Upload photos to start AI-powered face matching</p>
          <button onClick={() => navigate('/upload')} className="upload-btn">
            📤 Upload Photos
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoPreview;
