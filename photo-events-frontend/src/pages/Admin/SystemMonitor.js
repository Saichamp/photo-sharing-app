/**
 * System Monitor Page
 * Monitor system health, performance, and resources
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { requireAdmin, formatBytes, formatNumber } from '../../utils/adminHelper';
import './SystemMonitor.css';

const SystemMonitor = () => {
  const navigate = useNavigate();
  
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // ✅ FIXED: Use useCallback
  const fetchSystemData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSystemHealth();
      setSystemData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load system data');
      console.error('Error fetching system data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Check admin access on mount
  useEffect(() => {
    if (!requireAdmin(navigate)) return;
  }, [navigate]);

  // ✅ Fetch system data on mount
  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSystemData();
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchSystemData]);

  const getHealthStatus = (status) => {
    const statuses = {
      healthy: { text: 'Healthy', className: 'status-healthy', icon: '✅' },
      warning: { text: 'Warning', className: 'status-warning', icon: '⚠️' },
      critical: { text: 'Critical', className: 'status-critical', icon: '❌' }
    };
    return statuses[status] || statuses.healthy;
  };

  if (loading && !systemData) {
    return (
      <div className="system-monitor">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading system monitor...</p>
        </div>
      </div>
    );
  }

  if (error && !systemData) {
    return (
      <div className="system-monitor">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading System Data</h2>
          <p>{error}</p>
          <button onClick={fetchSystemData} className="btn-retry">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const healthStatus = getHealthStatus(systemData?.status || 'healthy');

  return (
    <div className="system-monitor">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>⚡ System Monitor</h1>
          <p className="subtitle">Real-time system health and performance</p>
        </div>
        <div className="header-actions">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (30s)</span>
          </label>
          <button onClick={fetchSystemData} className="btn-refresh" disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className={`health-banner ${healthStatus.className}`}>
        <div className="health-icon">{healthStatus.icon}</div>
        <div className="health-content">
          <h2>System Status: {healthStatus.text}</h2>
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* System Metrics */}
      <div className="metrics-grid">
        {/* Server Uptime */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⏰</span>
            <h3>Server Uptime</h3>
          </div>
          <div className="metric-value">
            {systemData?.uptime || '0 days'}
          </div>
          <div className="metric-detail">
            Started: {systemData?.startedAt ? new Date(systemData.startedAt).toLocaleString() : 'N/A'}
          </div>
        </div>

        {/* Memory Usage */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">💾</span>
            <h3>Memory Usage</h3>
          </div>
          <div className="metric-value">
            {systemData?.memory?.usedPercent || 0}%
          </div>
          <div className="metric-detail">
            {formatBytes(systemData?.memory?.used || 0)} / {formatBytes(systemData?.memory?.total || 0)}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${systemData?.memory?.usedPercent || 0}%` }}
            ></div>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🔥</span>
            <h3>CPU Usage</h3>
          </div>
          <div className="metric-value">
            {systemData?.cpu?.usage || 0}%
          </div>
          <div className="metric-detail">
            {systemData?.cpu?.cores || 0} cores available
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${systemData?.cpu?.usage || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Disk Usage */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">💽</span>
            <h3>Disk Usage</h3>
          </div>
          <div className="metric-value">
            {systemData?.disk?.usedPercent || 0}%
          </div>
          <div className="metric-detail">
            {formatBytes(systemData?.disk?.used || 0)} / {formatBytes(systemData?.disk?.total || 0)}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${systemData?.disk?.usedPercent || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Database Stats */}
      <div className="database-section">
        <h2>📊 Database Statistics</h2>
        <div className="db-stats-grid">
          <div className="db-stat-card">
            <div className="db-stat-icon">🗄️</div>
            <div className="db-stat-content">
              <div className="db-stat-value">
                {formatNumber(systemData?.database?.collections || 0)}
              </div>
              <div className="db-stat-label">Collections</div>
            </div>
          </div>

          <div className="db-stat-card">
            <div className="db-stat-icon">📄</div>
            <div className="db-stat-content">
              <div className="db-stat-value">
                {formatNumber(systemData?.database?.documents || 0)}
              </div>
              <div className="db-stat-label">Total Documents</div>
            </div>
          </div>

          <div className="db-stat-card">
            <div className="db-stat-icon">💾</div>
            <div className="db-stat-content">
              <div className="db-stat-value">
                {formatBytes(systemData?.database?.size || 0)}
              </div>
              <div className="db-stat-label">Database Size</div>
            </div>
          </div>

          <div className="db-stat-card">
            <div className="db-stat-icon">⚡</div>
            <div className="db-stat-content">
              <div className="db-stat-value">
                {systemData?.database?.avgResponseTime || 0}ms
              </div>
              <div className="db-stat-label">Avg Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* API Performance */}
      <div className="api-section">
        <h2>🚀 API Performance</h2>
        <div className="api-stats-grid">
          <div className="api-stat-card">
            <div className="api-stat-label">Total Requests Today</div>
            <div className="api-stat-value">
              {formatNumber(systemData?.api?.totalRequests || 0)}
            </div>
          </div>

          <div className="api-stat-card">
            <div className="api-stat-label">Success Rate</div>
            <div className="api-stat-value">
              {systemData?.api?.successRate || 0}%
            </div>
          </div>

          <div className="api-stat-card">
            <div className="api-stat-label">Avg Response Time</div>
            <div className="api-stat-value">
              {systemData?.api?.avgResponseTime || 0}ms
            </div>
          </div>

          <div className="api-stat-card">
            <div className="api-stat-label">Error Rate</div>
            <div className="api-stat-value">
              {systemData?.api?.errorRate || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Active Services */}
      <div className="services-section">
        <h2>🔧 Active Services</h2>
        <div className="services-list">
          {systemData?.services?.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-status">
                {service.status === 'running' ? '🟢' : '🔴'}
              </div>
              <div className="service-info">
                <div className="service-name">{service.name}</div>
                <div className="service-detail">{service.description}</div>
              </div>
              <div className="service-uptime">
                Uptime: {service.uptime || 'N/A'}
              </div>
            </div>
          ))}

          {(!systemData?.services || systemData.services.length === 0) && (
            <div className="empty-services">
              <p>No service data available</p>
            </div>
          )}
        </div>
      </div>

      {/* System Alerts */}
      {systemData?.alerts && systemData.alerts.length > 0 && (
        <div className="alerts-section">
          <h2>⚠️ System Alerts</h2>
          <div className="alerts-list">
            {systemData.alerts.map((alert, index) => (
              <div key={index} className={`alert-card alert-${alert.level}`}>
                <div className="alert-icon">
                  {alert.level === 'critical' && '❌'}
                  {alert.level === 'warning' && '⚠️'}
                  {alert.level === 'info' && 'ℹ️'}
                </div>
                <div className="alert-content">
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time">
                    {new Date(alert.timestamp).toLocaleString()}
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

export default SystemMonitor;
