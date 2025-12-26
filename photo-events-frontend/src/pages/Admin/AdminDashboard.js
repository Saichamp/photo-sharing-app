/**
 * Admin Dashboard
 * Overview of platform statistics and metrics
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { 
  requireAdmin, 
  formatNumber, 
  formatBytes 
} from '../../utils/adminHelper';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ FIXED: Use useCallback to memoize fetchDashboardData
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - only runs once

  // ✅ Check admin access on mount
  useEffect(() => {
    if (!requireAdmin(navigate)) return;
  }, [navigate]);

  // ✅ Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn-retry">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <div className="error-icon">📊</div>
          <h2>No Data Available</h2>
          <p>Unable to load dashboard statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>📊 Admin Dashboard</h1>
          <p className="subtitle">Platform overview and statistics</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-refresh" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

{/* Main Stats Grid */}
<div className="stats-grid">
  {/* Total Users */}
  <div className="stat-card stat-users">
    <div className="stat-icon">👥</div>
    <div className="stat-content">
      <div className="stat-value">{formatNumber(stats?.totalUsers || 0)}</div>
      <div className="stat-label">Total Users</div>
      <div className="stat-detail">
        {stats?.activeUsers || 0} active • {stats?.inactiveUsers || 0} inactive
      </div>
    </div>
  </div>

  {/* Total Events */}
  <div className="stat-card stat-events">
    <div className="stat-icon">🎉</div>
    <div className="stat-content">
      <div className="stat-value">{formatNumber(stats?.totalEvents || 0)}</div>
      <div className="stat-label">Total Events</div>
      <div className="stat-detail">
        {stats?.activeEvents || 0} active • {stats?.completedEvents || 0} completed
      </div>
    </div>
  </div>

  {/* Total Photos */}
  <div className="stat-card stat-photos">
    <div className="stat-icon">📸</div>
    <div className="stat-content">
      <div className="stat-value">{formatNumber(stats?.totalPhotos || 0)}</div>
      <div className="stat-label">Total Photos</div>
      <div className="stat-detail">
        {formatBytes(stats?.totalStorage || 0)} storage used
      </div>
    </div>
  </div>

  {/* Total Registrations */}
  <div className="stat-card stat-registrations">
    <div className="stat-icon">📝</div>
    <div className="stat-content">
      <div className="stat-value">{formatNumber(stats?.totalRegistrations || 0)}</div>
      <div className="stat-label">Total Registrations</div>
      <div className="stat-detail">
        Guest registrations across all events
      </div>
    </div>
  </div>
</div>

{/* Secondary Stats */}
<div className="secondary-stats">
  <div className="stat-box">
    <div className="stat-icon-small">💰</div>
    <div className="stat-info">
      <div className="stat-number">{formatNumber(stats?.revenue || 0)}</div>
      <div className="stat-text">Total Revenue</div>
    </div>
  </div>

  <div className="stat-box">
    <div className="stat-icon-small">🔐</div>
    <div className="stat-info">
      <div className="stat-number">{formatNumber(stats?.securityLogs || 0)}</div>
      <div className="stat-text">Security Logs</div>
    </div>
  </div>

  <div className="stat-box">
    <div className="stat-icon-small">⚡</div>
    <div className="stat-info">
      <div className="stat-number">{stats?.systemHealth || 'Good'}</div>
      <div className="stat-text">System Health</div>
    </div>
  </div>

  <div className="stat-box">
    <div className="stat-icon-small">📊</div>
    <div className="stat-info">
      <div className="stat-number">{stats?.apiCalls || 0}</div>
      <div className="stat-text">API Calls Today</div>
    </div>
  </div>
</div>

      {/* Secondary Stats */}
      <div className="secondary-stats">
        <div className="stat-box">
          <div className="stat-icon-small">💰</div>
          <div className="stat-info">
            <div className="stat-number">{formatNumber(stats.revenue || 0)}</div>
            <div className="stat-text">Total Revenue</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-small">🔐</div>
          <div className="stat-info">
            <div className="stat-number">{formatNumber(stats.securityLogs || 0)}</div>
            <div className="stat-text">Security Logs</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-small">⚡</div>
          <div className="stat-info">
            <div className="stat-number">{stats.systemHealth || 'Good'}</div>
            <div className="stat-text">System Health</div>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-small">📊</div>
          <div className="stat-info">
            <div className="stat-number">{stats.apiCalls || 0}</div>
            <div className="stat-text">API Calls Today</div>
          </div>
        </div>
      </div>

      {/* Top Organizers */}
      {stats.topOrganizers && stats.topOrganizers.length > 0 && (
        <div className="top-organizers-section">
          <h2>🏆 Top Organizers</h2>
          <div className="organizers-grid">
            {stats.topOrganizers.map((organizer, index) => (
              <div key={organizer._id} className="organizer-card">
                <div className="organizer-rank">#{index + 1}</div>
                <div className="organizer-avatar">
                  {organizer.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="organizer-info">
                  <div className="organizer-name">{organizer.name}</div>
                  <div className="organizer-email">{organizer.email}</div>
                </div>
                <div className="organizer-stats">
                  <div className="organizer-stat">
                    <span className="stat-icon">🎉</span>
                    <span className="stat-value">{organizer.eventCount || 0}</span>
                    <span className="stat-label">Events</span>
                  </div>
                  <div className="organizer-stat">
                    <span className="stat-icon">📸</span>
                    <span className="stat-value">{organizer.photoCount || 0}</span>
                    <span className="stat-label">Photos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div className="recent-activity-section">
          <h2>🕐 Recent Activity</h2>
          <div className="activity-list">
            {stats.recentActivity.slice(0, 10).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'event' && '🎉'}
                  {activity.type === 'photo' && '📸'}
                  {activity.type === 'user' && '👤'}
                  {activity.type === 'registration' && '📝'}
                </div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <button 
            onClick={() => navigate('/admin/users')}
            className="action-btn action-users"
          >
            <span className="action-icon">👥</span>
            <span className="action-text">Manage Users</span>
          </button>

          <button 
            onClick={() => navigate('/admin/events')}
            className="action-btn action-events"
          >
            <span className="action-icon">🎉</span>
            <span className="action-text">View All Events</span>
          </button>

          <button 
            onClick={() => navigate('/admin/photos')}
            className="action-btn action-photos"
          >
            <span className="action-icon">📸</span>
            <span className="action-text">Photo Manager</span>
          </button>

          <button 
            onClick={() => navigate('/admin/logs')}
            className="action-btn action-logs"
          >
            <span className="action-icon">📋</span>
            <span className="action-text">Security Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
