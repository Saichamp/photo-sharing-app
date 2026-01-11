/**
 * Temporary Test Page for Admin API
 * DELETE THIS FILE after testing
 */

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const TestAdmin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Test stats endpoint
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data.data);

      // Test users endpoint
      const usersResponse = await adminAPI.getUsers({ page: 1, limit: 5 });
      setUsers(usersResponse.data.data.users);

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admin data');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin API Test</h1>
      
      <h2>Platform Stats</h2>
      {stats && (
        <pre>{JSON.stringify(stats.overview, null, 2)}</pre>
      )}

      <h2>Users (First 5)</h2>
      {users.length > 0 && (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                <td>{user.eventCount || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={fetchData} style={{ marginTop: '20px' }}>
        Refresh Data
      </button>
    </div>
  );
};

export default TestAdmin;
