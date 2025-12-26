/**
 * Security Logs Page
 * Admin can view system logs, login attempts, and security events
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { requireAdmin } from '../../utils/adminHelper';
import './SecurityLogs.css';

const SecurityLogs = () => {
  const navigate = useNavigate();
  
  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    level: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalLogs: 0
  });

  // ✅ FIXED: Use useCallback to memoize fetchLogs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getLogs(filters);
      setLogs(response.data.data.logs);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ✅ Check admin access on mount
  useEffect(() => {
    if (!requireAdmin(navigate)) return;
  }, [navigate]);

  // ✅ Fetch logs when filters change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const clearFilters = () => {
    setFilters({
      level: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 50
    });
  };

  const getLevelBadge = (level) => {
    const badges = {
      info: { text: 'Info', className: 'badge-info', icon: 'ℹ️' },
      warn: { text: 'Warning', className: 'badge-warning', icon: '⚠️' },
      error: { text: 'Error', className: 'badge-error', icon: '❌' },
      success: { text: 'Success', className: 'badge-success', icon: '✅' }
    };
    return badges[level] || badges.info;
  };

  const getActionIcon = (action) => {
    const icons = {
      login: '🔐',
      logout: '🚪',
      registration: '📝',
      'user-created': '👤',
      'event-created': '🎉',
      'photo-uploaded': '📸',
      'password-changed': '🔑',
      'account-deleted': '🗑️',
      'login-failed': '🚫',
      default: '📋'
    };
    return icons[action] || icons.default;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="security-logs">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading security logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="security-logs">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>📋 Security Logs</h1>
          <p className="subtitle">
            Monitor system activity and security events
          </p>
        </div>
        <div className="header-actions">
          <button onClick={clearFilters} className="btn-clear">
            🔄 Clear Filters
          </button>
          <button onClick={fetchLogs} className="btn-refresh" disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="logs-stats">
        <div className="stat-box">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{logs.length}</div>
            <div className="stat-label">Total Logs</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">
              {logs.filter(l => l.level === 'info' || l.level === 'success').length}
            </div>
            <div className="stat-label">Success Events</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">
              {logs.filter(l => l.level === 'warn').length}
            </div>
            <div className="stat-label">Warnings</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">
              {logs.filter(l => l.level === 'error').length}
            </div>
            <div className="stat-label">Errors</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-grid">
          {/* Level Filter */}
          <div className="filter-group">
            <label>📊 Level</label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="filter-select"
            >
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="filter-group">
            <label>📅 Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* End Date */}
          <div className="filter-group">
            <label>📅 End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div className="results-info">
          Showing {logs.length} recent logs
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Logs Timeline */}
      {logs.length > 0 ? (
        <>
          <div className="logs-container">
            <div className="logs-timeline">
              {logs.map((log, index) => {
                const levelBadge = getLevelBadge(log.level);
                const actionIcon = getActionIcon(log.action);

                return (
                  <div key={index} className={`log-item log-${log.level}`}>
                    <div className="log-indicator">
                      <div className={`log-dot log-dot-${log.level}`}></div>
                      {index < logs.length - 1 && <div className="log-line"></div>}
                    </div>

                    <div className="log-card">
                      <div className="log-header">
                        <div className="log-title">
                          <span className="log-action-icon">{actionIcon}</span>
                          <span className={`badge ${levelBadge.className}`}>
                            {levelBadge.icon} {levelBadge.text}
                          </span>
                        </div>
                        <div className="log-time">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>

                      <div className="log-content">
                        <div className="log-message">{log.message}</div>
                        {log.user && (
                          <div className="log-user">
                            <span className="log-user-icon">👤</span>
                            <span className="log-user-email">{log.user}</span>
                          </div>
                        )}
                      </div>

                      <div className="log-footer">
                        <div className="log-action-type">
                          Action: <strong>{log.action}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1 || loading}
              className="pagination-btn"
            >
              ← Previous
            </button>

            <div className="pagination-info">
              Page {pagination.currentPage}
            </div>

            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={loading}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No logs found</h3>
          <p>No activity logs available for the selected filters</p>
        </div>
      )}
    </div>
  );
};

export default SecurityLogs;
