import React from 'react';
import '../../styles/Admin.css';

const SystemHealth = ({ summary }) => {
  if (!summary) {
    return <div className="admin-panel-box">No system data yet</div>;
  }

  const statusClass =
    summary.status === 'healthy'
      ? 'status-healthy'
      : summary.status === 'warning'
      ? 'status-warning'
      : 'status-critical';

  return (
    <div className="admin-panel-box">
      <div className="admin-panel-header">
        <h3>System Health</h3>
        <span className={`admin-status-pill ${statusClass}`}>
          {summary.status.toUpperCase()}
        </span>
      </div>
      <div className="admin-panel-body">
        <div className="admin-health-grid">
          <div>
            <strong>Last check:</strong>{' '}
            {summary.lastCheck
              ? new Date(summary.lastCheck).toLocaleString()
              : 'N/A'}
          </div>
          <div>
            <strong>DB:</strong> {summary.services?.database?.status || 'N/A'}
          </div>
          <div>
            <strong>Face Service:</strong>{' '}
            {summary.services?.faceService?.status || 'N/A'}
          </div>
          <div>
            <strong>Memory Used:</strong>{' '}
            {summary.memory
              ? `${summary.memory.used} / ${summary.memory.total} MB (${summary.memory.percentage}%)`
              : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
