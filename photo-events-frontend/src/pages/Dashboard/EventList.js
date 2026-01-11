import React, { useState } from 'react';
import './EventList.css';

const EventList = ({ 
  events = [], 
  loading = false, 
  selectedEvent, 
  onEventSelect, 
  onEventUpdate, 
  onEventDelete 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  console.log('EventList received events:', events);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { color: '#10b981', bg: '#d1fae5', text: 'Active', icon: '●' };
      case 'completed':
        return { color: '#6366f1', bg: '#e0e7ff', text: 'Completed', icon: '✓' };
      case 'upcoming':
        return { color: '#f59e0b', bg: '#fef3c7', text: 'Upcoming', icon: '○' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', text: 'Draft', icon: '•' };
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // ✅ Copy Registration Link
  const copyRegistrationLink = (event, e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/register/${event.qrCode}`;
    
    navigator.clipboard.writeText(link).then(() => {
      // Show success notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 12px;
      `;
      notification.innerHTML = `
        <span style="font-size: 20px;">✓</span>
        <span>Registration link copied to clipboard!</span>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
    }).catch(err => {
      alert('Failed to copy link. Please try again.');
      console.error('Copy failed:', err);
    });
  };

  // ✅ Show Event Details
  const showEventDetails = (event, e) => {
    e.stopPropagation();
    setSelectedEventDetails(event);
    setShowDetailsModal(true);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const statusMatch = filterStatus === 'all' || event.status === filterStatus;
    const searchMatch = !searchQuery || 
      event.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  if (loading && events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="spinner" style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #a855f7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{ color: '#64748b' }}>Loading events...</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '80px 20px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📅</div>
        <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>
          No Events Yet
        </h3>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>
          Create your first event to get started with PhotoManEa!
        </p>
        <a 
          href="/dashboard/create" 
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
            color: 'white',
            borderRadius: '12px',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
          }}
        >
          + Create Your First Event
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            📋 My Events ({filteredEvents.length})
          </h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            Showing {filteredEvents.length} of {events.length} events
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
              minWidth: '200px',
              outline: 'none'
            }}
          />

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {filteredEvents.map(event => {
          const statusConfig = getStatusConfig(event.status);

          return (
            <div
              key={event._id || event.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #f1f5f9',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={(e) => showEventDetails(event, e)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              {/* Status Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                background: statusConfig.bg,
                color: statusConfig.color,
                marginBottom: '16px'
              }}>
                <span>{statusConfig.icon}</span>
                {statusConfig.text}
              </div>

              {/* Event Name */}
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 12px 0'
              }}>
                {event.name}
              </h3>

              {/* Date */}
              <p style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: '#64748b',
                fontSize: '14px',
                margin: '0 0 8px 0'
              }}>
                <span>📅</span>
                {formatDate(event.date || event.eventDate)}
              </p>

              {/* Location */}
              {event.location && (
                <p style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: '#64748b',
                  fontSize: '14px',
                  margin: '0 0 16px 0'
                }}>
                  <span>📍</span>
                  {event.location}
                </p>
              )}

              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👥</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {event.registrationCount || 0}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📸</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {event.photosUploaded || 0}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventUpdate && onEventUpdate(event);
                  }}
                  style={{
                    padding: '10px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${event.name}"?`)) {
                      onEventDelete && onEventDelete(event);
                    }
                  }}
                  style={{
                    padding: '10px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>

              {/* ✅ COPY LINK BUTTON */}
              <button
                onClick={(e) => copyRegistrationLink(event, e)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>🔗</span>
                Copy Registration Link
              </button>
            </div>
          );
        })}
      </div>

      {/* No results */}
      {filteredEvents.length === 0 && events.length > 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            No events match your search criteria
          </p>
        </div>
      )}

      {/* ✅ EVENT DETAILS MODAL */}
      {showDetailsModal && selectedEventDetails && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
                {selectedEventDetails.name}
              </h2>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                background: getStatusConfig(selectedEventDetails.status).bg,
                color: getStatusConfig(selectedEventDetails.status).color
              }}>
                <span>{getStatusConfig(selectedEventDetails.status).icon}</span>
                {getStatusConfig(selectedEventDetails.status).text}
              </div>
            </div>

            {/* Details */}
            <div style={{ marginBottom: '24px' }}>
              <DetailRow icon="📅" label="Date" value={formatDate(selectedEventDetails.date || selectedEventDetails.eventDate)} />
              <DetailRow icon="📍" label="Location" value={selectedEventDetails.location || 'Not specified'} />
              <DetailRow icon="📝" label="Description" value={selectedEventDetails.description || 'No description'} />
              <DetailRow icon="👥" label="Registrations" value={`${selectedEventDetails.registrationCount || 0} guests`} />
              <DetailRow icon="📸" label="Photos" value={`${selectedEventDetails.photosUploaded || 0} uploaded`} />
              <DetailRow icon="🔗" label="QR Code" value={selectedEventDetails.qrCode} />
            </div>

            {/* Registration Link */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', margin: '0 0 8px 0' }}>
                Registration Link:
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={`${window.location.origin}/register/${selectedEventDetails.qrCode}`}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: 'white'
                  }}
                />
                <button
                  onClick={(e) => copyRegistrationLink(selectedEventDetails, e)}
                  style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📋 Copy
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowDetailsModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Helper Component for Detail Rows
const DetailRow = ({ icon, label, value }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9'
  }}>
    <span style={{ fontSize: '20px' }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', margin: '0 0 4px 0' }}>
        {label}
      </p>
      <p style={{ fontSize: '14px', color: '#1e293b', margin: 0, wordBreak: 'break-word' }}>
        {value}
      </p>
    </div>
  </div>
);

export default EventList;
