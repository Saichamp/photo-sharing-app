/**
 * Analytics Dashboard - Detailed Charts & Insights
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.get(`${API_URL}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { timeRange }
        });

        if (response.data.success) {
          setAnalytics(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [API_URL, timeRange]);

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <button onClick={() => navigate('/admin')} className="btn-back">
            ← Back to Dashboard
          </button>
          <h1>📊 Analytics Dashboard</h1>
          <p>Comprehensive insights and performance metrics</p>
        </div>

        <div className="time-range-selector">
          <button 
            className={timeRange === '7' ? 'active' : ''}
            onClick={() => setTimeRange('7')}
          >
            7 Days
          </button>
          <button 
            className={timeRange === '30' ? 'active' : ''}
            onClick={() => setTimeRange('30')}
          >
            30 Days
          </button>
          <button 
            className={timeRange === '90' ? 'active' : ''}
            onClick={() => setTimeRange('90')}
          >
            90 Days
          </button>
          <button 
            className={timeRange === 'all' ? 'active' : ''}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="overview-card">
          <div className="card-header">
            <h3>📈 Total Growth</h3>
            <span className="trend-up">+15.3%</span>
          </div>
          <div className="card-value">{analytics?.overview?.totalGrowth || '0'}%</div>
          <p className="card-subtitle">Compared to previous period</p>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3>👥 Active Users</h3>
            <span className="trend-up">+8.2%</span>
          </div>
          <div className="card-value">{analytics?.overview?.activeUsers || 0}</div>
          <p className="card-subtitle">Users this month</p>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3>🎉 Events Created</h3>
            <span className="trend-up">+12.5%</span>
          </div>
          <div className="card-value">{analytics?.overview?.eventsCreated || 0}</div>
          <p className="card-subtitle">New events this period</p>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3>📸 Photos Uploaded</h3>
            <span className="trend-up">+25.7%</span>
          </div>
          <div className="card-value">{analytics?.overview?.photosUploaded || 0}</div>
          <p className="card-subtitle">Photos in selected period</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* User Growth Chart */}
        <div className="chart-card">
          <h3>👥 User Growth Trend</h3>
          <div className="chart-placeholder">
            <p>📈 User registration chart will be displayed here</p>
            <small>Integration with Chart.js coming next</small>
          </div>
        </div>

        {/* Event Activity Chart */}
        <div className="chart-card">
          <h3>🎉 Event Activity</h3>
          <div className="chart-placeholder">
            <p>📊 Event creation timeline chart</p>
            <small>Shows events created over time</small>
          </div>
        </div>

        {/* Photo Upload Trends */}
        <div className="chart-card full-width">
          <h3>📸 Photo Upload Trends</h3>
          <div className="chart-placeholder large">
            <p>📈 Photo upload analytics with face detection stats</p>
            <small>Daily/weekly/monthly upload trends</small>
          </div>
        </div>
      </div>

      {/* Top Events */}
      <div className="top-events-section">
        <h2>🏆 Top Performing Events</h2>
        <div className="events-list">
          {analytics?.topEvents?.map((event, index) => (
            <div key={event._id} className="event-item">
              <div className="event-rank">#{index + 1}</div>
              <div className="event-info">
                <h4>{event.name}</h4>
                <p>{event.registrations} registrations · {event.photos} photos</p>
              </div>
              <div className="event-score">{event.score}pts</div>
            </div>
          )) || <p>No data available</p>}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
