import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Premium Navigation Header */}
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-icon">📸</span>
            <span className="brand-name">PhotoEvents</span>
            <span className="brand-badge">PRO</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
          <div className="nav-actions">
            <Link to="/dashboard" className="btn-nav-secondary">Dashboard</Link>
            <Link to="/register" className="btn-nav-primary">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Premium Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">✨</span>
              AI-Powered Event Photography Platform
            </div>
            
            <h1 className="hero-title">
              Automate Event Photo Delivery 
              <span className="title-gradient">with Intelligence</span>
            </h1>
            
            <p className="hero-subtitle">
              Stop manually sorting thousands of photos. Our AI finds and delivers 
              the perfect shots to every guest automatically. Save 200+ hours per event.
            </p>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">99.8%</span>
                <span className="stat-label">AI Accuracy</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">80%</span>
                <span className="stat-label">Time Saved</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Photos Processed</span>
              </div>
            </div>

            <div className="hero-actions">
              <Link to="/register" className="btn-hero-primary">
                <span className="btn-icon">🚀</span>
                Start Free Trial
              </Link>
              <button className="btn-hero-secondary">
                <span className="btn-icon">📹</span>
                Watch Demo
              </button>
            </div>

            <div className="social-proof">
              <p className="social-text">Trusted by 500+ event professionals worldwide</p>
              <div className="customer-logos">
                <div className="logo-item">Marriott</div>
                <div className="logo-item">Eventbrite</div>
                <div className="logo-item">WedPro</div>
                <div className="logo-item">Corporate+</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="card-header">
                <div className="card-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="card-title">PhotoEvents Dashboard</span>
              </div>
              <div className="card-content">
                <div className="demo-item">
                  <span className="demo-icon">📊</span>
                  <span className="demo-text">1,247 photos uploaded</span>
                  <span className="demo-status">✓ Processed</span>
                </div>
                <div className="demo-item">
                  <span className="demo-icon">🎯</span>
                  <span className="demo-text">AI matching completed</span>
                  <span className="demo-status">✓ 99.8%</span>
                </div>
                <div className="demo-item">
                  <span className="demo-icon">📧</span>
                  <span className="demo-text">Photos delivered to guests</span>
                  <span className="demo-status">✓ Sent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Everything you need for automated photo delivery</h2>
            <p className="section-subtitle">
              Professional tools designed for event organizers who value efficiency and results
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Face Recognition</h3>
              <p className="feature-description">
                99.8% accurate facial matching across thousands of photos using advanced AI
              </p>
              <div className="feature-metrics">
                <span className="metric">⚡ Instant processing</span>
                <span className="metric">🎯 Precision matching</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📧</div>
              <h3 className="feature-title">Automated Delivery</h3>
              <p className="feature-description">
                Send personalized photo collections directly to guests' emails automatically
              </p>
              <div className="feature-metrics">
                <span className="metric">📱 Mobile optimized</span>
                <span className="metric">🔒 Secure delivery</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Bulk Processing</h3>
              <p className="feature-description">
                Process 10,000+ photos in minutes, not hours. Scale without limits
              </p>
              <div className="feature-metrics">
                <span className="metric">🚀 Ultra fast</span>
                <span className="metric">📊 Real-time analytics</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Professional Dashboard</h3>
              <p className="feature-description">
                Complete event management with analytics, reporting, and team collaboration
              </p>
              <div className="feature-metrics">
                <span className="metric">👥 Team access</span>
                <span className="metric">📈 Detailed insights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="workflow-section">
        <div className="workflow-container">
          <h2 className="workflow-title">How PhotoEvents Works</h2>
          <div className="workflow-steps">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Upload Photos</h3>
                <p>Drag and drop your event photos. Bulk upload thousands at once.</p>
              </div>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Matches Faces</h3>
                <p>Our AI identifies and matches every person across all photos.</p>
              </div>
            </div>
            <div className="workflow-arrow">→</div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Auto Delivery</h3>
                <p>Guests receive their personalized photo collections via email.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to transform your event photography?</h2>
          <p className="cta-subtitle">Join 500+ event professionals using PhotoEvents</p>
          <div className="cta-actions">
            <Link to="/register" className="btn-cta-primary">
              Start Free Trial - No Credit Card Required
            </Link>
            <Link to="/dashboard" className="btn-cta-secondary">
              View Demo Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="brand-icon">📸</span>
            <span className="brand-name">PhotoEvents</span>
          </div>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#support">Support</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-copy">
            © 2025 PhotoEvents. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
