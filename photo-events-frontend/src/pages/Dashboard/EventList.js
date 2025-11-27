import React, { useState } from 'react';
import './EventList.css';

const EventList = ({ events = [], loading = false, selectedEvent, onEventSelect, onEventUpdate, onEventDelete }) => {
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { color: '#10b981', bg: '#d1fae5', text: 'Active', icon: '●' };
      case 'completed':
        return { color: '#6366f1', bg: '#e0e7ff', text: 'Completed', icon: '✓' };
      case 'upcoming':
        return { color: '#f59e0b', bg: '#fef3c7', text: 'Upcoming', icon: '○' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', text: 'Draft', icon: '•' };
    }
  };

  const copyRegistrationLink = (qrCode, e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/register/${qrCode}`;
    navigator.clipboard.writeText(link);

    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = '✓ Registration link copied to clipboard!';
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2500);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;

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

      return sortOrder === 'asc' ? 
        (aValue > bValue ? 1 : -1) : 
        (aValue < bValue ? 1 : -1);
    });

  if (loading && events.length === 0) {
    return (
      <div className="event-list-loading">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="event-list-empty">
        <div className="empty-icon">📅</div>
        <h3>No Events Yet</h3>
        <p>Create your first event to get started with PhotoManEa</p>
        <a href="/dashboard/create" className="btn btn-primary">
          + Create Your First Event
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
            Showing {filteredEvents.length} of {events.length} events
          </p>
        </div>

        <div className="header-right">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Events ({events.length})</option>
            <option value="upcoming">
              Upcoming ({events.filter(e => e.status === 'upcoming').length})
            </option>
            <option value="active">
              Active ({events.filter(e => e.status === 'active').length})
            </option>
            <option value="completed">
              Completed ({events.filter(e => e.status === 'completed').length})
            </option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="registrations">Registrations</option>
            <option value="photos">Photos</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-toggle"
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
          const isSelected = selectedEvent?._id === event._id;
          
          return (
            <div
              key={event._id}
              className={`event-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onEventSelect && onEventSelect(event)}
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

              {/* Event Info */}
              <div className="event-info">
                <h3 className="event-title">{event.name}</h3>
                <p className="event-date">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                  </svg>
                  {formatDate(event.date)}
                </p>
                {event.description && (
                  <p className="event-description">
                    {event.description.length > 80 
                      ? `${event.description.substring(0, 80)}...` 
                      : event.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="event-stats">
                <div className="stat-item">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>{event.registrationCount || 0}</span>
                </div>
                <div className="stat-item">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                  <span>{event.photosUploaded || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="event-actions">
                <button
                  className="btn-action btn-primary"
                  onClick={(e) => copyRegistrationLink(event.qrCode, e)}
                  title="Copy registration link"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                    <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                  </svg>
                  Copy Link
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventList;
