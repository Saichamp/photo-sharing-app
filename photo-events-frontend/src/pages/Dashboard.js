import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';
import EventList from '../components/dashboard/EventList';
import PhotoUpload from '../components/dashboard/PhotoUpload';
import Analytics from '../components/dashboard/Analytics';
import CreateEvent from '../components/dashboard/CreateEvent';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching events from API...');
      
      const response = await eventAPI.getAll();
      
      console.log('✅ Response received:', response.data);
      
      // ✅ FIX: Handle both response formats
      const eventsData = response.data.data || response.data;
      
      if (!Array.isArray(eventsData)) {
        throw new Error('Invalid response format: expected array of events');
      }
      
      const transformedEvents = eventsData.map(event => ({
        id: event._id,
        name: event.name,
        date: event.date,
        registrations: event.registrationCount || 0,
        status: event.status || 'active',
        qrCode: event.qrCode,
        photosUploaded: event.photosUploaded || 0,
        location: event.location,
        description: event.description
      }));
      
      console.log(`✅ Loaded ${transformedEvents.length} events`);
      
      setEvents(transformedEvents);
      setError(null);
      
    } catch (err) {
      console.error('❌ Failed to load events:', err);
      console.error('   Error details:', err.response?.data || err.message);
      
      setError(err.response?.data?.message || err.message || 'Failed to load events. Please try again.');
      setEvents([]);
      
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = (newEvent) => {
    console.log('✅ New event created:', newEvent);
    
    setEvents(prevEvents => [{
      id: newEvent._id || newEvent.id || Date.now(),
      name: newEvent.name,
      date: newEvent.date,
      registrations: 0,
      status: newEvent.status || 'active',
      qrCode: newEvent.qrCode,
      photosUploaded: 0,
      location: newEvent.location,
      description: newEvent.description
    }, ...prevEvents]);
    
    setActiveTab('events');
  };

  // Stats calculations
  const totalRegistrations = events.reduce((sum, event) => sum + (event.registrations || 0), 0);
  const totalPhotos = events.reduce((sum, event) => sum + (event.photosUploaded || 0), 0);
  const avgPhotosPerPerson = totalRegistrations > 0 ? (totalPhotos / totalRegistrations).toFixed(1) : '0.0';
  const activeEvents = events.filter(event => event.status === 'active').length;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Getting everything ready for you</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <h3>Connection Error</h3>
          <p>{error}</p>
          <button onClick={loadEvents} className="retry-button">
            Try Again
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'events':
        return <EventList events={events} onEventUpdate={loadEvents} />;
      case 'create':
        return <CreateEvent onEventCreated={handleEventCreated} />;
      case 'upload':
        return <PhotoUpload events={events} />;
      case 'analytics':
        return <Analytics events={events} />;
      default:
        return <EventList events={events} onEventUpdate={loadEvents} />;
    }
  };

  return (
    <div className={`dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>📸 PhotoEvents</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Events</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <span className="nav-icon">➕</span>
            <span className="nav-label">Create Event</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <span className="nav-icon">📤</span>
            <span className="nav-label">Upload Photos</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Analytics</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Home
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>
              {activeTab === 'events' && '📋 Events'}
              {activeTab === 'create' && '➕ Create Event'}
              {activeTab === 'upload' && '📤 Upload Photos'}
              {activeTab === 'analytics' && '📊 Analytics'}
            </h1>
            <p className="header-subtitle">
              {activeTab === 'events' && 'Manage all your events and photo deliveries'}
              {activeTab === 'create' && 'Set up a new event for photo automation'}
              {activeTab === 'upload' && 'Upload and process event photos'}
              {activeTab === 'analytics' && 'Track performance and engagement metrics'}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <span className="stat-label">Active Events</span>
              <span className="stat-value">{activeEvents}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Registrations</span>
              <span className="stat-value">{totalRegistrations}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Photos Uploaded</span>
              <span className="stat-value">{totalPhotos}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Avg Photos / Person</span>
              <span className="stat-value">{avgPhotosPerPerson}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
