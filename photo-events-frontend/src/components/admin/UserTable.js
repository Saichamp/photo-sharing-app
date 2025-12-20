import React from 'react';
import '../../styles/Admin.css';

const UserTable = ({ users, onSelectUser }) => {
  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Events</th>
            <th>Photos</th>
          </tr>
        </thead>
        <tbody>
          {users?.length === 0 && (
            <tr>
              <td colSpan={6} className="admin-table-empty">
                No users found
              </td>
            </tr>
          )}
          {users?.map((user) => (
            <tr
              key={user._id}
              onClick={() => onSelectUser && onSelectUser(user)}
              className="admin-table-row"
            >
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.subscription?.plan || 'N/A'}</td>
              <td className={user.isActive ? 'status-active' : 'status-inactive'}>
                {user.isActive ? 'Active' : 'Disabled'}
              </td>
              <td>{user.eventCount ?? '-'}</td>
              <td>{user.photoCount ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
