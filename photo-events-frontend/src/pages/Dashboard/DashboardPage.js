import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventAPI } from '../../services/api';
import { Loader } from '../../components/common/Loader';
import CreateEvent from './CreateEvent';
import EventList from './EventList';
import PhotoUpload from './PhotoUpload';
//import EventPhotoGallery from '../../components/dashboard/EventPhotoGallery';
import Analytics from './Analytics';
import ProfilePage from './ProfilePage';
import BillingPage from './BillingPage';
import './DashboardPage.css';



const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    activeEvents: 0,
    completedEvents: 0,
    totalPhotos: 0,
    totalGuests: 0
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load all events + calculate stats
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAll();
      const eventsData = response.data?.data?.events || [];
      
      // Calculate perfect stats
      const totalEvents = eventsData.length;
      const upcomingEvents = eventsData.filter(e => e.status === 'upcoming').length;
      const activeEvents = eventsData.filter(e => e.status === 'active').length;
      const completedEvents = eventsData.filter(e => e.status === 'completed').length;
      const totalPhotos = eventsData.reduce((sum, e) => sum + (e.photosUploaded || 0), 0);
      const totalGuests = eventsData.reduce((sum, e) => sum + (e.registrationCount || 0), 0);

      setEvents(eventsData);
      setStats({
        totalEvents,
        upcomingEvents,
        activeEvents,
        completedEvents,
        totalPhotos,
        totalGuests
      });
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
      setStats({ totalEvents: 0, upcomingEvents: 0, activeEvents: 0, completedEvents: 0, totalPhotos: 0, totalGuests: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleDataChange = () => loadEvents();

  const isActive = (path) => location.pathname === path;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader size="lg" />
        <p className="loading-text">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Toggle */}
      <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
        <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Quick Actions</h2>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">📅</span>
            <span>Events ({stats.totalEvents})</span>
            <span className="badge">
              {stats.upcomingEvents} upcoming
            </span>
          </Link>

          <Link 
            to="/dashboard/create" 
            className={`nav-link ${isActive('/dashboard/create') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">➕</span>
            <span>New Event</span>
          </Link>

          <Link 
            to="/dashboard/upload" 
            className={`nav-link ${isActive('/dashboard/upload') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">⬆️</span>
            <span>Upload Photos</span>
            <span className="badge">{stats.totalPhotos} photos</span>
          </Link>

          <Link 
            to="/dashboard/analytics" 
            className={`nav-link ${isActive('/dashboard/analytics') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">📊</span>
            <span>Analytics</span>
          </Link>

          <div className="nav-divider" />

   { /*      <Link 
            to="/dashboard/guests" 
            className={`nav-link ${isActive('/dashboard/guests') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">👥</span>
            <span>Guests ({stats.totalGuests})</span>
          </Link>

          <Link 
            to="/dashboard/billing" 
            className={`nav-link ${isActive('/dashboard/billing') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">💎</span>
            <span>Billing</span>
          </Link>

          <Link 
            to="/dashboard/profile" 
            className={`nav-link ${isActive('/dashboard/profile') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">⚙️</span>
            <span>Profile</span>
          </Link> */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p>Manage your events with AI-powered face recognition</p>
          </div>
          
          {/* Stats Overview */}
          <div className="header-stats">
            <div className="stat-mini">
              <span className="stat-number">{stats.totalEvents}</span>
              <span className="stat-label">Events</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-mini">
              <span className="stat-number">{stats.upcomingEvents}</span>
              <span className="stat-label">Upcoming</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-mini">
              <span className="stat-number">{stats.activeEvents}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-mini">
              <span className="stat-number">{stats.completedEvents}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<EventList events={events} onRefresh={handleDataChange} />} />
            <Route path="/create" element={<CreateEvent onEventCreated={handleDataChange} />} />
            <Route path="/upload" element={<PhotoUpload events={events} onPhotosUploaded={handleDataChange} />} />
            <Route path="/analytics" element={<Analytics events={events} onRefresh={handleDataChange} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/guests" element={<div>Guests Page Coming Soon</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
