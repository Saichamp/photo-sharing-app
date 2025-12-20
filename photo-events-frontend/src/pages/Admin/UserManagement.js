import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import UserTable from '../../components/admin/UserTable';
import UserEditModal from '../../components/admin/UserEditModal';
import '../../styles/Admin.css';

const UserManagement = () => {
  const {
    fetchUsers,
    updateUser,
    resetUserPassword,
    toggleUserStatus,
    loading,
    error
  } = useAdmin();

  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    plan: ''
  });

  const loadUsers = async () => {
    try {
      const data = await fetchUsers(filters);
      setUsers(data.users || []);
    } catch {
      // handled in hook
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleSaveUser = async (id, payload) => {
    await updateUser(id, payload);
    await loadUsers();
    setSelected(null);
  };

  const handleResetPassword = async (id, newPassword) => {
    await resetUserPassword(id, newPassword);
    alert('Password reset successfully');
  };

  const handleToggleStatus = async (id) => {
    await toggleUserStatus(id);
    await loadUsers();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>User Management</h1>
      </div>

      {error && <div className="admin-alert-error">{error}</div>}

      <div className="admin-filters">
        <input
          name="search"
          placeholder="Search name or email"
          value={filters.search}
          onChange={handleFilterChange}
        />
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Disabled</option>
        </select>
        <select name="plan" value={filters.plan} onChange={handleFilterChange}>
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <UserTable users={users} onSelectUser={setSelected} />

      {loading && <div className="admin-loading">Loading...</div>}

      <UserEditModal
        user={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onSave={handleSaveUser}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
};

export default UserManagement;
