import React, { useState } from 'react';
import './EventList.css';

const EventList = ({ events = [], loading = false, onEventUpdate, onEventDelete }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { color: 'var(--success-500)', bg: 'var(--success-50)', text: 'Active', icon: '✓' };
      case 'completed':
        return { color: 'var(--primary-500)', bg: 'var(--primary-50)', text: 'Completed', icon: '✓' };
      case 'upcoming':
        return { color: 'var(--accent-500)', bg: 'var(--accent-50)', text: 'Upcoming', icon: '○' };
      default:
        return { color: 'var(--neutral-500)', bg: 'var(--neutral-100)', text: 'Unknown', icon: '?' };
    }
  };

  const copyQRCode = (qrCode) => {
    const registrationUrl = `${window.location.origin}/register/${qrCode}`;
    navigator.clipboard.writeText(registrationUrl);

    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = '✅ Registration link copied!';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter and sort events
  const filteredEvents = events
    .filter(event => filterStatus === 'all' || event.status === filterStatus)
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'registrations':
          aValue = a.registrationCount || 0;
          bValue = b.registrationCount || 0;
          break;
        case 'photos':
          aValue = a.photosUploaded || 0;
          bValue = b.photosUploaded || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // ✅ Show loading state
  if (loading && events.length === 0) {
    return (
      <div className="event-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  // ✅ Show empty state
  if (!events || events.length === 0) {
    return (
      <div className="event-list-empty">
        <div className="empty-icon">📅</div>
        <h3>No events yet</h3>
        <p>Create your first event to get started!</p>
        <a href="/dashboard/create" className="btn btn-primary">
          Create Your First Event
        </a>
      </div>
    );
  }

  return (
    <div className="event-list-container">
      {/* Header with Filters */}
      <div className="event-list-header">
        <div className="header-left">
          <h2>My Events</h2>
          <p className="subtitle">
            {filteredEvents.length} of {events.length} events
          </p>
        </div>

        <div className="header-right">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Events ({events.length})</option>
            <option value="upcoming">Upcoming ({events.filter(e => e.status === 'upcoming').length})</option>
            <option value="active">Active ({events.filter(e => e.status === 'active').length})</option>
            <option value="completed">Completed ({events.filter(e => e.status === 'completed').length})</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="registrations">Sort by Registrations</option>
            <option value="photos">Sort by Photos</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Event Grid */}
      <div className="event-grid">
        {filteredEvents.map((event) => {
          const statusConfig = getStatusConfig(event.status);
          
          return (
            <div
              key={event._id}
              className={`event-card ${selectedEvent?._id === event._id ? 'selected' : ''}`}
              onClick={() => setSelectedEvent(event)}
            >
              {/* Status Badge */}
              <div 
                className="event-status"
                style={{ 
                  background: statusConfig.bg, 
                  color: statusConfig.color 
                }}
              >
                <span className="status-icon">{statusConfig.icon}</span>
                {statusConfig.text}
              </div>

              {/* Event Header */}
              <div className="event-header">
                <h3 className="event-title">{event.name}</h3>
                <p className="event-date">{formatDate(event.date)}</p>
              </div>

              {/* Event Description */}
              {event.description && (
                <p className="event-description">
                  {event.description.length > 100
                    ? `${event.description.substring(0, 100)}...`
                    : event.description}
                </p>
              )}

              {/* Event Stats */}
              <div className="event-stats">
                <div className="stat">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>{event.registrationCount || 0} Guests</span>
                </div>
                <div className="stat">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                  <span>{event.photosUploaded || 0} Photos</span>
                </div>
              </div>

              {/* Registration Link */}
              {event.qrCode && (
                <div className="event-link-section">
                  <button
                    className="btn-copy-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyQRCode(event.qrCode);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy Registration Link
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventList;
