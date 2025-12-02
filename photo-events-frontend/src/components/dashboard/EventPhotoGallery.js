import React, { useState, useEffect, useCallback } from 'react';
import { photoAPI } from '../../services/api';
import './EventPhotoGallery.css';

const EventPhotoGallery = ({ event }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fetchPhotos = useCallback(async () => {
    if (!event || !event._id) return;
    
    try {
      setLoading(true);
      const response = await photoAPI.getByEvent(event._id);
      setPhotos(response.data?.data?.photos || []);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  }, [event]);

  const fetchStats = useCallback(async () => {
    if (!event || !event._id) return;
    
    try {
      const response = await photoAPI.getStats(event._id);
      setStats(response.data?.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [event]);

  useEffect(() => {
    fetchPhotos();
    fetchStats();
  }, [fetchPhotos, fetchStats]);

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await photoAPI.delete(photoId);
      setPhotos(photos.filter(p => p._id !== photoId));
      fetchStats();
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo');
    }
  };

  if (loading && photos.length === 0) {
    return <div className="gallery-loading">Loading photos...</div>;
  }

  return (
    <div className="event-photo-gallery">
      <div className="gallery-header">
        <h2>📸 Event Photos</h2>
        {stats && (
          <div className="gallery-stats">
            <span className="stat-item">
              📊 Total: <strong>{stats.totalPhotos}</strong>
            </span>
            <span className="stat-item">
              ✅ Processed: <strong>{stats.processedPhotos}</strong>
            </span>
            <span className="stat-item">
              👤 With Faces: <strong>{stats.photosWithFaces}</strong>
            </span>
            <span className="stat-item">
              🎭 Total Faces: <strong>{stats.totalFaces}</strong>
            </span>
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="gallery-empty">
          <p>No photos uploaded yet</p>
          <p className="empty-hint">Upload photos to see them here</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div key={photo._id} className="photo-card">
              <div className="photo-image-container">
                <img
                  src={photo.url}
                  alt={photo.filename}
                  onClick={() => setSelectedPhoto(photo)}
                />
                {photo.processed && photo.faces && photo.faces.length > 0 && (
                  <div className="photo-badge">
                    👤 {photo.faces.length} face{photo.faces.length !== 1 ? 's' : ''}
                  </div>
                )}
                {!photo.processed && (
                  <div className="photo-badge processing">Processing...</div>
                )}
              </div>
              <div className="photo-info">
                <p className="photo-filename">{photo.filename}</p>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(photo._id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPhoto(null)}>
              ✕
            </button>
            <img src={selectedPhoto.url} alt={selectedPhoto.filename} />
            <div className="modal-info">
              <p><strong>Filename:</strong> {selectedPhoto.filename}</p>
              <p><strong>Uploaded:</strong> {new Date(selectedPhoto.uploadedAt).toLocaleString()}</p>
              {selectedPhoto.faces && (
                <p><strong>Faces Detected:</strong> {selectedPhoto.faces.length}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPhotoGallery;
