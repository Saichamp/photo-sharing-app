import React from 'react';
import '../../styles/Admin.css';

const StatsCard = ({ label, value, sublabel, type = 'default' }) => {
  return (
    <div className={`admin-stat-card admin-stat-${type}`}>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      {sublabel && <div className="admin-stat-sublabel">{sublabel}</div>}
    </div>
  );
};

export default StatsCard;
