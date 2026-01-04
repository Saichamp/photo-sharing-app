import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import './EventList.css';

const EventList = ({ events = [], onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [deleteModal, setDeleteModal] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);

  // Format date helpers
  const getRelativeTime = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const createdDate = new Date(date);
    if (isNaN(createdDate.getTime())) return 'Unknown';
    
    const diffMs = now - createdDate;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getDaysUntil = (date) => {
    if (!date) return 'No date set';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) return 'Invalid Date';
    eventDate.setHours(0, 0, 0, 0);
    
    const diffMs = eventDate - now;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 0) return 'Past event';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days away`;
  };

  // Get status badge
  const getStatusBadge = (event) => {
    const now = new Date();
    const eventDate = new Date(event.eventDate);
    
    if (isNaN(eventDate.getTime())) {
      return { icon: '🟡', label: 'UPCOMING', class: 'status-upcoming' };
    }
    
    const diffDays = Math.floor((eventDate - now) / 86400000);
    
    if (diffDays < 0) {
      return { icon: '✅', label: 'COMPLETED', class: 'status-completed' };
    } else if (diffDays === 0 || diffDays === 1) {
      return { icon: '🔵', label: 'ACTIVE', class: 'status-active' };
    } else {
      return { icon: '🟡', label: 'UPCOMING', class: 'status-upcoming' };
    }
  };

  // Calculate upload progress
  const getUploadProgress = (photosUploaded) => {
    if (!photosUploaded || photosUploaded === 0) return 0;
    if (photosUploaded < 10) return (photosUploaded / 10) * 100;
    if (photosUploaded < 50) return 50 + ((photosUploaded - 10) / 40) * 30;
    return Math.min(100, 80 + (photosUploaded - 50) / 10);
  };

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getStatusBadge(event).label.toLowerCase();
      const matchesFilter = filterStatus === 'all' || status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.eventDate) - new Date(a.eventDate);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'guests') {
        return (b.registrationCount || 0) - (a.registrationCount || 0);
      }
      return 0;
    });

    return filtered;
  }, [events, searchTerm, filterStatus, sortBy]);

  // Copy registration link
  const handleCopyLink = async (event) => {
    const registrationUrl = `${window.location.origin}/register/${event.qrCode}`;
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopySuccess(event._id);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Delete event
  const handleDelete = async (eventId) => {
    try {
      await eventAPI.delete(eventId);
      setDeleteModal(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  return (
    <div className="event-list-wrapper">
      <div className="event-list-container">
        {/* Header */}
        <div className="event-list-header">
          <div className="header-left">
            <h2 className="event-list-title">
              📅 My Events ({filteredEvents.length})
            </h2>
            <p className="event-list-subtitle">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          </div>
          <Link to="/dashboard/create" className="btn-create-event">
            <span>➕</span>
            <span>Create Event</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="event-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Events ({events.length})</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="guests">Sort by Guests</option>
          </select>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No events found</h3>
            <p>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first event to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link to="/dashboard/create" className="btn-empty-create">
                Create Your First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="events-list">
            {filteredEvents.map((event) => {
              const status = getStatusBadge(event);
              const progress = getUploadProgress(event.photosUploaded || 0);

              return (
                <div key={event._id} className="event-card">
                  {/* Header */}
                  <div className="event-card-header">
                    <div className="event-header-left">
                      <span className={`status-badge ${status.class}`}>
                        <span className="status-icon">{status.icon}</span>
                        <span className="status-label">{status.label}</span>
                      </span>
                      <h3 className="event-name">{event.name}</h3>
                    </div>
                    <div className="event-header-actions">
                      <button
                        onClick={() => handleCopyLink(event)}
                        className={`btn-icon ${copySuccess === event._id ? 'success' : ''}`}
                        title="Copy registration link"
                      >
                        {copySuccess === event._id ? '✓' : '🔗'}
                      </button>
                      <Link
                        to={`/dashboard/edit/${event._id}`}
                        className="btn-icon"
                        title="Edit event"
                      >
                        ✏️
                      </Link>
                      <button
                        onClick={() => setDeleteModal(event)}
                        className="btn-icon btn-delete"
                        title="Delete event"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="event-divider"></div>

                  {/* Meta Info */}
                  <div className="event-meta">
                    <span className="meta-item">
                      📅 {getDaysUntil(event.eventDate)}
                    </span>
                    <span className="meta-separator">•</span>
                    <span className="meta-item">
                      Created {getRelativeTime(event.createdAt)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="event-stats">
                    <div className="stat-item">
                      <span className="stat-icon">👥</span>
                      <span className="stat-text">{event.registrationCount || 0} guests</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📸</span>
                      <span className="stat-text">{event.photosUploaded || 0} photos</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">✅</span>
                      <span className="stat-text">{Math.round(progress)}% complete</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-section">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {Math.round(progress)}% uploaded
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="event-actions">
                    <button
                      onClick={() => handleCopyLink(event)}
                      className={`btn-action ${copySuccess === event._id ? 'success' : ''}`}
                    >
                      {copySuccess === event._id ? '✓ Copied' : '🔗 Copy Link'}
                    </button>
                    <Link
                      to={`/dashboard/edit/${event._id}`}
                      className="btn-action btn-edit"
                    >
                      ✏️ Edit Event
                    </Link>
                    <button
                      onClick={() => setDeleteModal(event)}
                      className="btn-action btn-delete-action"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Delete Event?</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>"{deleteModal.name}"</strong>?
              </p>
              <p className="modal-warning">
                This will permanently delete all photos, registrations, and data associated
                with this event. This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteModal(null)}
                className="btn-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal._id)}
                className="btn-modal-delete"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="toast-notification">
          ✓ Registration link copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default EventList;
