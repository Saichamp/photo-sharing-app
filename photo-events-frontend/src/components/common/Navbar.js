import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Close menu on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsProfileOpen(false);
  };

  // Toggle profile dropdown (desktop)
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isProfileOpen && !e.target.closest('.profile-dropdown-container')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  // Check active link
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return user.name[0].toUpperCase();
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          
          {/* LOGO */}
          <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
            <span className="logo-icon">📸</span>
            <span className="logo-text">
              PhotoMan<span className="logo-highlight">Ea</span>
            </span>
            <span className="logo-badge">AI</span>
          </Link>

          {/* DESKTOP NAVIGATION */}
          {user ? (
            <>
              <div className="navbar-links desktop-only">
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${isActive('/dashboard') && location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/dashboard/create" 
                  className={`nav-link ${isActive('/dashboard/create') ? 'active' : ''}`}
                >
                  Create Event
                </Link>
                <Link 
                  to="/dashboard/upload" 
                  className={`nav-link ${isActive('/dashboard/upload') ? 'active' : ''}`}
                >
                  Upload Photos
                </Link>
                <Link 
                  to="/dashboard/analytics" 
                  className={`nav-link ${isActive('/dashboard/analytics') ? 'active' : ''}`}
                >
                  Analytics
                </Link>
              </div>

              {/* DESKTOP PROFILE DROPDOWN */}
              <div className="navbar-right desktop-only">
                <div className="profile-dropdown-container">
                  <button 
                    className="profile-button"
                    onClick={toggleProfile}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                  >
                    <div className="profile-avatar">{getUserInitials()}</div>
                    <span className="profile-name">{user.name}</span>
                    <svg 
                      className={`profile-arrow ${isProfileOpen ? 'open' : ''}`}
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none"
                    >
                      <path 
                        d="M4 6L8 10L12 6" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* DESKTOP DROPDOWN MENU */}
                  {isProfileOpen && (
                    <div className="profile-dropdown-menu">
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">{getUserInitials()}</div>
                        <div className="dropdown-info">
                          <span className="dropdown-name">{user.name}</span>
                          <span className="dropdown-email">{user.email}</span>
                        </div>
                      </div>
                      <div className="dropdown-divider" />
                      <Link to="/dashboard/profile" className="dropdown-item">
                        <span className="dropdown-icon">👤</span>
                        <span>My Profile</span>
                      </Link>
                      <Link to="/dashboard/billing" className="dropdown-item">
                        <span className="dropdown-icon">💳</span>
                        <span>Billing</span>
                      </Link>
                      <div className="dropdown-divider" />
                      <button onClick={handleLogout} className="dropdown-item logout">
                        <span className="dropdown-icon">🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="navbar-links desktop-only">
                <Link to="/" className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
                  Home
                </Link>
                <Link to="/features" className={`nav-link ${isActive('/features') ? 'active' : ''}`}>
                  Features
                </Link>
                <Link to="/pricing" className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}>
                  Pricing
                </Link>
              </div>

              <div className="navbar-right desktop-only">
                <Link to="/login" className="btn-login">
                  Login
                </Link>
                <Link to="/register" className="btn-signup">
                  Get Started
                </Link>
              </div>
            </>
          )}

          {/* MOBILE RIGHT SIDE */}
          <div className="mobile-right">
            {user && (
              <div className="mobile-avatar">{getUserInitials()}</div>
            )}
            <button 
              className={`mobile-menu-toggle ${isMenuOpen ? 'open' : ''}`}
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <span className="toggle-line"></span>
              <span className="toggle-line"></span>
              <span className="toggle-line"></span>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <div 
        className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-hidden="true"
      />

      {/* MOBILE FULL-SCREEN MENU */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <button 
          className="mobile-menu-close"
          onClick={toggleMenu}
          aria-label="Close menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M18 6L6 18M6 6L18 18" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="mobile-menu-content">
          {user ? (
            <>
              {/* USER INFO */}
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">{getUserInitials()}</div>
                <div className="mobile-user-details">
                  <span className="mobile-user-name">{user.name}</span>
                  <span className="mobile-user-email">{user.email}</span>
                </div>
              </div>

              {/* NAVIGATION LINKS */}
              <div className="mobile-nav-section">
                <Link 
                  to="/dashboard" 
                  className={`mobile-nav-link ${isActive('/dashboard') && location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                  <span className="mobile-link-icon">🏠</span>
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/dashboard/create" 
                  className={`mobile-nav-link ${isActive('/dashboard/create') ? 'active' : ''}`}
                >
                  <span className="mobile-link-icon">➕</span>
                  <span>Create Event</span>
                </Link>
                <Link 
                  to="/dashboard/upload" 
                  className={`mobile-nav-link ${isActive('/dashboard/upload') ? 'active' : ''}`}
                >
                  <span className="mobile-link-icon">⬆️</span>
                  <span>Upload Photos</span>
                </Link>
                <Link 
                  to="/dashboard/analytics" 
                  className={`mobile-nav-link ${isActive('/dashboard/analytics') ? 'active' : ''}`}
                >
                  <span className="mobile-link-icon">📊</span>
                  <span>Analytics</span>
                </Link>
                <Link 
                  to="/dashboard/profile" 
                  className={`mobile-nav-link ${isActive('/dashboard/profile') ? 'active' : ''}`}
                >
                  <span className="mobile-link-icon">👤</span>
                  <span>Profile</span>
                </Link>
                <Link 
                  to="/dashboard/billing" 
                  className={`mobile-nav-link ${isActive('/dashboard/billing') ? 'active' : ''}`}
                >
                  <span className="mobile-link-icon">💳</span>
                  <span>Billing</span>
                </Link>
              </div>

              {/* LOGOUT BUTTON */}
              <button onClick={handleLogout} className="mobile-logout-btn">
                <span className="mobile-link-icon">🚪</span>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              {/* NOT LOGGED IN */}
              <div className="mobile-nav-section">
                <Link to="/" className={`mobile-nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
                  <span className="mobile-link-icon">🏠</span>
                  <span>Home</span>
                </Link>
                <Link to="/features" className={`mobile-nav-link ${isActive('/features') ? 'active' : ''}`}>
                  <span className="mobile-link-icon">✨</span>
                  <span>Features</span>
                </Link>
                <Link to="/pricing" className={`mobile-nav-link ${isActive('/pricing') ? 'active' : ''}`}>
                  <span className="mobile-link-icon">💰</span>
                  <span>Pricing</span>
                </Link>
              </div>

              {/* CTA BUTTONS */}
              <div className="mobile-cta-section">
                <Link to="/login" className="mobile-cta-btn secondary">
                  Login
                </Link>
                <Link to="/register" className="mobile-cta-btn primary">
                  Get Started
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
