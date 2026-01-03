import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventAPI } from '../../services/api';
import { Loader } from '../../components/common/Loader';
import CreateEvent from './CreateEvent';
import EventList from './EventList';
import PhotoUpload from './PhotoUpload';
import EventPhotoGallery from '../../components/dashboard/EventPhotoGallery';
import Analytics from './Analytics';
import ProfilePage from './ProfilePage';
import BillingPage from './BillingPage';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load all events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAll();
      const eventsData = response.data?.data?.events || response.data?.events || [];
      setEvents(eventsData);
    } catch (error) {
      console.error('❌ Failed to load events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle any data change
  const handleDataChange = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle event creation success
  const handleEventCreated = useCallback((newEvent) => {
    loadEvents();
    setTimeout(() => navigate('/dashboard'), 300);
  }, [loadEvents, navigate]);

  // Calculate stats
  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    activeEvents: events.filter(e => e.status === 'active').length,
    completedEvents: events.filter(e => e.status === 'completed').length,
    totalPhotos: events.reduce((sum, e) => sum + (e.photosUploaded || 0), 0),
    totalGuests: events.reduce((sum, e) => sum + (e.registrationCount || 0), 0)
  };

  // Get recent activity
  const getRecentActivity = () => {
    const activities = [];
    
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    sortedEvents.slice(0, 5).forEach(event => {
      activities.push({
        type: 'event_created',
        event: event.name,
        date: event.createdAt,
        icon: '📅'
      });

      if (event.photosUploaded > 0) {
        activities.push({
          type: 'photos_uploaded',
          event: event.name,
          count: event.photosUploaded,
          date: event.updatedAt,
          icon: '📸'
        });
      }

      if (event.registrationCount > 0) {
        activities.push({
          type: 'guests_registered',
          event: event.name,
          count: event.registrationCount,
          date: event.updatedAt,
          icon: '👥'
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  };

  // Format date for activity
  const formatActivityDate = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return activityDate.toLocaleDateString();
  };

  // Show dashboard overview only on main dashboard route
  const showOverview = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  return (
    <div className="dashboard-container">
      {loading ? (
        <div className="dashboard-loading">
          <Loader />
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>Welcome back, {user?.name}! 👋</h1>
              <p>Manage your events and photos with AI-powered face recognition</p>
            </div>
            <Link to="/dashboard/create" className="btn btn-primary">
              <span>➕</span>
              <span>Create Event</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{stats.totalEvents}</h3>
                <p>TOTAL EVENTS</p>
                <span className="stat-detail">{stats.upcomingEvents}/{stats.totalEvents} upcoming</span>
              </div>
              <div className="stat-chart">
                <div className="mini-chart">
                  <div className="chart-bar" style={{ height: '40%' }}></div>
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '70%' }}></div>
                  <div className="chart-bar" style={{ height: '90%' }}></div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📸</div>
              <div className="stat-info">
                <h3>{stats.totalPhotos}</h3>
                <p>PHOTOS UPLOADED</p>
                <span className="stat-detail">{stats.activeEvents} active events</span>
              </div>
              <div className="stat-chart">
                <div className="mini-chart">
                  <div className="chart-bar" style={{ height: '50%' }}></div>
                  <div className="chart-bar" style={{ height: '70%' }}></div>
                  <div className="chart-bar" style={{ height: '65%' }}></div>
                  <div className="chart-bar" style={{ height: '85%' }}></div>
                  <div className="chart-bar" style={{ height: '75%' }}></div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalGuests}</h3>
                <p>REGISTERED GUESTS</p>
                <span className="stat-detail">{stats.upcomingEvents} upcoming</span>
              </div>
              <div className="stat-chart">
                <div className="mini-chart">
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '55%' }}></div>
                  <div className="chart-bar" style={{ height: '75%' }}></div>
                  <div className="chart-bar" style={{ height: '65%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                </div>
              </div>
            </div>

            <div className="stat-card stat-card-cta">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>FREE</h3>
                <p>CURRENT PLAN</p>
                <Link to="/dashboard/billing" className="stat-link">Upgrade Plan →</Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="dashboard-content">
            {/* Content Area */}
            <div className="dashboard-main">
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <EventList
                        events={events}
                        onRefresh={handleDataChange}
                      />
                    </>
                  }
                />
                <Route
                  path="/create"
                  element={
                    <CreateEvent
                      onEventCreated={handleEventCreated}
                    />
                  }
                />
                <Route
                  path="/upload"
                  element={
                    <>
                      <PhotoUpload
                        events={events}
                        selectedEvent={selectedEvent}
                        onEventSelect={setSelectedEvent}
                        onPhotosUploaded={handleDataChange}
                      />
                      
                      {selectedEvent && (
                        <div style={{ marginTop: '40px' }}>
                          <EventPhotoGallery 
                            event={selectedEvent}
                            key={selectedEvent._id}
                          />
                        </div>
                      )}
                    </>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <Analytics
                      events={events}
                      onRefresh={handleDataChange}
                    />
                  }
                />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/billing" element={<BillingPage />} />
              </Routes>
            </div>

            {/* Recent Activity Sidebar (only on dashboard overview) */}
            {showOverview && events.length > 0 && (
              <div className="dashboard-sidebar">
                <div className="activity-section">
                  <h3 className="activity-title">Recent Activity</h3>
                  <div className="activity-list">
                    {getRecentActivity().map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-icon">{activity.icon}</div>
                        <div className="activity-content">
                          {activity.type === 'event_created' && (
                            <p className="activity-text">
                              Event <strong>"{activity.event}"</strong> created
                            </p>
                          )}
                          {activity.type === 'photos_uploaded' && (
                            <p className="activity-text">
                              <strong>{activity.count}</strong> photos uploaded to{' '}
                              <strong>"{activity.event}"</strong>
                            </p>
                          )}
                          {activity.type === 'guests_registered' && (
                            <p className="activity-text">
                              <strong>{activity.count}</strong> guests registered for{' '}
                              <strong>"{activity.event}"</strong>
                            </p>
                          )}
                          <span className="activity-time">
                            {formatActivityDate(activity.date)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {getRecentActivity().length === 0 && (
                      <div className="activity-empty">
                        <p>No recent activity yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
