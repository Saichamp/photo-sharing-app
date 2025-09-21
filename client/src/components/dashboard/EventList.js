/* eslint-disable no-unused-vars */
import React, { useState } from 'react';

const EventList = ({ events, onEventUpdate }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#2AC4A0';
      case 'completed': return '#DEA193'; 
      case 'upcoming': return '#8A8A8A';
      default: return '#8A8A8A';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'upcoming': return 'Upcoming';
      default: return 'Unknown';
    }
  };

  const copyQRCode = (qrCode) => {
    const registrationUrl = `${window.location.origin}/register/${qrCode}`;
    navigator.clipboard.writeText(registrationUrl);
    alert('Registration link copied to clipboard!');
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '25px'
      }}>
        <h2 style={{ color: '#1E2A38', margin: 0 }}>Your Events</h2>
        <div style={{ color: '#8A8A8A', fontSize: '14px' }}>
          {events.length} event{events.length !== 1 ? 's' : ''} total
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#8A8A8A'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1E2A38' }}>No events yet</h3>
          <p style={{ margin: 0 }}>Create your first event to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                background: 'white',
                border: '1px solid #f0f0f0',
                borderRadius: '15px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 4px 20px rgba(222, 161, 147, 0.15)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#1E2A38',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {event.name}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '10px'
                  }}>
                    <span style={{ color: '#8A8A8A', fontSize: '14px' }}>
                      📅 {new Date(event.date).toLocaleDateString()}
                    </span>
                    <span style={{
                      background: getStatusColor(event.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {getStatusText(event.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#DEA193' 
                  }}>
                    {event.registrations}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8A8A8A' }}>
                    Registrations
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#2AC4A0' 
                  }}>
                    {event.photosUploaded}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8A8A8A' }}>
                    Photos
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '10px',
                borderTop: '1px solid #f0f0f0',
                paddingTop: '15px'
              }}>
                <button
                  onClick={() => copyQRCode(event.qrCode)}
                  style={{
                    background: 'linear-gradient(135deg, #DEA193 0%, #C8907F 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  📋 Copy Registration Link
                </button>
                <button
                  style={{
                    background: 'transparent',
                    color: '#8A8A8A',
                    border: '1px solid #e0e0e0',
                    padding: '8px 15px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
