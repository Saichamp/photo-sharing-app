import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import StatsCard from '../../components/admin/StatsCard';
import SystemHealth from '../../components/admin/SystemHealth';
import '../../styles/Admin.css';

const AdminDashboard = () => {
  const { fetchStats, fetchSystemSummary, loading, error } = useAdmin();
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, sys] = await Promise.all([
          fetchStats(),
          fetchSystemSummary()
        ]);
        if (mounted) {
          setStats(s);
          setSummary(sys);
        }
      } catch {
        // handled in hook
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fetchStats, fetchSystemSummary]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Admin Dashboard</h1>
      </div>

      {error && <div className="admin-alert-error">{error}</div>}

      <div className="admin-stats-row">
        <StatsCard
          label="Total Users"
          value={stats?.users?.total ?? '-'}
          sublabel={`Active: ${stats?.users?.active ?? '-'}`}
          type="primary"
        />
        <StatsCard
          label="Total Events"
          value={stats?.events?.total ?? '-'}
          type="secondary"
        />
        <StatsCard
          label="Total Photos"
          value={stats?.photos?.total ?? '-'}
          sublabel={`Failed: ${stats?.photos?.failed ?? '-'}`}
          type="warning"
        />
      </div>

      <SystemHealth summary={summary} />

      {loading && <div className="admin-loading">Loading...</div>}
    </div>
  );
};

export default AdminDashboard;
