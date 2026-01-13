import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const userMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  /* ✅ Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ✅ Close menus on route change */
  useEffect(() => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <Link to="/dashboard" className="navbar-logo">
          <div className="logo-icon-small">📸</div>
          <span className="logo-text">PhotoManEa</span>
        </Link>

        {/* Desktop Menu */}
        <div className="navbar-menu">
          <Link
            to="/dashboard"
            className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
        </div>

        {/* Right Actions */}
        <div className="navbar-actions">

          {/* User Dropdown */}
          <div className="user-menu" ref={userMenuRef}>
            <button
              className="user-menu-btn"
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user?.name || 'User'}</span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.293 7.293L10 12l4.707-4.707" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div>
                    <div className="dropdown-name">{user?.name}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                  <span className="subscription-badge">
                    {user?.subscription?.plan?.toUpperCase() || 'FREE'}
                  </span>
                </div>

                <div className="dropdown-divider" />

                <Link to="/dashboard/profile" className="dropdown-item">
                  Profile Settings
                </Link>

                <Link to="/dashboard/billing" className="dropdown-item">
                  Billing & Plans
                </Link>

                <div className="dropdown-divider" />

                <button
                  onClick={handleLogout}
                  className="dropdown-item dropdown-item-danger"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button 
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu((prev) => !prev)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>*/}
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <Link to="/dashboard" className="mobile-menu-link">
            Dashboard
          </Link>
          <Link to="/dashboard/profile" className="mobile-menu-link">
            Profile
          </Link>
          <Link to="/dashboard/billing" className="mobile-menu-link">
            Billing
          </Link>
          <button onClick={handleLogout} className="mobile-menu-link logout">
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};
