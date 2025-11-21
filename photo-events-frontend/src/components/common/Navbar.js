import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
          <Link
            to="/dashboard"
            className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Dashboard
          </Link>
        </div>

        {/* User Menu */}
        <div className="navbar-actions">
          {/* Quota Badge */}
          <div className="quota-badge">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <span>
              {user?.quota?.eventsUsed || 0}/{user?.quota?.eventsLimit || 3} Events
            </span>
          </div>

          {/* User Dropdown */}
          <div className="user-menu">
            <button
              className="user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
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
                  <div className={`subscription-badge badge-${user?.subscription?.plan || 'free'}`}>
                    {user?.subscription?.plan?.toUpperCase() || 'FREE'}
                  </div>
                </div>

                <div className="dropdown-divider" />

                <Link to="/dashboard/profile" className="dropdown-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  Profile Settings
                </Link>

                <Link to="/dashboard/billing" className="dropdown-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                  Billing & Plans
                </Link>

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
          <Link
            to="/dashboard"
            className={`mobile-menu-link ${isActive('/dashboard') ? 'active' : ''}`}
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
          <Link
            to="/dashboard/billing"
            className="mobile-menu-link"
            onClick={() => setShowMobileMenu(false)}
          >
            Billing
          </Link>
          <button onClick={handleLogout} className="mobile-menu-link mobile-menu-logout">
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};
