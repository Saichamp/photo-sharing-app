/**
 * Admin Photo Management Page
 * View, search, filter, and manage all photos
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PhotoPreviewModal from './PhotoPreviewModal';
import './ManagePhotos.css';

const ManagePhotos = () => {
  const [photos, setPhotos] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    withFaces: 0,
    withoutFaces: 0,
    totalSize: 0
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

  // Fetch photos
  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/admin/photos`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchTerm,
          event: eventFilter,
          page: currentPage,
          limit: 20
        }
      });

      if (response.data.success) {
        setPhotos(response.data.data.photos);
        setTotalPages(response.data.data.pagination.totalPages);

        if (response.data.data.stats) {
          setStats(response.data.data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      alert('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [API_URL, currentPage, searchTerm, eventFilter]);

  // Fetch events for filter
  const fetchEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });

      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [API_URL]);

  // Fetch data on mount
  useEffect(() => {
    fetchPhotos();
    fetchEvents();
  }, [fetchPhotos, fetchEvents]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Delete photo
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Photo deleted successfully');
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert(error.response?.data?.message || 'Failed to delete photo');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0) {
      alert('Please select photos to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedPhotos.length} photo(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/photos/bulk-delete`,
        { photoIds: selectedPhotos },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`${selectedPhotos.length} photo(s) deleted successfully`);
      setSelectedPhotos([]);
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photos:', error);
      alert(error.response?.data?.message || 'Failed to delete photos');
    }
  };

  // Toggle photo selection
  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Select all photos
  const toggleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map(p => p._id));
    }
  };

  // Open photo preview
  const handleViewPhoto = (photo) => {
    setSelectedPhoto(photo);
    setShowModal(true);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setEventFilter('');
    setCurrentPage(1);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // ✅ Get proper image URL
  const getImageUrl = (photo) => {
    const imagePath = photo.url || photo.path;
    if (!imagePath) return null;
    
    // If already full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Otherwise prepend base URL
    return `${BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  return (
    <div className="manage-photos-container">
      {/* Header */}
      <div className="manage-photos-header">
        <div className="header-left">
          <h1>📸 Photo Manager</h1>
          <p>View and manage all photos across events</p>
        </div>

        <div className="header-stats">
          <div className="stat-card total">
            <span className="stat-label">Total Photos</span>
            <span className="stat-value">{stats.total}</span>
          </div>

          <div className="stat-card faces">
            <span className="stat-label">With Faces</span>
            <span className="stat-value">{stats.withFaces}</span>
          </div>

          <div className="stat-card storage">
            <span className="stat-label">Storage</span>
            <span className="stat-value">{formatFileSize(stats.totalSize)}</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedPhotos.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-info">
            {selectedPhotos.length} photo(s) selected
          </span>
          <button onClick={handleBulkDelete} className="bulk-delete-btn">
            <span>🗑️</span> Delete Selected
          </button>
          <button onClick={() => setSelectedPhotos([])} className="bulk-clear-btn">
            ✖ Clear Selection
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="search-filter-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by event name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="filter-toggle-btn"
        >
          <span>🎛️</span> Filters
        </button>

        <button onClick={toggleSelectAll} className="select-all-btn">
          <span>{selectedPhotos.length === photos.length ? '☑' : '☐'}</span>
          {selectedPhotos.length === photos.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="filter-options">
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
            <option value="">All Events</option>
            {events.map(event => (
              <option key={event._id} value={event._id}>
                {event.name}
              </option>
            ))}
          </select>

          <button onClick={handleClearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      )}

      {/* Photos Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading photos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h3>No photos found</h3>
          <p>No photos match your search criteria</p>
        </div>
      ) : (
        <>
          <div className="photos-grid">
            {photos.map((photo) => (
              <div
                key={photo._id}
                className={`photo-card ${selectedPhotos.includes(photo._id) ? 'selected' : ''}`}
              >
                {/* Select Checkbox */}
                <div className="photo-select">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.includes(photo._id)}
                    onChange={() => togglePhotoSelection(photo._id)}
                  />
                </div>

                {/* ✅ FIXED: Photo Thumbnail with proper URL */}
                <div className="photo-thumbnail" onClick={() => handleViewPhoto(photo)}>
                  <img
                    src={getImageUrl(photo)}
                    alt={photo.filename}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="220"%3E%3Crect fill="%23ddd" width="280" height="220"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />

                  {/* Face Badge */}
                  {photo.facesDetected > 0 && (
                    <div className="face-badge">
                      👤 {photo.facesDetected}
                    </div>
                  )}
                </div>

                {/* Photo Info */}
                <div className="photo-info">
                  <div className="photo-event">
                    🎉 {photo.event?.name || 'Unknown Event'}
                  </div>

                  <div className="photo-meta">
                    <span className="photo-size">
                      📁 {formatFileSize(photo.size)}
                    </span>
                    <span className="photo-date">
                      📅 {new Date(photo.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Photo Actions */}
                <div className="photo-actions">
                  <button
                    onClick={() => handleViewPhoto(photo)}
                    className="action-btn view"
                    title="View Details"
                  >
                    👁️
                  </button>

                  <button
                    onClick={() => handleDeletePhoto(photo._id)}
                    className="action-btn delete"
                    title="Delete Photo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>

              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Photo Preview Modal */}
      {showModal && selectedPhoto && (
        <PhotoPreviewModal
          photo={selectedPhoto}
          onClose={() => {
            setShowModal(false);
            setSelectedPhoto(null);
          }}
          onDelete={handleDeletePhoto}
          getImageUrl={getImageUrl}
        />
      )}
    </div>
  );
};

export default ManagePhotos;
