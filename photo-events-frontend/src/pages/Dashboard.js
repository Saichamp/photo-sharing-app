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
      setError('Failed to load events. Make sure backend is running.');
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

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your events...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <h3 className="error-title">Connection Error</h3>
          <p className="error-message">{error}</p>
          <button onClick={loadEvents} className="btn-retry">
            Try Again
          </button>
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

  return (
    <div className="dashboard-container">
      {/* Clean Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title">PhotoEvents</h1>
            <p className="dashboard-subtitle">
              Event photo management made simple
            </p>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => navigate('/')}
              className="btn-header secondary"
            >
              View Registration
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              className="btn-header"
            >
              New Event
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon events">📅</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-number">{events.length}</div>
            <div className="stat-description">Active and completed</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon registrations">👥</div>
              <div className="stat-label">Registrations</div>
            </div>
            <div className="stat-number">{totalRegistrations}</div>
            <div className="stat-description">Total users registered</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon photos">📸</div>
              <div className="stat-label">Photos</div>
            </div>
            <div className="stat-number">{totalPhotos}</div>
            <div className="stat-description">Processed and delivered</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon avg">⚡</div>
              <div className="stat-label">Avg/Person</div>
            </div>
            <div className="stat-number">{avgPhotosPerPerson}</div>
            <div className="stat-description">Photos per user</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Navigation */}
        <div className="dashboard-nav">
          <button
            onClick={() => setActiveTab('events')}
            className={`nav-tab ${activeTab === 'events' ? 'active' : ''}`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`nav-tab ${activeTab === 'create' ? 'active' : ''}`}
          >
            Create Event
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
          >
            Upload Photos
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            Analytics
          </button>
        </div>

        {/* Content */}
        <div className="content-card">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
