import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../utils/adminHelper';
import './Navbar.css';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/dashboard" className="navbar-logo">
          <div className="logo-icon-small">📸</div>
          <span className="logo-text">PhotoManEa</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          {/* Admin Dashboard Link (Only for Admins) */}
          {isAdmin() && (
            <Link
              to="/admin/dashboard"
              className={`navbar-link admin-link ${isActive('/admin') ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Admin Panel
            </Link>
          )}

          <Link
            to="/dashboard"
            className={`navbar-link ${isActive('/dashboard') && !isActive('/admin') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Dashboard
          </Link>
        </div>

        {/* User Menu */}
        <div className="navbar-actions">
          {/* Quota Badge (Hide for admins) */}
          {!isAdmin() && (
            <div className="quota-badge">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span>
                {user?.quota?.eventsUsed || 0}/{user?.quota?.eventsLimit || 3} Events
              </span>
            </div>
          )}

          {/* Admin Badge */}
          {isAdmin() && (
            <div className="admin-badge">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Admin</span>
            </div>
          )}

          {/* User Dropdown */}
          <div className="user-menu">
            <button
              className="user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className={`user-avatar ${isAdmin() ? 'admin-avatar' : ''}`}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user?.name || 'User'}</span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-name">{user?.name}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                  <div className={`subscription-badge ${isAdmin() ? 'badge-admin' : `badge-${user?.subscription?.plan || 'free'}`}`}>
                    {isAdmin() ? 'ADMIN' : (user?.subscription?.plan?.toUpperCase() || 'FREE')}
                  </div>
                </div>

                <div className="dropdown-divider" />

                {/* Admin-specific menu items */}
                {isAdmin() && (
                  <>
                    <Link to="/admin/dashboard" className="dropdown-item">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Admin Dashboard
                    </Link>

                    <Link to="/admin/users" className="dropdown-item">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      Manage Users
                    </Link>

                    <Link to="/admin/events" className="dropdown-item">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      All Events
                    </Link>

                    <Link to="/admin/logs" className="dropdown-item">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      Security Logs
                    </Link>

                    <div className="dropdown-divider" />
                  </>
                )}

                <Link to="/dashboard/profile" className="dropdown-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  Profile Settings
                </Link>

                {!isAdmin() && (
                  <Link to="/dashboard/billing" className="dropdown-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                    </svg>
                    Billing & Plans
                  </Link>
                )}

                <div className="dropdown-divider" />

                <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          {/* Admin Links for Mobile */}
          {isAdmin() && (
            <>
              <Link
                to="/admin/dashboard"
                className={`mobile-menu-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                🎛️ Admin Dashboard
              </Link>
              <Link
                to="/admin/users"
                className="mobile-menu-link"
                onClick={() => setShowMobileMenu(false)}
              >
                👥 Manage Users
              </Link>
              <Link
                to="/admin/events"
                className="mobile-menu-link"
                onClick={() => setShowMobileMenu(false)}
              >
                🎉 All Events
              </Link>
              <Link
                to="/admin/logs"
                className="mobile-menu-link"
                onClick={() => setShowMobileMenu(false)}
              >
                📋 Security Logs
              </Link>
              <div className="mobile-menu-divider" />
            </>
          )}

          <Link
            to="/dashboard"
            className={`mobile-menu-link ${isActive('/dashboard') && !isActive('/admin') ? 'active' : ''}`}
            onClick={() => setShowMobileMenu(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/dashboard/profile"
            className="mobile-menu-link"
            onClick={() => setShowMobileMenu(false)}
          >
            Profile
          </Link>
          {!isAdmin() && (
            <Link
              to="/dashboard/billing"
              className="mobile-menu-link"
              onClick={() => setShowMobileMenu(false)}
            >
              Billing
            </Link>
          )}
          <button onClick={handleLogout} className="mobile-menu-link mobile-menu-logout">
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};
