import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { eventAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common/Loader';

// Import from OLD locations (in components folder)
import CreateEvent from '../components/CreateEvent';
import EventList from '../components/EventList';
import PhotoUpload from '../components/PhotoUpload';
import Analytics from '../components/Analytics';

import './Dashboard.css';

function Dashboard() {
  const location = useLocation();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventAPI.getAll();
      
      // Handle new API response format
      if (response.data && response.data.success) {
        setEvents(response.data.data.events || []);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err.response?.data?.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (loading) {
    return <Loader size="lg" text="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Dashboard</h2>
          <p className="sidebar-subtitle">Manage your events</p>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`sidebar-link ${isActive('/dashboard') && location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Overview
          </Link>

          <Link
            to="/dashboard/create"
            className={`sidebar-link ${isActive('/dashboard/create') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            Create Event
          </Link>

          <Link
            to="/dashboard/events"
            className={`sidebar-link ${isActive('/dashboard/events') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
            </svg>
            My Events
            <span className="sidebar-badge">{events.length}</span>
          </Link>

          <Link
            to="/dashboard/upload"
            className={`sidebar-link ${isActive('/dashboard/upload') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
            </svg>
            Upload Photos
          </Link>

          <Link
            to="/dashboard/analytics"
            className={`sidebar-link ${isActive('/dashboard/analytics') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Analytics
          </Link>
        </nav>

        {/* Quota Card */}
        <div className="quota-card">
          <div className="quota-header">
            <h3>Your Plan</h3>
            <span className={`plan-badge plan-${user?.subscription?.plan || 'free'}`}>
              {user?.subscription?.plan?.toUpperCase() || 'FREE'}
            </span>
          </div>
          
          <div className="quota-stats">
            <div className="quota-item">
              <div className="quota-label">Events</div>
              <div className="quota-value">
                {events.length}/{user?.quota?.eventsLimit || 3}
              </div>
              <div className="quota-bar">
                <div 
                  className="quota-fill" 
                  style={{ 
                    width: `${(events.length / (user?.quota?.eventsLimit || 3)) * 100}%`,
                    background: 'var(--gradient-purple)'
                  }}
                />
              </div>
            </div>
          </div>

          <Link to="/dashboard/billing" className="upgrade-btn">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Upgrade Plan
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {error && (
          <div className="alert alert-error mb-6">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
            {error}
          </div>
        )}

        <Routes>
          <Route path="/" element={<DashboardOverview events={events} user={user} />} />
          <Route path="/create" element={<CreateEvent onEventCreated={loadEvents} />} />
          <Route path="/events" element={<EventList events={events} onUpdate={loadEvents} />} />
          <Route path="/upload" element={<PhotoUpload events={events} />} />
          <Route path="/analytics" element={<Analytics events={events} />} />
        </Routes>
      </main>
    </div>
  );
}

// Dashboard Overview Component
function DashboardOverview({ events, user }) {
  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter(e => e.status === 'active').length,
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    completedEvents: events.filter(e => e.status === 'completed').length
  };

  return (
    <div className="dashboard-overview">
      <div className="overview-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋</h1>
          <p className="overview-subtitle">Here's what's happening with your events</p>
        </div>
        <Link to="/dashboard/create" className="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          Create Event
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-purple">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Events</div>
            <div className="stat-value">{stats.totalEvents}</div>
          </div>
        </div>

        <div className="stat-card stat-card-pink">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Events</div>
            <div className="stat-value">{stats.activeEvents}</div>
          </div>
        </div>

        <div className="stat-card stat-card-gradient">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Upcoming</div>
            <div className="stat-value">{stats.upcomingEvents}</div>
          </div>
        </div>

        <div className="stat-card stat-card-neutral">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.completedEvents}</div>
          </div>
        </div>
      </div>

      {/* Recent Events or Empty State */}
      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📸</div>
          <h3>No events yet</h3>
          <p>Create your first event to start managing photos with AI-powered face recognition</p>
          <Link to="/dashboard/create" className="btn btn-pink">
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="recent-events">
          <h2>Recent Events</h2>
          <div className="events-grid">
            {events.slice(0, 3).map(event => (
              <div key={event._id} className="event-card-mini">
                <div className="event-card-header">
                  <h3>{event.name}</h3>
                  <span className={`badge badge-${event.status}`}>
                    {event.status}
                  </span>
                </div>
                <div className="event-card-details">
                  <div className="event-detail">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                    </svg>
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="event-detail">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {event.registrationCount || 0} registered
                  </div>
                </div>
                <Link to="/dashboard/events" className="event-card-link">
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
