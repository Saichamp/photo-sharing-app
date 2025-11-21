import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import { Loader } from '../../components/common/Loader';
import './EventList.css';

const EventList = ({ onEventCreated }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await eventAPI.getAll(params);
      
      const eventsData = response.data?.events || response.data?.data || [];
      const eventsArray = Array.isArray(eventsData) ? eventsData : [];
      setEvents(eventsArray);
      
      if (onEventCreated) onEventCreated();
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err.response?.data?.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filter, onEventCreated]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const getStatusColor = (status) => {
    const statusColors = {
      upcoming: '#3b82f6',
      active: '#10b981',
      completed: '#6b7280',
      draft: '#f59e0b'
    };
    return statusColors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      upcoming: 'Upcoming',
      active: 'Active',
      completed: 'Completed',
      draft: 'Draft'
    };
    return statusLabels[status] || status;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader size="lg" text="Loading your events..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
        <h3>Failed to Load Events</h3>
        <p>{error}</p>
        <button onClick={loadEvents} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="event-list-container">
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Events ({events.length})
        </button>
        <button
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
            </svg>
          </div>
          <h3>No Events Yet</h3>
          <p>Create your first event to start managing photos with AI</p>
          <Link to="/dashboard/create" className="btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            Create First Event
          </Link>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event._id || event.id} className="event-card">
              <div className="event-card-header">
                <h3>{event.name || 'Untitled Event'}</h3>
                <div 
                  className="status-badge"
                  style={{ background: getStatusColor(event.status) }}
                >
                  {getStatusLabel(event.status)}
                </div>
              </div>

              <div className="event-card-body">
                <div className="event-info">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                  </svg>
                  {formatDate(event.date)}
                </div>

                {event.location && (
                  <div className="event-info">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                    {event.location}
                  </div>
                )}

                <div className="event-stats">
                  <div className="stat-item">
                    <span className="stat-number">{event.registrationCount || 0}</span>
                    <span className="stat-label">Guests</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">{event.photosUploaded || 0}</span>
                    <span className="stat-label">Photos</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">{event.expectedGuests || 0}</span>
                    <span className="stat-label">Expected</span>
                  </div>
                </div>
              </div>

              <div className="event-card-footer">
                <Link 
                  to={`/dashboard/event/${event._id || event.id}`} 
                  className="btn btn-ghost btn-sm"
                >
                  View Details
                </Link>
                <Link 
                  to={`/dashboard/upload?eventId=${event._id || event.id}`} 
                  className="btn btn-primary btn-sm"
                >
                  Upload Photos
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
