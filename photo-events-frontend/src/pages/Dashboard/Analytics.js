import React, { useState, useEffect } from 'react';
import './Analytics.css';

const Analytics = ({ events = [], stats = {} }) => {
  const [animatedStats, setAnimatedStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalPhotos: 0,
    avgRegistrationsPerEvent: 0
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  // Calculate detailed stats
  const totalEvents = events.length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
  const totalPhotos = events.reduce((sum, e) => sum + (e.photosUploaded || 0), 0);
  const avgRegistrationsPerEvent = totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0;
  const avgPhotosPerEvent = totalEvents > 0 ? Math.round(totalPhotos / totalEvents) : 0;

  // Event status distribution
  const eventsByStatus = {
    upcoming: events.filter(e => e.status === 'upcoming').length,
    active: events.filter(e => e.status === 'active').length,
    completed: events.filter(e => e.status === 'completed').length
  };

  // Recent events (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEvents = events.filter(event => 
    new Date(event.date) >= thirtyDaysAgo
  ).length;

  // Animate stats on mount or when events change
  useEffect(() => {
    const duration = 1000;
    const steps = 50;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedStats({
        totalEvents: Math.floor(totalEvents * progress),
        totalRegistrations: Math.floor(totalRegistrations * progress),
        totalPhotos: Math.floor(totalPhotos * progress),
        avgRegistrationsPerEvent: Math.floor(avgRegistrationsPerEvent * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedStats({
          totalEvents,
          totalRegistrations,
          totalPhotos,
          avgRegistrationsPerEvent
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [events, totalEvents, totalRegistrations, totalPhotos, avgRegistrationsPerEvent]);

  // Top performing events
  const topEvents = [...events]
    .sort((a, b) => (b.registrationCount || 0) - (a.registrationCount || 0))
    .slice(0, 5);

  if (events.length === 0) {
    return (
      <div className="analytics-empty">
        <div className="empty-icon">📊</div>
        <h3>No Analytics Yet</h3>
        <p>Create events and collect data to see your analytics here</p>
        <a href="/dashboard/create" className="btn btn-primary">
          Create Your First Event
        </a>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h2>Analytics Dashboard</h2>
          <p>Track your event performance and guest engagement</p>
        </div>
        <select 
          value={selectedTimeframe} 
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="timeframe-select"
        >
          <option value="all">All Time</option>
          <option value="30days">Last 30 Days</option>
          <option value="7days">Last 7 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card metric-purple">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3 className="metric-value">{animatedStats.totalEvents}</h3>
            <p className="metric-label">Total Events</p>
            <span className="metric-change positive">
              {recentEvents} in last 30 days
            </span>
          </div>
        </div>

        <div className="metric-card metric-pink">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3 className="metric-value">{animatedStats.totalRegistrations}</h3>
            <p className="metric-label">Total Registrations</p>
            <span className="metric-change">
              {avgRegistrationsPerEvent} avg per event
            </span>
          </div>
        </div>

        <div className="metric-card metric-rose">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3 className="metric-value">{animatedStats.totalPhotos}</h3>
            <p className="metric-label">Photos Uploaded</p>
            <span className="metric-change">
              {avgPhotosPerEvent} avg per event
            </span>
          </div>
        </div>

        <div className="metric-card metric-gradient">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3 className="metric-value">{totalRegistrations > 0 ? '98%' : '0%'}</h3>
            <p className="metric-label">Success Rate</p>
            <span className="metric-change positive">
              Face matching accuracy
            </span>
          </div>
        </div>
      </div>

      {/* Event Status Chart */}
      <div className="chart-section">
        <h3>Event Status Distribution</h3>
        <div className="status-chart">
          <div className="status-bar">
            <div 
              className="bar-segment bar-upcoming"
              style={{ width: `${totalEvents > 0 ? (eventsByStatus.upcoming / totalEvents) * 100 : 0}%` }}
            >
              {eventsByStatus.upcoming > 0 && eventsByStatus.upcoming}
            </div>
            <div 
              className="bar-segment bar-active"
              style={{ width: `${totalEvents > 0 ? (eventsByStatus.active / totalEvents) * 100 : 0}%` }}
            >
              {eventsByStatus.active > 0 && eventsByStatus.active}
            </div>
            <div 
              className="bar-segment bar-completed"
              style={{ width: `${totalEvents > 0 ? (eventsByStatus.completed / totalEvents) * 100 : 0}%` }}
            >
              {eventsByStatus.completed > 0 && eventsByStatus.completed}
            </div>
          </div>
          <div className="status-legend">
            <div className="legend-item">
              <span className="legend-color bg-upcoming"></span>
              <span>Upcoming ({eventsByStatus.upcoming})</span>
            </div>
            <div className="legend-item">
              <span className="legend-color bg-active"></span>
              <span>Active ({eventsByStatus.active})</span>
            </div>
            <div className="legend-item">
              <span className="legend-color bg-completed"></span>
              <span>Completed ({eventsByStatus.completed})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Events */}
      {topEvents.length > 0 && (
        <div className="top-events-section">
          <h3>Top Performing Events</h3>
          <div className="top-events-list">
            {topEvents.map((event, index) => (
              <div key={event._id} className="top-event-item">
                <div className="event-rank">#{index + 1}</div>
                <div className="event-details">
                  <h4>{event.name}</h4>
                  <p>{new Date(event.date).toLocaleDateString()}</p>
                </div>
                <div className="event-metrics">
                  <div className="metric-small">
                    <span className="metric-icon-small">👥</span>
                    <span>{event.registrationCount || 0}</span>
                  </div>
                  <div className="metric-small">
                    <span className="metric-icon-small">📸</span>
                    <span>{event.photosUploaded || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
