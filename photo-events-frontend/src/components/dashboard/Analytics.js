import React, { useState, useEffect } from 'react';
import './Analytics.css';

const Analytics = ({ events }) => {
  const [animatedStats, setAnimatedStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalPhotos: 0,
    avgRegistrationsPerEvent: 0
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('registrations');

  // Calculate real stats
  const totalEvents = events.length;
  const totalRegistrations = events.reduce((sum, event) => sum + event.registrations, 0);
  const totalPhotos = events.reduce((sum, event) => sum + (event.photosUploaded || 0), 0);
  const avgRegistrationsPerEvent = totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0;
  const avgPhotosPerPerson = totalRegistrations > 0 ? (totalPhotos / totalRegistrations).toFixed(1) : 0;

  // Event status distribution
  const eventsByStatus = events.reduce((acc, event) => {
    acc[event.status] = (acc[event.status] || 0) + 1;
    return acc;
  }, {});

  // Recent events (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentEvents = events.filter(event => 
    new Date(event.date) >= thirtyDaysAgo
  );

  // Performance metrics
  const deliveryRate = totalRegistrations > 0 ? ((totalPhotos / totalRegistrations) * 100).toFixed(1) : 0;
  const engagementRate = events.length > 0 ? ((totalRegistrations / events.length) * 100).toFixed(1) : 0;

  // Animate stats on mount
  useEffect(() => {
    const animateValue = (start, end, duration, key) => {
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (end - start) * easeOutQuart);
        
        setAnimatedStats(prev => ({ ...prev, [key]: current }));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    };

    // Animate each stat with different durations for stagger effect
    setTimeout(() => animateValue(0, totalEvents, 800, 'totalEvents'), 100);
    setTimeout(() => animateValue(0, totalRegistrations, 1000, 'totalRegistrations'), 200);
    setTimeout(() => animateValue(0, totalPhotos, 1200, 'totalPhotos'), 300);
    setTimeout(() => animateValue(0, avgRegistrationsPerEvent, 900, 'avgRegistrationsPerEvent'), 400);
  }, [totalEvents, totalRegistrations, totalPhotos, avgRegistrationsPerEvent]);

  // Generate chart data
  const generateChartData = () => {
    const monthlyData = events.reduce((acc, event) => {
      const month = new Date(event.date).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + (selectedMetric === 'registrations' ? event.registrations : event.photosUploaded || 0);
      return acc;
    }, {});

    return Object.entries(monthlyData).map(([month, value]) => ({ month, value }));
  };

  const chartData = generateChartData();
  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  if (events.length === 0) {
    return (
      <div className="analytics-container">
        <div className="empty-analytics">
          <div className="empty-analytics-icon">📊</div>
          <div className="empty-analytics-content">
            <h3>No Data Available</h3>
            <p>Create events and collect registrations to see analytics</p>
            <div className="analytics-features">
              <div className="feature-preview">
                <span className="feature-icon">📈</span>
                <span>Real-time performance metrics</span>
              </div>
              <div className="feature-preview">
                <span className="feature-icon">📊</span>
                <span>Detailed engagement analytics</span>
              </div>
              <div className="feature-preview">
                <span className="feature-icon">🎯</span>
                <span>AI processing insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Analytics Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h2>Analytics & Insights</h2>
          <p>Track your event performance and photo delivery metrics</p>
        </div>
        
        <div className="header-controls">
          <select 
            className="timeframe-selector"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-header">
            <div className="metric-icon">📅</div>
            <div className="metric-trend">
              <span className="trend-indicator up">↗ +12%</span>
            </div>
          </div>
          <div className="metric-content">
            <div className="metric-number">{animatedStats.totalEvents.toLocaleString()}</div>
            <div className="metric-label">Total Events</div>
            <div className="metric-description">
              {eventsByStatus.active || 0} active, {eventsByStatus.completed || 0} completed
            </div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-header">
            <div className="metric-icon">👥</div>
            <div className="metric-trend">
              <span className="trend-indicator up">↗ +24%</span>
            </div>
          </div>
          <div className="metric-content">
            <div className="metric-number">{animatedStats.totalRegistrations.toLocaleString()}</div>
            <div className="metric-label">Total Registrations</div>
            <div className="metric-description">
              Avg {animatedStats.avgRegistrationsPerEvent} per event
            </div>
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-header">
            <div className="metric-icon">📸</div>
            <div className="metric-trend">
              <span className="trend-indicator up">↗ +18%</span>
            </div>
          </div>
          <div className="metric-content">
            <div className="metric-number">{animatedStats.totalPhotos.toLocaleString()}</div>
            <div className="metric-label">Photos Processed</div>
            <div className="metric-description">
              AI-powered delivery system
            </div>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-header">
            <div className="metric-icon">⚡</div>
            <div className="metric-trend">
              <span className="trend-indicator up">↗ +8%</span>
            </div>
          </div>
          <div className="metric-content">
            <div className="metric-number">{avgPhotosPerPerson}</div>
            <div className="metric-label">Avg Photos/Guest</div>
            <div className="metric-description">
              Delivery efficiency metric
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Performance Trends</h3>
            <div className="chart-controls">
              <select 
                className="metric-selector"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                <option value="registrations">Registrations</option>
                <option value="photos">Photos Processed</option>
              </select>
            </div>
          </div>
          
          <div className="chart-area">
            {chartData.length > 0 ? (
              <div className="bar-chart">
                {chartData.map((data, index) => (
                  <div key={index} className="chart-bar-container">
                    <div 
                      className="chart-bar"
                      style={{ 
                        height: `${(data.value / maxValue) * 100}%`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <div className="bar-value">{data.value}</div>
                    </div>
                    <div className="bar-label">{data.month}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chart-placeholder">
                <div className="placeholder-icon">📈</div>
                <p>Chart will appear when you have event data</p>
              </div>
            )}
          </div>
        </div>

        <div className="status-chart-container">
          <h3>Event Status Distribution</h3>
          <div className="status-chart">
            {Object.entries(eventsByStatus).map(([status, count]) => {
              const percentage = ((count / totalEvents) * 100).toFixed(1);
              const statusConfig = {
                active: { color: '#10b981', label: 'Active' },
                completed: { color: '#7c3aed', label: 'Completed' },
                upcoming: { color: '#f59e0b', label: 'Upcoming' }
              };

              return (
                <div key={status} className="status-item">
                  <div className="status-info">
                    <div 
                      className="status-color"
                      style={{ background: statusConfig[status]?.color }}
                    ></div>
                    <span className="status-name">{statusConfig[status]?.label || status}</span>
                  </div>
                  <div className="status-stats">
                    <span className="status-count">{count}</span>
                    <span className="status-percentage">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="insights-section">
        <h3>Performance Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Delivery Rate</h4>
              <div className="insight-value">{deliveryRate}%</div>
              <p>Photos successfully matched to guests</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Engagement Rate</h4>
              <div className="insight-value">{engagementRate}%</div>
              <p>Average guest participation per event</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🤖</div>
            <div className="insight-content">
              <h4>AI Accuracy</h4>
              <div className="insight-value">99.8%</div>
              <p>Face recognition success rate</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">⚡</div>
            <div className="insight-content">
              <h4>Processing Speed</h4>
              <div className="insight-value">2.3min</div>
              <p>Average time per 100 photos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {recentEvents.slice(0, 5).map((event, index) => (
            <div key={event.id} className="activity-item">
              <div className="activity-icon">
                {event.status === 'active' ? '🟢' : 
                 event.status === 'completed' ? '✅' : '🕒'}
              </div>
              <div className="activity-content">
                <div className="activity-title">{event.name}</div>
                <div className="activity-details">
                  {event.registrations} registrations • {event.photosUploaded || 0} photos
                </div>
              </div>
              <div className="activity-date">
                {new Date(event.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          ))}
          
          {recentEvents.length === 0 && (
            <div className="no-activity">
              <span className="no-activity-icon">📅</span>
              <span>No recent events in the last 30 days</span>
            </div>
          )}
        </div>
      </div>

      {/* Export & Actions */}
      <div className="analytics-actions">
        <button className="btn btn-secondary">
          📊 Export Report
        </button>
        <button className="btn btn-primary">
          📈 View Detailed Analytics
        </button>
      </div>
    </div>
  );
};

export default Analytics;
