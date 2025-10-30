import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <div className="landing-card">
        {/* Header Section */}
        <div className="landing-header">
          <h1 className="landing-title">PhotoEvents</h1>
          <p className="landing-subtitle">
            AI-Powered Event Photography Made Simple
          </p>
          <p className="landing-description">
            Automatically find and deliver photos to guests using facial recognition
          </p>
        </div>

        {/* Action Buttons - Same functionality, new design */}
        <div className="landing-actions">
          <Link to="/register" className="landing-btn btn-guest">
            <span className="btn-icon">👤</span>
            Guest Registration
          </Link>
          
          <Link to="/dashboard" className="landing-btn btn-organizer">
            <span className="btn-icon">📊</span>
            Event Organizer Dashboard
          </Link>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h3 className="features-title">Why Choose PhotoEvents?</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              AI Face Recognition
            </div>
            <div className="feature-item">
              <span className="feature-icon">📧</span>
              Auto Email Delivery
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              Instant Processing
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              Secure & Private
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
