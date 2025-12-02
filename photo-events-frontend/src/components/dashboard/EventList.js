import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import './EventList.css';

const EventList = ({ events, onRefresh }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [localEvents, setLocalEvents] = useState(events);

  // ✅ FIX: Sync with parent events and refresh
  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  // ✅ FIX: Auto-refresh every 5 seconds when on this page
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh) {
        console.log('🔄 Auto-refreshing events...');
        onRefresh();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [onRefresh]);

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { label: 'Upcoming', color: '#ff9800' },
      active: { label: 'Active', color: '#4caf50' },
      completed: { label: 'Completed', color: '#9e9e9e' }
    };
    
    const badge = badges[status] || badges.upcoming;
    
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: badge.color }}
      >
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleCardClick = (eventId) => {
    navigate(`/dashboard/events/${eventId}`);
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    if (!window.confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await eventAPI.delete(eventId);
      console.log('✅ Event deleted successfully');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  // Filter events
  const filteredEvents = localEvents.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date) - new Date(a.date);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="event-list-container">
      <div className="event-list-header">
        <h2>My Events</h2>
        <p>Showing {sortedEvents.length} of {localEvents.length} events</p>
      </div>

      {/* Filters */}
      <div className="event-filters">
        <div className="filter-group">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Events ({localEvents.length})</option>
            <option value="upcoming">
              Upcoming ({localEvents.filter(e => e.status === 'upcoming').length})
            </option>
            <option value="active">
              Active ({localEvents.filter(e => e.status === 'active').length})
            </option>
            <option value="completed">
              Completed ({localEvents.filter(e => e.status === 'completed').length})
            </option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
          </select>
        </div>

        <button 
          className="refresh-btn"
          onClick={() => onRefresh && onRefresh()}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Event Grid */}
      {sortedEvents.length === 0 ? (
        <div className="no-events">
          <div className="no-events-icon">📅</div>
          <h3>No events found</h3>
          <p>
            {filter === 'all' 
              ? "Create your first event to get started!" 
              : `No ${filter} events found.`}
          </p>
        </div>
      ) : (
        <div className="event-grid">
          {sortedEvents.map((event) => (
            <div 
              key={event._id} 
              className="event-card"
              onClick={() => handleCardClick(event._id)}
            >
              <div className="event-card-header">
                <h3>{event.name}</h3>
                {getStatusBadge(event.status)}
              </div>

              <div className="event-card-body">
                <div className="event-info-row">
                  <span className="info-icon">📅</span>
                  <span className="info-text">{formatDate(event.date)}</span>
                </div>

                <div className="event-info-row">
                  <span className="info-icon">📍</span>
                  <span className="info-text">{event.location}</span>
                </div>

                <div className="event-stats">
                  <div className="stat-item">
                    <span className="stat-icon">👥</span>
                    <div className="stat-content">
                      <strong>{event.registrationCount || 0}</strong>
                      <span>Guests</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <span className="stat-icon">📸</span>
                    <div className="stat-content">
                      <strong>{event.photosUploaded || 0}</strong>
                      <span>Photos</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="event-card-footer">
                <button 
                  className="card-action-btn view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/events/${event._id}`);
                  }}
                >
                  👁️ View Details
                </button>

                <button 
                  className="card-action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(event._id, event.name);
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
