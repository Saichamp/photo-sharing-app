import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
//import './GuestGallery.css';

const GuestGallery = () => {
  const { registrationId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [registration, setRegistration] = useState(null);

  const loadPhotos = useCallback(async () => {
    try {
      console.log('🔍 Fetching photos for registration:', registrationId);
      
      // ✅ NO TOKEN NEEDED - This is a public endpoint for guests
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/photos/matches/${registrationId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
            // No Authorization header needed for guest gallery
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📸 Photos received:', data);

      setPhotos(data.photos || []);
      setRegistration(data.registration || null);
      setError(null);
      setLoading(false);
      setProcessing(false);

    } catch (error) {
      console.error('❌ Failed to load photos:', error);
      setError(error.message);
      setLoading(false);
      setProcessing(false);
    }
  }, [registrationId]);

  if (loading) {
    return (
      <div className="guest-gallery-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading your photos...</h2>
          <p>Please wait while we fetch your images</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guest-gallery-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={loadPhotos} className="retry-btn">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="guest-gallery-container">
        <div className="processing-state">
          <div className="ai-icon">🤖</div>
          <h2>AI is processing photos...</h2>
          <p>Our face recognition AI is analyzing event photos.</p>
          <p>This usually takes 10-30 seconds. Please wait...</p>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-gallery-container">
      {/* Header */}
      <div className="gallery-header">
        <div className="header-content">
          <h1>📸 Your Event Photos</h1>
          {registration && (
            <p className="welcome-text">
              Welcome, <strong>{registration.name}</strong>! 
              {photos.length > 0 ? ` We found ${photos.length} photos with you in them! 🎉` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h2>No Photos Found Yet</h2>
          <p>The organizer hasn't uploaded photos yet, or you might not be in any photos.</p>
          <p className="hint">💡 Check back in a few moments!</p>
          <button onClick={loadPhotos} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="photos-grid">
          {photos.map((photo) => (
            <div key={photo._id} className="photo-card">
              <div className="photo-wrapper">
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${photo.path}`}
                  alt={photo.filename}
                  className="photo-image"
                  loading="lazy"
                />
                {photo.similarity && (
                  <div className="match-badge">
                    {Math.round(photo.similarity * 100)}% match
                  </div>
                )}
              </div>
              <div className="photo-info">
                <p className="photo-date">
                  {new Date(photo.uploadedAt || photo.createdAt).toLocaleDateString()}
                </p>
              </div>
              <a
                href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${photo.path}`}
                download
                className="download-btn"
              >
                ⬇️ Download
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {photos.length > 0 && (
        <div className="gallery-footer">
          <button onClick={loadPhotos} className="refresh-btn">
            🔄 Refresh Gallery
          </button>
          <p className="footer-note">
            Found {photos.length} photo{photos.length !== 1 ? 's' : ''} • 
            Powered by AI Face Recognition 🤖
          </p>
        </div>
      )}
    </div>
  );
};

export default GuestGallery;
