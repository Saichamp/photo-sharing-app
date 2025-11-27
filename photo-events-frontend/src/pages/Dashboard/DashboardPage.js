import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventAPI } from '../../services/api';
import {Loader} from '../../components/common/Loader';
import CreateEvent from './CreateEvent';
import EventList from './EventList';
import PhotoUpload from './PhotoUpload';
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
  const [error, setError] = useState(null);

  // Load all events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading events...');
      const response = await eventAPI.getAll();
      const eventsData = response.data?.data?.events || response.data?.events || [];
      
      console.log('✅ Events loaded:', eventsData);
      setEvents(eventsData);
      
    } catch (error) {
      console.error('❌ Failed to load events:', error);
      setError(error.response?.data?.message || 'Failed to load events');
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
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p className="dashboard-subtitle">
              Manage your events and photos with AI-powered face recognition
            </p>
          </div>
          
          <Link to="/dashboard/create" className="btn btn-pink">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            Create Event
          </Link>
        </div>

        {/* Stats Cards */}
        {loading && events.length === 0 ? (
          <div className="stats-loading">
            <Loader size="md" />
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card stat-purple">
              <div className="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalEvents}</div>
                <div className="stat-label">Total Events</div>
                <div className="stat-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill purple"
                      style={{ width: `${Math.min((stats.totalEvents / (user?.quota?.eventsLimit || 3)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {stats.totalEvents}/{user?.quota?.eventsLimit || 3} used
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card stat-pink">
              <div className="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalPhotos}</div>
                <div className="stat-label">Photos Uploaded</div>
                <div className="stat-badge badge-pink">
                  {stats.activeEvents} Active
                </div>
              </div>
            </div>

            <div className="stat-card stat-rose">
              <div className="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalGuests}</div>
                <div className="stat-label">Registered Guests</div>
                <div className="stat-badge badge-rose">
                  {stats.upcomingEvents} Upcoming
                </div>
              </div>
            </div>

            <div className="stat-card stat-gradient">
              <div className="stat-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{user?.subscription?.plan?.toUpperCase() || 'FREE'}</div>
                <div className="stat-label">Current Plan</div>
                <Link to="/dashboard/billing" className="stat-link">
                  Upgrade Plan →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <Link 
            to="/dashboard"
            className={`tab-link ${isTabActive('events') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Events
            {stats.totalEvents > 0 && (
              <span className="tab-badge">{stats.totalEvents}</span>
            )}
          </Link>
          
          <Link 
            to="/dashboard/create"
            className={`tab-link ${isTabActive('create') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            Create Event
          </Link>
          
          <Link 
            to="/dashboard/upload"
            className={`tab-link ${isTabActive('upload') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
            </svg>
            Upload Photos
          </Link>
          
          <Link 
            to="/dashboard/analytics"
            className={`tab-link ${isTabActive('analytics') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Analytics
          </Link>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          <Routes>
            <Route 
              index 
              element={
                <EventList 
                  events={events}
                  loading={loading}
                  selectedEvent={selectedEvent}
                  onEventSelect={setSelectedEvent}
                  onEventUpdate={handleDataChange}
                  onEventDelete={handleDataChange}
                />
              } 
            />
            <Route 
              path="create" 
              element={
                <CreateEvent onEventCreated={handleEventCreated} />
              } 
            />
            <Route 
              path="upload" 
              element={
                <PhotoUpload 
                  events={events}
                  selectedEvent={selectedEvent}
                  onEventSelect={setSelectedEvent}
                  onPhotosUploaded={handleDataChange}
                />
              } 
            />
            <Route 
              path="analytics" 
              element={
                <Analytics events={events} stats={stats} />
              } 
            />
            <Route 
              path="profile" 
              element={
                <ProfilePage />
              } 
            />
            <Route 
              path="billing" 
              element={
                <BillingPage />
              } 
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
