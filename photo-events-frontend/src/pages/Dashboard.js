import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';
import EventList from '../components/dashboard/EventList';
import PhotoUpload from '../components/dashboard/PhotoUpload';
import Analytics from '../components/dashboard/Analytics';
import CreateEvent from '../components/dashboard/CreateEvent';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load events from backend
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAll();
      
      // Transform backend data to match frontend format
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
    // Add new event to the list
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

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <p>Loading events...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px',
          color: '#FF6F61'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h3>Backend Connection Error</h3>
          <p>{error}</p>
          <button 
            onClick={loadEvents}
            style={{
              background: '#DEA193',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Retry
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

  // Rest of your Dashboard component stays the same...
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #DEA193 0%, #C8907F 100%)',
        padding: '20px 0',
        color: 'white',
        boxShadow: '0 4px 20px rgba(222, 161, 147, 0.3)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                PhotoEvents Dashboard
              </h1>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
                Manage your events and photo sharing
              </p>
            </div>
            <button 
              onClick={() => navigate('/')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid white',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              View Registration
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#DEA193',
              marginBottom: '10px'
            }}>
              {events.length}
            </div>
            <h3 style={{ color: '#1E2A38', margin: '0 0 5px 0' }}>Total Events</h3>
            <p style={{ color: '#8A8A8A', margin: 0, fontSize: '14px' }}>
              {loading ? 'Loading...' : 'Active and completed'}
            </p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#2AC4A0',
              marginBottom: '10px'
            }}>
              {totalRegistrations}
            </div>
            <h3 style={{ color: '#1E2A38', margin: '0 0 5px 0' }}>Total Registrations</h3>
            <p style={{ color: '#8A8A8A', margin: 0, fontSize: '14px' }}>Across all events</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#FF6F61',
              marginBottom: '10px'
            }}>
              {totalPhotos}
            </div>
            <h3 style={{ color: '#1E2A38', margin: '0 0 5px 0' }}>Photos Processed</h3>
            <p style={{ color: '#8A8A8A', margin: 0, fontSize: '14px' }}>Ready for delivery</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#8B5A3C',
              marginBottom: '10px'
            }}>
              {Math.round((totalPhotos / Math.max(totalRegistrations, 1)) * 10) / 10}
            </div>
            <h3 style={{ color: '#1E2A38', margin: '0 0 5px 0' }}>Avg Photos/Person</h3>
            <p style={{ color: '#8A8A8A', margin: 0, fontSize: '14px' }}>Delivery rate</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: 'white',
          borderRadius: '15px',
          padding: '10px',
          marginBottom: '30px',
          boxShadow: '0 4px 20px rgba(222, 161, 147, 0.15)',
          gap: '5px'
        }}>
          {[
            { key: 'events', label: '📅 Events', icon: '📅' },
            { key: 'create', label: '➕ Create Event', icon: '➕' },
            { key: 'upload', label: '📸 Upload Photos', icon: '📸' },
            { key: 'analytics', label: '📊 Analytics', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '15px 20px',
                border: 'none',
                borderRadius: '10px',
                background: activeTab === tab.key 
                  ? 'linear-gradient(135deg, #DEA193 0%, #C8907F 100%)' 
                  : 'transparent',
                color: activeTab === tab.key ? 'white' : '#8A8A8A',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '14px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card" style={{ minHeight: '400px' }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
