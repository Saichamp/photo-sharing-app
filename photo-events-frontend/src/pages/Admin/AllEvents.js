/**
 * All Events Management Page
 * Admin can view all events from all organizers and delete them
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { 
  requireAdmin, 
  formatNumber
} from '../../utils/adminHelper';
import './AllEvents.css';

const AllEvents = () => {
  const navigate = useNavigate();
  
  // State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Pagination
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0
  });

  // ✅ FIXED: Use useCallback to memoize fetchEvents
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllEvents(filters);
      setEvents(response.data.data.events);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ✅ Check admin access on mount
  useEffect(() => {
    if (!requireAdmin(navigate)) return;
  }, [navigate]);

  // ✅ Fetch events when filters change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      setActionLoading(true);
      await adminAPI.deleteEvent(selectedEvent._id);
      setShowDeleteModal(false);
      setSelectedEvent(null);
      await fetchEvents();
      alert('Event deleted successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setSelectedEvent(null);
    setShowDeleteModal(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Active', className: 'badge-success' },
      completed: { text: 'Completed', className: 'badge-secondary' },
      cancelled: { text: 'Cancelled', className: 'badge-danger' }
    };
    return badges[status] || badges.active;
  };

  if (loading && events.length === 0) {
    return (
      <div className="all-events">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="all-events">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>🎉 All Events</h1>
          <p className="subtitle">
            View and manage events from all organizers
          </p>
        </div>
        <button onClick={fetchEvents} className="btn-refresh" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-box">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(pagination.totalEvents)}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">
              {formatNumber(events.filter(e => e.status === 'active').length)}
            </div>
            <div className="stat-label">Active Events</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">📸</div>
          <div className="stat-content">
            <div className="stat-value">
              {formatNumber(events.reduce((sum, e) => sum + (e.photoCount || 0), 0))}
            </div>
            <div className="stat-label">Total Photos</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">
              {formatNumber(events.reduce((sum, e) => sum + (e.registrationCount || 0), 0))}
            </div>
            <div className="stat-label">Total Guests</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-grid">
          {/* Search */}
          <div className="filter-group">
            <label>🔍 Search</label>
            <input
              type="text"
              placeholder="Search by event name..."
              value={filters.search}
              onChange={handleSearch}
              className="filter-input"
            />
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>📊 Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="results-info">
          Showing {events.length} of {formatNumber(pagination.totalEvents)} events
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Events Grid */}
      {events.length > 0 ? (
        <>
          <div className="events-grid">
            {events.map((event) => {
              const statusBadge = getStatusBadge(event.status);
              const eventDate = new Date(event.date);
              const isPast = eventDate < new Date();

              return (
                <div key={event._id} className="event-card">
                  {/* Event Header */}
                  <div className="event-header">
                    <div className="event-title-section">
                      <h3 className="event-title">{event.name}</h3>
                      <span className={`badge ${statusBadge.className}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <button
                      onClick={() => openDeleteModal(event)}
                      className="btn-delete-small"
                      title="Delete Event"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Event Meta */}
                  <div className="event-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span className="meta-text">
                        {eventDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {isPast && <span className="past-badge">Past</span>}
                    </div>

                    {event.location && (
                      <div className="meta-item">
                        <span className="meta-icon">📍</span>
                        <span className="meta-text">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Organizer Info */}
                  <div className="organizer-info">
                    <div className="organizer-avatar">
                      {event.organizer?.name?.charAt(0).toUpperCase() || 'O'}
                    </div>
                    <div className="organizer-details">
                      <div className="organizer-name">
                        {event.organizer?.name || 'Unknown'}
                      </div>
                      <div className="organizer-email">
                        {event.organizer?.email || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Event Stats */}
                  <div className="event-stats">
                    <div className="stat-item">
                      <div className="stat-icon-small">📸</div>
                      <div className="stat-details">
                        <div className="stat-number">{event.photoCount || 0}</div>
                        <div className="stat-text">Photos</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon-small">👥</div>
                      <div className="stat-details">
                        <div className="stat-number">{event.registrationCount || 0}</div>
                        <div className="stat-text">Guests</div>
                      </div>
                    </div>
                  </div>

                  {/* Event Description */}
                  {event.description && (
                    <div className="event-description">
                      {event.description.length > 100
                        ? `${event.description.substring(0, 100)}...`
                        : event.description}
                    </div>
                  )}

                  {/* QR Code Info */}
                  <div className="qr-info">
                    <span className="qr-label">QR Code:</span>
                    <code className="qr-code">{event.qrCode}</code>
                  </div>

                  {/* Footer */}
                  <div className="event-footer">
                    <div className="created-date">
                      Created {new Date(event.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1 || loading}
                className="pagination-btn"
              >
                ← Previous
              </button>

              <div className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.totalPages || loading}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No events found</h3>
          <p>No events have been created yet</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Delete Event</h3>
              <button onClick={closeDeleteModal} className="modal-close">
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete this event?</p>
              <div className="event-delete-info">
                <strong>{selectedEvent.name}</strong>
                <span>by {selectedEvent.organizer?.name}</span>
                <span className="event-date">
                  {new Date(selectedEvent.date).toLocaleDateString()}
                </span>
              </div>
              <div className="warning-box">
                <strong>⚠️ Warning:</strong> This will permanently delete:
                <ul>
                  <li>Event details and settings</li>
                  <li>{selectedEvent.photoCount || 0} photos</li>
                  <li>{selectedEvent.registrationCount || 0} guest registrations</li>
                  <li>QR code and access links</li>
                </ul>
                <strong>This action cannot be undone!</strong>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={closeDeleteModal}
                className="btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                className="btn-danger"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllEvents;
