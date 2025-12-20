import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import SystemHealth from '../../components/admin/SystemHealth';
import '../../styles/Admin.css';

const SystemMonitor = () => {
  const {
    fetchSystemSummary,
    fetchSystemHealth,
    fetchSystemTrend,
    loading,
    error
  } = useAdmin();

  const [summary, setSummary] = useState(null);
  const [lastHealth, setLastHealth] = useState(null);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [sum, health, t] = await Promise.all([
          fetchSystemSummary(),
          fetchSystemHealth(),
          fetchSystemTrend(24)
        ]);
        if (!mounted) return;
        setSummary(sum);
        setLastHealth(health);
        setTrend(t.trend || []);
      } catch {
        // handled in hook
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchSystemSummary, fetchSystemHealth, fetchSystemTrend]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>System Monitor</h1>
      </div>

      {error && <div className="admin-alert-error">{error}</div>}

      <SystemHealth summary={summary} />

      <div className="admin-panel-box">
        <div className="admin-panel-header">
          <h3>Latest Snapshot</h3>
        </div>
        <pre className="admin-json-preview">
          {lastHealth ? JSON.stringify(lastHealth, null, 2) : 'No data'}
        </pre>
      </div>

      <div className="admin-panel-box">
        <div className="admin-panel-header">
          <h3>Health Trend (last 24h)</h3>
        </div>
        <div className="admin-trend-list">
          {trend.length === 0 && <div>No trend data</div>}
          {trend.map((t) => (
            <div key={t._id || t.timestamp} className="admin-trend-item">
              <span>
                {new Date(t.timestamp).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span>Status: {t.status}</span>
              {t.memory && (
                <span>Mem: {t.memory.percentage}%</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {loading && <div className="admin-loading">Loading...</div>}
    </div>
  );
};

export default SystemMonitor;
