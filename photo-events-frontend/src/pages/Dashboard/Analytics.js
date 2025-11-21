import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { eventAPI } from '../../services/api';
import { formatters } from '../../utils/formatters';
import { Loader } from '../../components/common/Loader';
import './Analytics.css';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // all, month, week

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await eventAPI.getAll();
        const eventsData = response.data?.events || [];

        // Calculate analytics
        const totalEvents = eventsData.length;
        const upcomingEvents = eventsData.filter(e => e.status === 'upcoming').length;
        const activeEvents = eventsData.filter(e => e.status === 'active').length;
        const completedEvents = eventsData.filter(e => e.status === 'completed').length;
        
        const totalPhotos = eventsData.reduce((sum, e) => sum + (e.photosUploaded || 0), 0);
        const totalGuests = eventsData.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
        const totalExpectedGuests = eventsData.reduce((sum, e) => sum + (e.expectedGuests || 0), 0);
        
        const totalStorage = eventsData.reduce((sum, e) => sum + (e.storageUsed || 0), 0);
        const avgPhotosPerEvent = totalEvents > 0 ? Math.round(totalPhotos / totalEvents) : 0;
        const avgGuestsPerEvent = totalEvents > 0 ? Math.round(totalGuests / totalEvents) : 0;

        // Event performance
        const topEvents = [...eventsData]
          .sort((a, b) => (b.photosUploaded || 0) - (a.photosUploaded || 0))
          .slice(0, 5);

        // Monthly distribution
        const monthlyData = calculateMonthlyData(eventsData);

        setAnalytics({
          overview: {
            totalEvents,
            upcomingEvents,
            activeEvents,
            completedEvents,
            totalPhotos,
            totalGuests,
            totalExpectedGuests,
            totalStorage,
            avgPhotosPerEvent,
            avgGuestsPerEvent
          },
          topEvents,
          monthlyData
        });
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  const calculateMonthlyData = (events) => {
    const months = {};
    events.forEach(event => {
      const month = new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!months[month]) {
        months[month] = { events: 0, photos: 0, guests: 0 };
      }
      months[month].events++;
      months[month].photos += event.photosUploaded || 0;
      months[month].guests += event.registrationCount || 0;
    });
    return Object.entries(months).slice(-6); // Last 6 months
  };

  if (loading) {
    return <Loader size="lg" text="Loading analytics..." />;
  }

  if (!analytics) {
    return (
      <div className="error-state">
        <p>Failed to load analytics</p>
      </div>
    );
  }

  const { overview, topEvents, monthlyData } = analytics;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h2>Analytics Dashboard</h2>
          <p>Track your event performance and insights</p>
        </div>
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
          <button
            className={`time-range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
          <button
            className={`time-range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="metric-card purple">
          <div className="metric-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{overview.totalEvents}</div>
            <div className="metric-label">Total Events</div>
            <div className="metric-breakdown">
              <span>{overview.upcomingEvents} upcoming</span>
              <span>•</span>
              <span>{overview.activeEvents} active</span>
            </div>
          </div>
        </div>

        <div className="metric-card pink">
          <div className="metric-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatters.number(overview.totalPhotos)}</div>
            <div className="metric-label">Photos Uploaded</div>
            <div className="metric-breakdown">
              <span>Avg {overview.avgPhotosPerEvent} per event</span>
            </div>
          </div>
        </div>

        <div className="metric-card rose">
          <div className="metric-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatters.number(overview.totalGuests)}</div>
            <div className="metric-label">Registered Guests</div>
            <div className="metric-breakdown">
              <span>
                {formatters.percentage(overview.totalGuests, overview.totalExpectedGuests)} of expected
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card gradient">
          <div className="metric-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatters.fileSize(overview.totalStorage)}</div>
            <div className="metric-label">Storage Used</div>
            <div className="metric-breakdown">
              <span>
                {formatters.percentage(overview.totalStorage, user?.quota?.storageLimit || 1073741824)} of quota
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts">
        {/* Monthly Trend */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Monthly Trend</h3>
            <span className="chart-subtitle">Last 6 months</span>
          </div>
          <div className="chart-body">
            {monthlyData.length > 0 ? (
              <div className="bar-chart">
                {monthlyData.map(([month, data], index) => {
                  const maxValue = Math.max(...monthlyData.map(([, d]) => d.events));
                  const height = (data.events / maxValue) * 100;
                  
                  return (
                    <div key={index} className="bar-item">
                      <div className="bar-wrapper">
                        <div 
                          className="bar"
                          style={{ height: `${height}%` }}
                          title={`${data.events} events`}
                        >
                          <span className="bar-value">{data.events}</span>
                        </div>
                      </div>
                      <div className="bar-label">{month.split(' ')[0]}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-chart">
                <p>No data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Event Status Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Event Status</h3>
            <span className="chart-subtitle">Current distribution</span>
          </div>
          <div className="chart-body">
            <div className="donut-chart">
              <div className="donut-center">
                <div className="donut-value">{overview.totalEvents}</div>
                <div className="donut-label">Total</div>
              </div>
              <div className="donut-segments">
                {overview.upcomingEvents > 0 && (
                  <div className="donut-segment upcoming">
                    <div className="segment-bar" style={{ width: `${(overview.upcomingEvents / overview.totalEvents) * 100}%` }} />
                  </div>
                )}
                {overview.activeEvents > 0 && (
                  <div className="donut-segment active">
                    <div className="segment-bar" style={{ width: `${(overview.activeEvents / overview.totalEvents) * 100}%` }} />
                  </div>
                )}
                {overview.completedEvents > 0 && (
                  <div className="donut-segment completed">
                    <div className="segment-bar" style={{ width: `${(overview.completedEvents / overview.totalEvents) * 100}%` }} />
                  </div>
                )}
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot upcoming"></span>
                <span className="legend-label">Upcoming ({overview.upcomingEvents})</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot active"></span>
                <span className="legend-label">Active ({overview.activeEvents})</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot completed"></span>
                <span className="legend-label">Completed ({overview.completedEvents})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Events */}
      <div className="top-events-section">
        <h3>Top Performing Events</h3>
        {topEvents.length > 0 ? (
          <div className="top-events-list">
            {topEvents.map((event, index) => (
              <div key={event._id} className="top-event-item">
                <div className="event-rank">#{index + 1}</div>
                <div className="event-info">
                  <h4>{event.name}</h4>
                  <p>{formatters.dateShort(event.date)} • {event.location}</p>
                </div>
                <div className="event-metrics">
                  <div className="event-metric">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                    <span>{event.photosUploaded || 0} photos</span>
                  </div>
                  <div className="event-metric">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3z"/>
                    </svg>
                    <span>{event.registrationCount || 0} guests</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No events yet. Create your first event to see analytics!</p>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h3>Quick Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
            </div>
            <div>
              <h4>Event Completion Rate</h4>
              <p className="insight-value">
                {overview.totalEvents > 0 
                  ? formatters.percentage(overview.completedEvents, overview.totalEvents)
                  : '0%'}
              </p>
              <p className="insight-desc">
                {overview.completedEvents} of {overview.totalEvents} events completed
              </p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <div>
              <h4>Guest Registration Rate</h4>
              <p className="insight-value">
                {overview.totalExpectedGuests > 0
                  ? formatters.percentage(overview.totalGuests, overview.totalExpectedGuests)
                  : '0%'}
              </p>
              <p className="insight-desc">
                {overview.totalGuests} of {overview.totalExpectedGuests} expected guests registered
              </p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
            </div>
            <div>
              <h4>Storage Usage</h4>
              <p className="insight-value">
                {user?.quota?.storageLimit 
                  ? formatters.percentage(overview.totalStorage, user.quota.storageLimit)
                  : '0%'}
              </p>
              <p className="insight-desc">
                {formatters.fileSize(overview.totalStorage)} of {formatters.fileSize(user?.quota?.storageLimit || 1073741824)} used
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
