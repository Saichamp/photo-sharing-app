/**
 * Admin Event Management Page
 * View, search, filter, edit, and manage all events
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import EventDetailsModal from './EventDetailsModal';
import './ManageEvents.css';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    cancelled: 0
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchTerm,
          status: statusFilter,
          page: currentPage,
          limit: 10
        }
      });

      if (response.data.success) {
        setEvents(response.data.data.events);
        setTotalPages(response.data.data.pagination.totalPages);
        
        // Update stats
        if (response.data.data.stats) {
          setStats(response.data.data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [API_URL, currentPage, searchTerm, statusFilter]);

  // Fetch events on mount and when filters change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This will delete all photos, registrations, and data. This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  // Open event details modal
  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-draft';
    }
  };

  return (
    <div className="manage-events-container">
      <div className="manage-events-header">
        <div className="header-left">
          <h1>🎉 Manage Events</h1>
          <p>View and manage all events across the platform</p>
        </div>
        <div className="header-stats">
          <div className="stat-card active">
            <span className="stat-label">Active</span>
            <span className="stat-value">{stats.active || 0}</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{stats.completed || 0}</span>
          </div>
          <div className="stat-card cancelled">
            <span className="stat-label">Cancelled</span>
            <span className="stat-value">{stats.cancelled || 0}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by event name or organizer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔧 Filters {statusFilter && '(Active)'}
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="filter-options">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button className="clear-filters-btn" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Events Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No Events Found</h3>
          <p>No events match your search criteria</p>
        </div>
      ) : (
        <>
          <div className="events-table-container">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Organizer</th>
                  <th>Date</th>
                  <th>Registrations</th>
                  <th>Photos</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id}>
                    <td>
                      <div className="event-name-cell">
                        <span className="event-name">{event.name}</span>
                        <span className="event-location">📍 {event.location}</span>
                      </div>
                    </td>
                    <td>
                      <div className="organizer-cell">
                        <div className="organizer-avatar">
                          {event.organizer?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span>{event.organizer?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{formatDate(event.date)}</td>
                    <td>
                      <span className="count-badge">
                        {event.registrationCount || 0}
                      </span>
                    </td>
                    <td>
                      <span className="count-badge">
                        {event.photoCount || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(event.status)}`}>
                        {event.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view"
                          onClick={() => handleViewEvent(event)}
                          title="View Details"
                        >
                          👁️
                        </button>

                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteEvent(event._id)}
                          title="Delete Event"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Event Details Modal */}
      {showModal && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
          }}
          onUpdate={fetchEvents}
        />
      )}
    </div>
  );
};

export default ManageEvents;
