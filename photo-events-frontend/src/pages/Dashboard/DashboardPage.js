import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActivity, setShowActivity] = useState(false); // ✅ NEW: Toggle state

  // Load all events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading events...');
      const response = await eventAPI.getAll();
      const eventsData = response.data?.data?.events || response.data?.events || [];
      console.log('✅ Events loaded:', eventsData);
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
    console.log('🔄 Data changed, reloading...');
    loadEvents();
  }, [loadEvents]);

  // Handle event creation success
  const handleEventCreated = useCallback((newEvent) => {
    console.log('🎉 Event created:', newEvent);
    loadEvents();
    setTimeout(() => navigate('/dashboard'), 300);
  }, [loadEvents, navigate]);

  // ✅ NEW: Handle event update
  const handleEventUpdate = useCallback((event) => {
    console.log('✏️ Editing event:', event);
    // Navigate to create page with event data (you can implement edit mode)
    navigate('/dashboard/create', { state: { editEvent: event } });
  }, [navigate]);

  // ✅ NEW: Handle event delete
  const handleEventDelete = useCallback(async (event) => {
    try {
      await eventAPI.delete(event._id || event.id);
      console.log('🗑️ Event deleted:', event.name);
      loadEvents();
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    }
  }, [loadEvents]);

  // Calculate stats
  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    activeEvents: events.filter(e => e.status === 'active').length,
    completedEvents: events.filter(e => e.status === 'completed').length,
    totalPhotos: events.reduce((sum, e) => sum + (e.photosUploaded || 0), 0),
    totalGuests: events.reduce((sum, e) => sum + (e.registrationCount || 0), 0)
  };

  // Get recent activity (last 5 events)
  const recentActivity = events
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p>Manage your events and photos with AI-powered face recognition</p>
        </div>

        {/* ✅ NEW: Activity Toggle Button */}
        <button 
          className="activity-toggle-btn"
          onClick={() => setShowActivity(!showActivity)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" />
          </svg>
          {showActivity ? 'Hide Activity' : 'Recent Activity'}
        </button>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <Loader />
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{stats.totalEvents}</h3>
                <p>TOTAL EVENTS</p>
                <span className="stat-detail">
                  {stats.upcomingEvents}/{stats.totalEvents} upcoming
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📸</div>
              <div className="stat-info">
                <h3>{stats.totalPhotos}</h3>
                <p>PHOTOS UPLOADED</p>
                <span className="stat-detail">{stats.activeEvents} active events</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalGuests}</h3>
                <p>REGISTERED GUESTS</p>
                <span className="stat-detail">{stats.upcomingEvents} upcoming</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>FREE</h3>
                <p>CURRENT PLAN</p>
                <Link to="/dashboard/billing">Upgrade Plan →</Link>
              </div>
            </div>
          </div>

          {/* Main Content with Sidebar */}
          <div className="dashboard-content-wrapper">
            {/* Main Content */}
            <div className="dashboard-main-content">
              <Routes>
                <Route
                  path="/"
                  element={
                    <EventList
                      events={events}
                      onRefresh={handleDataChange}
                      onEventUpdate={handleEventUpdate} // ✅ Pass handler
                      onEventDelete={handleEventDelete} // ✅ Pass handler
                    />
                  }
                />
                <Route
                  path="/create"
                  element={<CreateEvent onEventCreated={handleEventCreated} />}
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
                        <div style={{ marginTop: 40 }}>
                          <EventPhotoGallery
                            event={selectedEvent}
                            key={selectedEvent.id}
                          />
                        </div>
                      )}
                    </>
                  }
                />
                <Route
                  path="/analytics"
                  element={<Analytics events={events} onRefresh={handleDataChange} />}
                />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/billing" element={<BillingPage />} />
              </Routes>
            </div>

            {/* ✅ NEW: Collapsible Activity Sidebar */}
            {showActivity && (
              <div className="activity-sidebar">
                <div className="activity-header">
                  <h3>📊 Recent Activity</h3>
                  <button 
                    className="close-btn"
                    onClick={() => setShowActivity(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="activity-list">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((event) => (
                      <div key={event._id} className="activity-item">
                        <div className="activity-icon">
                          {event.photosUploaded > 0 ? '📸' : '📅'}
                        </div>
                        <div className="activity-content">
                          <p className="activity-title">
                            {event.photosUploaded > 0
                              ? `${event.photosUploaded} photos uploaded to`
                              : `Event created:`}
                          </p>
                          <p className="activity-event">"{event.name}"</p>
                          <p className="activity-date">
                            {new Date(event.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="activity-empty">
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>

                {recentActivity.length > 0 && (
                  <Link to="/dashboard/analytics" className="view-all-link">
                    View All Analytics →
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
