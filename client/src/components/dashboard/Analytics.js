import React from 'react';

const Analytics = ({ events }) => {
  const totalEvents = events.length;
  const totalRegistrations = events.reduce((sum, event) => sum + event.registrations, 0);
  const totalPhotos = events.reduce((sum, event) => sum + event.photosUploaded, 0);
  const avgRegistrationsPerEvent = totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0;

  const eventsByStatus = events.reduce((acc, event) => {
    acc[event.status] = (acc[event.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ color: '#1E2A38', marginBottom: '25px' }}>Analytics Overview</h2>
      
      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #DEA193 0%, #C8907F 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {totalEvents}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Events</div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #2AC4A0 0%, #20A085 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {totalRegistrations}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Registrations</div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #FF6F61 0%, #E55A50 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {totalPhotos}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Photos Processed</div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #8B5A3C 0%, #7A4D33 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            {avgRegistrationsPerEvent}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Avg per Event</div>
        </div>
      </div>

      {/* Event Status Breakdown */}
      <div style={{
        background: 'white',
        border: '1px solid #f0f0f0',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '25px'
      }}>
        <h3 style={{ color: '#1E2A38', marginBottom: '20px' }}>Events by Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {Object.entries(eventsByStatus).map(([status, count]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: status === 'active' ? '#2AC4A0' : 
                           status === 'completed' ? '#DEA193' : '#8A8A8A'
              }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#1E2A38', textTransform: 'capitalize' }}>
                  {status}
                </span>
                <span style={{ color: '#8A8A8A', fontWeight: '600' }}>
                  {count} event{count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'white',
        border: '1px solid #f0f0f0',
        borderRadius: '15px',
        padding: '25px'
      }}>
        <h3 style={{ color: '#1E2A38', marginBottom: '20px' }}>Recent Events</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {events.slice(0, 5).map((event) => (
            <div key={event.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div>
                <div style={{ color: '#1E2A38', fontWeight: '600', marginBottom: '2px' }}>
                  {event.name}
                </div>
                <div style={{ color: '#8A8A8A', fontSize: '12px' }}>
                  {new Date(event.date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#DEA193', fontWeight: '600' }}>
                  {event.registrations} people
                </div>
                <div style={{ color: '#8A8A8A', fontSize: '12px' }}>
                  {event.photosUploaded} photos
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
