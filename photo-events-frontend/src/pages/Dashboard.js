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
      const response = await eventAPI.getAll();
      
      const transformedEvents = response.data.map(event => ({
        id: event._id,
        name: event.name,
        date: event.date,
        registrations: event.registrationCount,
        status: event.status,
        qrCode: event.qrCode,
        photosUploaded: event.photosUploaded
      }));
      
      setEvents(transformedEvents);
      setError(null);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = (newEvent) => {
    setEvents(prevEvents => [{
      id: newEvent._id || Date.now(),
      name: newEvent.name,
      date: newEvent.date,
      registrations: 0,
      status: newEvent.status,
      qrCode: newEvent.qrCode,
      photosUploaded: 0
    }, ...prevEvents]);
    
    setActiveTab('events');
  };

  const totalRegistrations = events.reduce((sum, event) => sum + event.registrations, 0);
  const totalPhotos = events.reduce((sum, event) => sum + event.photosUploaded, 0);
  const avgPhotosPerPerson = totalRegistrations > 0 ? (totalPhotos / totalRegistrations).toFixed(1) : 0;
  const activeEvents = events.filter(event => event.status === 'active').length;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-content">
            <h3>Loading your events...</h3>
            <p>Getting everything ready for you</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Connection Error</h3>
            <p>{error}</p>
            <button onClick={loadEvents} className="btn-retry">
              Try Again
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'events':
        return <EventList events={events} onEventUpdate={setEvents} />;
      case 'upload':
        return <PhotoUpload events={events} />;
      case 'analytics':
        return <Analytics events={events} />;
      case 'create':
        return <CreateEvent onEventCreated={handleEventCreated} />;
      default:
        return <EventList events={events} onEventUpdate={setEvents} />;
    }
  };

  const sidebarItems = [
    { key: 'events', label: 'Events', icon: '📅', count: events.length },
    { key: 'create', label: 'Create Event', icon: '➕', count: null },
    { key: 'upload', label: 'Upload Photos', icon: '📸', count: null },
    { key: 'analytics', label: 'Analytics', icon: '📊', count: null }
  ];

  return (
    <div className="dashboard-layout">
      {/* Premium Sidebar */}
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon">📸</span>
            {!sidebarCollapsed && (
              <>
                <span className="brand-text">PhotoEvents</span>
                <span className="brand-badge">PRO</span>
              </>
            )}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.count !== null && (
                    <span className="nav-count">{item.count}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="user-profile">
              <div className="user-avatar">👤</div>
              <div className="user-info">
                <div className="user-name">Event Manager</div>
                <div className="user-email">pro@photoevents.com</div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => navigate('/')}
            className="btn-sidebar-action"
            title={sidebarCollapsed ? "View Landing" : undefined}
          >
            <span className="btn-icon">🏠</span>
            {!sidebarCollapsed && <span>View Landing</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Premium Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">
              {activeTab === 'events' && 'Events Management'}
              {activeTab === 'create' && 'Create New Event'}
              {activeTab === 'upload' && 'Photo Upload'}
              {activeTab === 'analytics' && 'Analytics & Insights'}
            </h1>
            <p className="page-subtitle">
              {activeTab === 'events' && 'Manage all your events and photo deliveries'}
              {activeTab === 'create' && 'Set up a new event for photo automation'}
              {activeTab === 'upload' && 'Upload and process event photos'}
              {activeTab === 'analytics' && 'Track performance and engagement metrics'}
            </p>
          </div>
          
          <div className="header-actions">
            {activeTab === 'events' && (
              <button 
                onClick={() => setActiveTab('create')}
                className="btn-header-primary"
              >
                <span className="btn-icon">➕</span>
                Create Event
              </button>
            )}
            {activeTab !== 'create' && activeTab !== 'events' && (
              <button 
                onClick={() => setActiveTab('events')}
                className="btn-header-secondary"
              >
                <span className="btn-icon">📅</span>
                View Events
              </button>
            )}
          </div>
        </div>

        {/* Premium Stats Grid */}
        {activeTab === 'events' && (
          <div className="stats-overview">
            <div className="stat-card primary">
              <div className="stat-header">
                <div className="stat-icon">📅</div>
                <div className="stat-trend up">↗ +12%</div>
              </div>
              <div className="stat-content">
                <div className="stat-number">{events.length}</div>
                <div className="stat-label">Total Events</div>
                <div className="stat-description">
                  {activeEvents} active, {events.length - activeEvents} completed
                </div>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-header">
                <div className="stat-icon">👥</div>
                <div className="stat-trend up">↗ +24%</div>
              </div>
              <div className="stat-content">
                <div className="stat-number">{totalRegistrations.toLocaleString()}</div>
                <div className="stat-label">Total Registrations</div>
                <div className="stat-description">
                  Avg {Math.round(totalRegistrations / Math.max(events.length, 1))} per event
                </div>
              </div>
            </div>

            <div className="stat-card accent">
              <div className="stat-header">
                <div className="stat-icon">📸</div>
                <div className="stat-trend up">↗ +18%</div>
              </div>
              <div className="stat-content">
                <div className="stat-number">{totalPhotos.toLocaleString()}</div>
                <div className="stat-label">Photos Processed</div>
                <div className="stat-description">
                  Ready for automated delivery
                </div>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-header">
                <div className="stat-icon">⚡</div>
                <div className="stat-trend up">↗ +8%</div>
              </div>
              <div className="stat-content">
                <div className="stat-number">{avgPhotosPerPerson}</div>
                <div className="stat-label">Avg Photos/Person</div>
                <div className="stat-description">
                  Delivery efficiency metric
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="content-container">
          <div className="content-card">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
