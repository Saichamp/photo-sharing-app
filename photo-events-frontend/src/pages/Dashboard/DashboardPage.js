import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventAPI } from '../../services/api';
import { Loader } from '../../components/common/Loader';
import CreateEvent from './CreateEvent';
import EventList from './EventList';
import PhotoUpload from './PhotoUpload';
import EventPhotoGallery from '../../components/dashboard/EventPhotoGallery'; // ✅ ADDED
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

  // Calculate stats
  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    activeEvents: events.filter(e => e.status === 'active').length,
    completedEvents: events.filter(e => e.status === 'completed').length,
    totalPhotos: events.reduce((sum, e) => sum + (e.photosUploaded || 0), 0),
    totalGuests: events.reduce((sum, e) => sum + (e.registrationCount || 0), 0)
  };

  const isTabActive = (tab) => {
    const path = location.pathname;
    if (tab === 'events') return path === '/dashboard' || path === '/dashboard/';
    return path.includes(tab);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p>Manage your events and photos with AI-powered face recognition</p>
        </div>
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
                <span className="stat-detail">{stats.upcomingEvents}/{stats.totalEvents} used</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📸</div>
              <div className="stat-info">
                <h3>{stats.totalPhotos}</h3>
                <p>PHOTOS UPLOADED</p>
                <span className="stat-detail">{stats.activeEvents} Active</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalGuests}</h3>
                <p>REGISTERED GUESTS</p>
                <span className="stat-detail">{stats.upcomingEvents} Upcoming</span>
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

          {/* Main Content */}
          <div className="dashboard-content">
            {/* Sidebar Tabs */}
            <div className="dashboard-sidebar">
              <Link
                to="/dashboard"
                className={`tab-link ${isTabActive('events') ? 'active' : ''}`}
              >
                📅 Events
              </Link>
              <Link
                to="/dashboard/create"
                className={`tab-link ${isTabActive('create') ? 'active' : ''}`}
              >
                ➕ Create Event
              </Link>
              <Link
                to="/dashboard/upload"
                className={`tab-link ${isTabActive('upload') ? 'active' : ''}`}
              >
                ⬆️ Upload Photos
              </Link>
              <Link
                to="/dashboard/analytics"
                className={`tab-link ${isTabActive('analytics') ? 'active' : ''}`}
              >
                📊 Analytics
              </Link>
            </div>

            {/* Content Area */}
            <div className="dashboard-main">
              <Routes>
                <Route
                  path="/"
                  element={
                    <EventList
                      events={events}
                      onRefresh={handleDataChange}
                    />
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
                      {/* ✅ PHOTO UPLOAD SECTION */}
                      <PhotoUpload
                        events={events}
                        selectedEvent={selectedEvent}
                        onEventSelect={setSelectedEvent}
                        onPhotosUploaded={handleDataChange} // ✅ Refresh on upload
                      />
                      
                      {/* ✅ PHOTO GALLERY SECTION (NEW!) */}
                      {selectedEvent && (
                        <div style={{ marginTop: '40px' }}>
                          <EventPhotoGallery 
                            event={selectedEvent}
                            key={selectedEvent._id} // ✅ Force re-render on event change
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
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
