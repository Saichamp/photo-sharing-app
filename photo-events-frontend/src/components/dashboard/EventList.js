/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import './EventList.css';

const EventList = ({ events, onEventUpdate }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { 
          color: 'var(--success-500)', 
          bg: 'var(--success-50)', 
          text: 'Active',
          icon: '🟢'
        };
      case 'completed':
        return { 
          color: 'var(--primary-500)', 
          bg: 'var(--primary-50)', 
          text: 'Completed',
          icon: '✅'
        };
      case 'upcoming':
        return { 
          color: 'var(--accent-500)', 
          bg: 'var(--accent-50)', 
          text: 'Upcoming',
          icon: '🕒'
        };
      default:
        return { 
          color: 'var(--neutral-500)', 
          bg: 'var(--neutral-100)', 
          text: 'Unknown',
          icon: '⚪'
        };
    }
  };

  const copyQRCode = (qrCode) => {
    const registrationUrl = `${window.location.origin}/register/${qrCode}`;
    navigator.clipboard.writeText(registrationUrl);
    
    // Premium notification instead of alert
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = '✅ Registration link copied!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredEvents = events.filter(event => {
    if (filterStatus === 'all') return true;
    return event.status === filterStatus;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (events.length === 0) {
    return (
      <div className="event-list-container">
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-content">
            <h3>No Events Yet</h3>
            <p>Create your first event to start organizing photo deliveries</p>
            <div className="empty-state-features">
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <span>AI-powered photo matching</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📧</span>
                <span>Automated email delivery</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Real-time analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="event-list-container">
      {/* Filters & Search Header */}
      <div className="event-list-header">
        <div className="header-left">
          <div className="events-count">
            <span className="count-number">{filteredEvents.length}</span>
            <span className="count-label">
              {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="filter-group">
            <label className="filter-label">Status:</label>
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Premium Events Table */}
      <div className="events-table-container">
        <div className="events-table">
          {/* Table Header */}
          <div className="table-header">
            <div className="header-cell event-name-cell">
              <button 
                className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
                onClick={() => handleSort('name')}
              >
                Event Name
                <span className="sort-icon">
                  {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕️'}
                </span>
              </button>
            </div>
            
            <div className="header-cell date-cell">
              <button 
                className={`sort-button ${sortBy === 'date' ? 'active' : ''}`}
                onClick={() => handleSort('date')}
              >
                Date
                <span className="sort-icon">
                  {sortBy === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕️'}
                </span>
              </button>
            </div>
            
            <div className="header-cell registrations-cell">
              <button 
                className={`sort-button ${sortBy === 'registrations' ? 'active' : ''}`}
                onClick={() => handleSort('registrations')}
              >
                Guests
                <span className="sort-icon">
                  {sortBy === 'registrations' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕️'}
                </span>
              </button>
            </div>
            
            <div className="header-cell status-cell">
              Status
            </div>
            
            <div className="header-cell actions-cell">
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div className="table-body">
            {sortedEvents.map((event, index) => {
              const statusConfig = getStatusConfig(event.status);
              
              return (
                <div 
                  key={event.id}
                  className={`table-row ${selectedEvent === event.id ? 'selected' : ''}`}
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                >
                  {/* Event Name */}
                  <div className="table-cell event-name-cell">
                    <div className="event-info">
                      <div className="event-name">{event.name}</div>
                      <div className="event-id">ID: {event.qrCode || event.id}</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="table-cell date-cell">
                    <div className="date-info">
                      <div className="date-short">{formatDate(event.date)}</div>
                      <div className="date-full">{formatTime(event.date)}</div>
                    </div>
                  </div>

                  {/* Registrations */}
                  <div className="table-cell registrations-cell">
                    <div className="registrations-info">
                      <div className="registration-count">
                        <span className="count-main">{event.registrations}</span>
                        <span className="count-suffix"> registered</span>
                      </div>
                      {event.photosUploaded > 0 && (
                        <div className="photos-count">
                          <span className="photos-icon">📸</span>
                          <span>{event.photosUploaded} photos</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="table-cell status-cell">
                    <div 
                      className="status-badge"
                      style={{
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        border: `1px solid ${statusConfig.color}20`
                      }}
                    >
                      <span className="status-icon">{statusConfig.icon}</span>
                      <span className="status-text">{statusConfig.text}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="table-cell actions-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn copy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyQRCode(event.qrCode || event.id);
                        }}
                        title="Copy registration link"
                      >
                        <span className="btn-icon">🔗</span>
                        <span className="btn-text">Copy Link</span>
                      </button>
                      
                      <button
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add view event functionality
                        }}
                        title="View event details"
                      >
                        <span className="btn-icon">👁️</span>
                        <span className="btn-text">View</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-icon">📅</span>
          <div className="stat-content">
            <span className="stat-number">{events.length}</span>
            <span className="stat-label">Total Events</span>
          </div>
        </div>
        
        <div className="stat-item">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-number">
              {events.reduce((sum, event) => sum + event.registrations, 0)}
            </span>
            <span className="stat-label">Total Registrations</span>
          </div>
        </div>
        
        <div className="stat-item">
          <span className="stat-icon">📸</span>
          <div className="stat-content">
            <span className="stat-number">
              {events.reduce((sum, event) => sum + (event.photosUploaded || 0), 0)}
            </span>
            <span className="stat-label">Photos Processed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventList;
