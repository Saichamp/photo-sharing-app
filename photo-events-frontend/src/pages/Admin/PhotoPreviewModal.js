/**
 * Photo Preview Modal
 * View photo details, faces detected, and metadata
 */

import React from 'react';
import './PhotoPreviewModal.css';

const PhotoPreviewModal = ({ photo, onClose, onDelete }) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Download photo
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `${API_URL.replace('/api', '')}${photo.url}`;
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="photo-modal-overlay" onClick={onClose}>
      <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="photo-modal-header">
          <h2>📸 Photo Details</h2>
          <button className="close-btn" onClick={onClose}>
            ❌
          </button>
        </div>

        <div className="photo-modal-body">
          {/* Photo Preview */}
          <div className="photo-preview-section">
            <img 
              src={`${API_URL.replace('/api', '')}${photo.url}`}
              alt={photo.filename}
              className="preview-image"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
              }}
            />
          </div>

          {/* Photo Information */}
          <div className="photo-details-section">
            <div className="detail-group">
              <h3>📋 Basic Information</h3>
              <div className="detail-item">
                <span className="detail-label">Event:</span>
                <span className="detail-value">
                  🎉 {photo.event?.name || 'Unknown Event'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Filename:</span>
                <span className="detail-value">{photo.filename}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">File Size:</span>
                <span className="detail-value">{formatFileSize(photo.size || 0)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Uploaded:</span>
                <span className="detail-value">{formatDate(photo.uploadedAt)}</span>
              </div>
            </div>

            {/* Face Detection Info */}
            <div className="detail-group">
              <h3>👤 Face Detection</h3>
              <div className="faces-stats">
                <div className="face-stat-box">
                  <span className="face-stat-icon">😊</span>
                  <div className="face-stat-info">
                    <span className="face-stat-value">{photo.facesDetected || 0}</span>
                    <span className="face-stat-label">Faces Detected</span>
                  </div>
                </div>
                
                {photo.faces && photo.faces.length > 0 && (
                  <div className="faces-list">
                    {photo.faces.map((face, index) => (
                      <div key={index} className="face-item">
                        <span className="face-number">Face #{index + 1}</span>
                        <div className="face-details">
                          {face.age && <span>Age: ~{face.age}</span>}
                          {face.gender && <span>Gender: {face.gender}</span>}
                          {face.confidence && (
                            <span>Confidence: {(face.confidence * 100).toFixed(1)}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upload Info */}
            <div className="detail-group">
              <h3>📤 Upload Information</h3>
              <div className="detail-item">
                <span className="detail-label">Uploaded By:</span>
                <span className="detail-value">
                  {photo.uploadedBy?.name || 'System'}
                </span>
              </div>
              {photo.processedAt && (
                <div className="detail-item">
                  <span className="detail-label">Processed:</span>
                  <span className="detail-value">{formatDate(photo.processedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="photo-modal-footer">
          <button className="btn btn-secondary" onClick={handleDownload}>
            💾 Download
          </button>
          <button 
            className="btn btn-danger"
            onClick={() => onDelete(photo._id)}
          >
            🗑️ Delete Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoPreviewModal;
