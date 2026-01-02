import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="landing-page">
      {/* Premium Navigation Header */}
      <nav className={`nav-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-icon">📸</span>
            <span className="brand-name">PhotoManEa</span>
            <span className="brand-badge">AI</span>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#testimonials" className="nav-link">Testimonials</a>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="btn-nav-secondary">Login</Link>
            <Link to="/register" className="btn-nav-primary">
              <span className="btn-text">Start Free Trial</span>
              <span className="btn-icon-arrow">→</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <a href="#features" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="mobile-link-icon">✨</span>
              Features
            </a>
            <a href="#how-it-works" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="mobile-link-icon">⚙️</span>
              How It Works
            </a>
            <a href="#pricing" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="mobile-link-icon">💎</span>
              Pricing
            </a>
            <a href="#testimonials" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="mobile-link-icon">⭐</span>
              Testimonials
            </a>
            <div className="mobile-menu-divider"></div>
            <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="mobile-link-icon">🔐</span>
              Login
            </Link>
            <Link to="/register" className="mobile-cta-btn">
              Start Free Trial →
            </Link>
          </div>
        </div>
      </nav>

      {/* Premium Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-blob hero-blob-1"></div>
          <div className="hero-blob hero-blob-2"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge animate-fade-in">
              <span className="badge-icon">✨</span>
              <span className="badge-text">AI-Powered Event Photography Platform</span>
            </div>
            
            <h1 className="hero-title animate-slide-up">
              Automate Event Photo Delivery 
              <span className="title-gradient"> with AI Intelligence</span>
            </h1>
            
            <p className="hero-subtitle animate-slide-up delay-1">
              Stop manually sorting thousands of photos. Our AI finds and delivers 
              the perfect shots to every guest automatically. 
              <strong>Save 200+ hours per event.</strong>
            </p>

            <div className="hero-stats animate-slide-up delay-2">
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
                <span className="stat-label">Photos/Day</span>
              </div>
            </div>

            <div className="hero-actions animate-slide-up delay-3">
              <Link to="/register" className="btn-hero-primary">
                <span className="btn-icon">🚀</span>
                <span className="btn-content">
                  <span className="btn-text">Start Free Trial</span>
                  <span className="btn-subtext">No credit card required</span>
                </span>
              </Link>
              <button className="btn-hero-secondary">
                <span className="btn-icon">▶️</span>
                <span className="btn-text">Watch Demo</span>
              </button>
            </div>

            <div className="social-proof animate-fade-in delay-4">
              <div className="trust-avatars">
                <div className="avatar">👨‍💼</div>
                <div className="avatar">👩‍💼</div>
                <div className="avatar">👨‍🎨</div>
                <div className="avatar">👩‍🎓</div>
                <div className="avatar-count">+500</div>
              </div>
              <p className="social-text">
                <strong>500+ event professionals</strong> trust PhotoManEa worldwide
              </p>
            </div>
          </div>

          <div className="hero-visual animate-fade-in delay-2">
            <div className="visual-card">
              <div className="card-header">
                <div className="card-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="card-title">📊 Live Dashboard</span>
              </div>
              
              <div className="card-content">
                <div className="demo-item processing">
                  <span className="demo-icon">📸</span>
                  <div className="demo-details">
                    <span className="demo-text">1,247 photos uploaded</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '100%'}}></div>
                    </div>
                  </div>
                  <span className="demo-status success">✓</span>
                </div>

                <div className="demo-item">
                  <span className="demo-icon">🤖</span>
                  <div className="demo-details">
                    <span className="demo-text">AI face matching</span>
                    <div className="progress-bar">
                      <div className="progress-fill active" style={{width: '73%'}}></div>
                    </div>
                  </div>
                  <span className="demo-status">73%</span>
                </div>

                <div className="demo-item">
                  <span className="demo-icon">✉️</span>
                  <div className="demo-details">
                    <span className="demo-text">Auto-delivery queue</span>
                    <span className="demo-subtext">156 guests pending</span>
                  </div>
                  <span className="demo-status pending">⏳</span>
                </div>

                <div className="demo-item">
                  <span className="demo-icon">📊</span>
                  <div className="demo-details">
                    <span className="demo-text">Match confidence</span>
                    <span className="demo-subtext">Excellent accuracy</span>
                  </div>
                  <span className="demo-status success">99.8%</span>
                </div>
              </div>

              <div className="card-footer">
                <button className="card-action-btn">
                  <span>View Full Report</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="floating-element float-1">
              <div className="float-icon">⚡</div>
              <div className="float-text">Instant Processing</div>
            </div>
            <div className="floating-element float-2">
              <div className="float-icon">🎯</div>
              <div className="float-text">99.8% Accurate</div>
            </div>
            <div className="floating-element float-3">
              <div className="float-icon">🚀</div>
              <div className="float-text">Save 200h/event</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="section-header">
            <div className="section-badge">
              <span className="badge-sparkle">✨</span>
              POWERFUL FEATURES
            </div>
            <h2 className="section-title">Everything you need for automated photo delivery</h2>
            <p className="section-subtitle">
              Professional tools designed for event organizers who value efficiency and results
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🤖</div>
                <div className="feature-glow"></div>
              </div>
              <h3 className="feature-title">AI Face Recognition</h3>
              <p className="feature-description">
                99.8% accurate facial matching across thousands of photos using advanced deep learning algorithms
              </p>
              <div className="feature-metrics">
                <span className="metric">
                  <span className="metric-icon">⚡</span>
                  Instant processing
                </span>
                <span className="metric">
                  <span className="metric-icon">🎯</span>
                  Precision matching
                </span>
              </div>
              <div className="feature-link">
                Learn more <span>→</span>
              </div>
            </div>

            <div className="feature-card featured">
              <div className="featured-badge">MOST POPULAR</div>
              <div className="feature-icon-wrapper">
                <div className="feature-icon">📧</div>
                <div className="feature-glow"></div>
              </div>
              <h3 className="feature-title">Automated Delivery</h3>
              <p className="feature-description">
                Send personalized photo collections directly to guests' emails automatically with customizable templates
              </p>
              <div className="feature-metrics">
                <span className="metric">
                  <span className="metric-icon">📱</span>
                  Mobile optimized
                </span>
                <span className="metric">
                  <span className="metric-icon">🔒</span>
                  Secure delivery
                </span>
              </div>
              <div className="feature-link">
                Learn more <span>→</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">⚡</div>
                <div className="feature-glow"></div>
              </div>
              <h3 className="feature-title">Bulk Processing</h3>
              <p className="feature-description">
                Process 10,000+ photos in minutes, not hours. Scale without limits with cloud infrastructure
              </p>
              <div className="feature-metrics">
                <span className="metric">
                  <span className="metric-icon">🚀</span>
                  Ultra fast
                </span>
                <span className="metric">
                  <span className="metric-icon">📊</span>
                  Real-time analytics
                </span>
              </div>
              <div className="feature-link">
                Learn more <span>→</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">📊</div>
                <div className="feature-glow"></div>
              </div>
              <h3 className="feature-title">Professional Dashboard</h3>
              <p className="feature-description">
                Complete event management with analytics, reporting, and team collaboration in one place
              </p>
              <div className="feature-metrics">
                <span className="metric">
                  <span className="metric-icon">👥</span>
                  Team access
                </span>
                <span className="metric">
                  <span className="metric-icon">📈</span>
                  Detailed insights
                </span>
              </div>
              <div className="feature-link">
                Learn more <span>→</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🎨</div>
                <div className="feature-glow"></div>
              </div>
              <h3 className="feature-title">Custom Branding</h3>
              <p className="feature-description">
                White-label galleries with your logo, colors, and custom domain for professional presentation
              </p>
              <div className="feature-metrics">
                <span className="metric">
                  <span className="metric-icon">🎨</span>
                  Brand colors
                </span>
                <span className="metric">
                  <span className="metric-icon">🌐</span>
                  Custom domain
                </span>
              </div>
              <div className="feature-link">
                Learn more <span>→</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🔐</div>
                <div className="feature-glow"></div>
              </div>
              <h3 className="feature-title">Enterprise Security</h3>
              <p className="feature-description">
                Bank-level encryption, GDPR compliant, secure cloud storage with automated backups
              </p>
              <div className="feature-metrics">
                <span className="metric">
                  <span className="metric-icon">🛡️</span>
                  SSL encrypted
                </span>
                <span className="metric">
                  <span className="metric-icon">✅</span>
                  GDPR compliant
                </span>
              </div>
              <div className="feature-link">
                Learn more <span>→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="workflow-section" id="how-it-works">
        <div className="workflow-background">
          <div className="workflow-blob"></div>
        </div>

        <div className="workflow-container">
          <div className="section-header">
            <div className="section-badge">
              <span className="badge-sparkle">⚙️</span>
              HOW IT WORKS
            </div>
            <h2 className="workflow-title">Three simple steps to photo delivery perfection</h2>
            <p className="workflow-subtitle">
              From upload to guest inbox in minutes, not days
            </p>
          </div>

          <div className="workflow-steps">
            <div className="workflow-step">
              <div className="step-visual">
                <div className="step-number">1</div>
                <div className="step-icon">📤</div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Upload Photos</h3>
                <p className="step-description">
                  Drag and drop your event photos. Bulk upload thousands at once with our fast cloud infrastructure.
                </p>
                <ul className="step-features">
                  <li>✓ Bulk upload (10,000+ photos)</li>
                  <li>✓ Automatic organization</li>
                  <li>✓ Duplicate detection</li>
                </ul>
              </div>
              <div className="step-connector"></div>
            </div>

            <div className="workflow-step">
              <div className="step-visual">
                <div className="step-number">2</div>
                <div className="step-icon">🤖</div>
              </div>
              <div className="step-content">
                <h3 className="step-title">AI Matches Faces</h3>
                <p className="step-description">
                  Our AI identifies and matches every person across all photos with 99.8% accuracy using deep learning.
                </p>
                <ul className="step-features">
                  <li>✓ 99.8% accuracy rate</li>
                  <li>✓ Real-time processing</li>
                  <li>✓ Manual review option</li>
                </ul>
              </div>
              <div className="step-connector"></div>
            </div>

            <div className="workflow-step">
              <div className="step-visual">
                <div className="step-number">3</div>
                <div className="step-icon">✉️</div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Auto Delivery</h3>
                <p className="step-description">
                  Guests receive their personalized photo collections via email with beautiful galleries and download options.
                </p>
                <ul className="step-features">
                  <li>✓ Automated emails</li>
                  <li>✓ Custom templates</li>
                  <li>✓ Download tracking</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="workflow-cta">
            <Link to="/register" className="workflow-cta-btn">
              Try it free for 14 days
              <span className="btn-arrow">→</span>
            </Link>
            <p className="workflow-cta-note">No credit card required • Setup in 5 minutes</p>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="testimonials-section" id="testimonials">
        <div className="testimonials-container">
          <div className="section-header">
            <div className="section-badge">
              <span className="badge-sparkle">⭐</span>
              TESTIMONIALS
            </div>
            <h2 className="section-title">Loved by event professionals worldwide</h2>
            <p className="section-subtitle">
              See what our customers say about PhotoManEa
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">
                ⭐⭐⭐⭐⭐
              </div>
              <p className="testimonial-text">
                "PhotoManEa saved us over 150 hours on our last corporate event. The AI accuracy is incredible!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍💼</div>
                <div className="author-details">
                  <div className="author-name">Michael Chen</div>
                  <div className="author-role">Event Manager, TechCorp</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card featured">
              <div className="testimonial-badge">TOP REVIEW</div>
              <div className="testimonial-rating">
                ⭐⭐⭐⭐⭐
              </div>
              <p className="testimonial-text">
                "Absolutely game-changing! Our clients are amazed at how quickly they receive their photos. ROI was immediate."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍💼</div>
                <div className="author-details">
                  <div className="author-name">Sarah Johnson</div>
                  <div className="author-role">Wedding Photographer</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">
                ⭐⭐⭐⭐⭐
              </div>
              <p className="testimonial-text">
                "The automated delivery feature alone is worth 10x the price. Our team efficiency increased by 80%."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍🎨</div>
                <div className="author-details">
                  <div className="author-name">David Martinez</div>
                  <div className="author-role">Studio Owner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background">
          <div className="cta-blob cta-blob-1"></div>
          <div className="cta-blob cta-blob-2"></div>
        </div>

        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to transform your event photography?</h2>
            <p className="cta-subtitle">
              Join 500+ event professionals already saving 200+ hours per event with PhotoManEa
            </p>
            
            <div className="cta-features">
              <div className="cta-feature">
                <span className="cta-feature-icon">✓</span>
                <span>14-day free trial</span>
              </div>
              <div className="cta-feature">
                <span className="cta-feature-icon">✓</span>
                <span>No credit card required</span>
              </div>
              <div className="cta-feature">
                <span className="cta-feature-icon">✓</span>
                <span>Cancel anytime</span>
              </div>
            </div>

            <div className="cta-actions">
              <Link to="/register" className="btn-cta-primary">
                <span className="btn-icon">🚀</span>
                <span>Start Free Trial</span>
              </Link>
              <Link to="/dashboard" className="btn-cta-secondary">
                <span className="btn-icon">📊</span>
                <span>View Demo Dashboard</span>
              </Link>
            </div>

            <p className="cta-guarantee">
              💯 30-day money-back guarantee • 🔒 Secure SSL encryption
            </p>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand-section">
              <div className="footer-brand">
                <span className="brand-icon">📸</span>
                <span className="brand-name">PhotoManEa</span>
              </div>
              <p className="footer-tagline">
                AI-powered event photo delivery platform trusted by 500+ professionals worldwide.
              </p>
              <div className="footer-social">
                <a href="#twitter" className="social-icon" aria-label="Twitter">🐦</a>
                <a href="#facebook" className="social-icon" aria-label="Facebook">📘</a>
                <a href="#instagram" className="social-icon" aria-label="Instagram">📷</a>
                <a href="#linkedin" className="social-icon" aria-label="LinkedIn">💼</a>
              </div>
            </div>

            <div className="footer-links-section">
              <div className="footer-column">
                <h4 className="footer-column-title">Product</h4>
                <a href="#features" className="footer-link">Features</a>
                <a href="#pricing" className="footer-link">Pricing</a>
                <a href="#api" className="footer-link">API</a>
                <a href="#integrations" className="footer-link">Integrations</a>
              </div>

              <div className="footer-column">
                <h4 className="footer-column-title">Company</h4>
                <a href="#about" className="footer-link">About Us</a>
                <a href="#blog" className="footer-link">Blog</a>
                <a href="#careers" className="footer-link">Careers</a>
                <a href="#press" className="footer-link">Press Kit</a>
              </div>

              <div className="footer-column">
                <h4 className="footer-column-title">Resources</h4>
                <a href="#docs" className="footer-link">Documentation</a>
                <a href="#help" className="footer-link">Help Center</a>
                <a href="#community" className="footer-link">Community</a>
                <a href="#status" className="footer-link">System Status</a>
              </div>

              <div className="footer-column">
                <h4 className="footer-column-title">Legal</h4>
                <a href="#privacy" className="footer-link">Privacy Policy</a>
                <a href="#terms" className="footer-link">Terms of Service</a>
                <a href="#security" className="footer-link">Security</a>
                <a href="#gdpr" className="footer-link">GDPR</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-copy">
              © 2026 PhotoManEa. All rights reserved.
            </div>
            <div className="footer-badges">
              <span className="footer-badge">🔒 SSL Secured</span>
              <span className="footer-badge">✅ GDPR Compliant</span>
              <span className="footer-badge">☁️ Cloud Hosted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
