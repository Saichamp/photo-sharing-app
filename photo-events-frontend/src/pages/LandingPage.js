import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FAQ data
  const faqs = [
    {
      question: "How accurate is the AI face recognition?",
      answer: "Our AI achieves 99.8% accuracy using InsightFace technology. It can detect faces in various lighting conditions, angles, and even with accessories like glasses or hats. The system continuously learns and improves with each event."
    },
    {
      question: "How long does photo processing take?",
      answer: "Processing time depends on the number of photos, but typically 1,000 photos are processed in under 10 minutes. You'll receive real-time updates as the AI works through your event photos."
    },
    {
      question: "Is my data secure and private?",
      answer: "Absolutely. We use bank-level encryption (AES-256), are SOC2 compliant, and GDPR certified. All face data is encrypted and automatically deleted after 90 days. We never share or sell your data."
    },
    {
      question: "Can I customize the email templates?",
      answer: "Yes! You can fully customize email templates with your branding, colors, logo, and messaging. Templates support HTML and can be previewed before sending."
    },
    {
      question: "What file formats do you support?",
      answer: "We support all common image formats including JPG, PNG, HEIC, RAW (CR2, NEF, ARW), and even video formats like MP4 for future video recognition features."
    },
    {
      question: "Do you offer a free trial?",
      answer: "Yes! Get 14 days free with full access to all features. No credit card required. Process up to 500 photos during your trial period."
    },
    {
      question: "How many photos can I upload?",
      answer: "Our plans range from 1,000 photos/month (Starter) to unlimited (Enterprise). You can always upgrade mid-month if you need more capacity."
    },
    {
      question: "What happens after my trial ends?",
      answer: "You can choose a paid plan to continue, or your account will automatically convert to our free tier (100 photos/month). No data is deleted for 30 days, giving you time to decide."
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="landing-page">
      {/* Announcement Banner */}
      <div className="announcement-banner">
        <div className="announcement-content">
          <span className="announcement-icon">🔔</span>
          <span className="announcement-text">
            New feature launched: Bulk video processing now available!
          </span>
          <Link to="/features" className="announcement-link">
            Learn More →
          </Link>
        </div>
      </div>

      {/* Navigation Header */}
      <nav className={`nav-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-icon">📸</span>
            <span className="brand-name">PhotoEvents</span>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          {/* Navigation Links */}
          <div className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How It Works</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="btn-nav-secondary">Login</Link>
            <Link to="/register" className="btn-nav-primary">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            AI-Powered Event Photography Platform
          </div>
          
          <h1 className="hero-title">
            Automate Event Photo Delivery
            <span className="title-gradient"> with Intelligence</span>
          </h1>
          
          <p className="hero-subtitle">
            Stop manually sorting thousands of photos. Our AI finds and delivers 
            the perfect shots to every guest automatically. Save 200+ hours per event.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn-hero-primary">
              <span className="btn-icon">🚀</span>
              Start Free Trial
            </Link>
            <button className="btn-hero-secondary">
              <span className="btn-icon">▶️</span>
              Watch Demo
            </button>
          </div>

         
        </div>
      </section>

      {/* Stats Banner }
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-number">99.8%</div>
              <div className="stat-label">AI Accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📸</div>
              <div className="stat-number">10K+</div>
              <div className="stat-label">Photos Processed</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎉</div>
              <div className="stat-number">500+</div>
              <div className="stat-label">Events Powered</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-number">80%</div>
              <div className="stat-label">Time Saved</div>
            </div>
          </div>

          <div className="logo-carousel">
            <p className="carousel-title">Trusted by leading event companies</p>
            <div className="logo-track">
              <div className="logo-item">Marriott Events</div>
              <div className="logo-item">Eventbrite</div>
              <div className="logo-item">WedPro Studio</div>
              <div className="logo-item">Corporate Plus</div>
              <div className="logo-item">Elite Weddings</div>
              <div className="logo-item">Photo Masters</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="problem-solution-section">
        <div className="problem-solution-container">
          <div className="problem-card">
            <div className="card-icon error">❌</div>
            <h3 className="card-title">The Problem</h3>
            <p className="card-description">
              Event organizers spend 200+ hours manually sorting and sending photos. 
              Guests wait weeks for their pictures. Many photos never get delivered 
              to the right people.
            </p>
            <ul className="card-list">
              <li>Manual photo sorting is exhausting</li>
              <li>Guests get frustrated waiting</li>
              <li>Many photos get lost or misplaced</li>
              <li>Follow-up emails are time-consuming</li>
            </ul>
          </div>

          <div className="solution-card">
            <div className="card-icon success">✅</div>
            <h3 className="card-title">Our Solution</h3>
            <p className="card-description">
              AI automatically identifies every person in every photo and delivers 
              personalized collections instantly. Save time, delight guests, and 
              never lose a photo again.
            </p>
            <ul className="card-list">
              <li>AI processes 1000+ photos in 10 minutes</li>
              <li>Instant delivery to all guests</li>
              <li>99.8% accurate face matching</li>
              <li>Zero manual work required</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Everything you need for automated photo delivery</h2>
            <p className="section-subtitle">
              Professional tools designed for event organizers who value efficiency
            </p>
          </div>

          <div className="feature-showcase">
            {/* Feature 1 */}
            <div className="feature-row">
              <div className="feature-visual">
                <div className="visual-placeholder ai-visual">
                  <span className="visual-icon">🤖</span>
                  <div className="visual-animation">
                    <div className="face-box"></div>
                    <div className="face-box"></div>
                    <div className="face-box"></div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <div className="feature-badge">AI Powered</div>
                <h3 className="feature-title">Advanced Face Recognition</h3>
                <p className="feature-description">
                  Our AI uses InsightFace technology to achieve 99.8% accuracy. It detects 
                  faces in any lighting, angle, or condition—even with glasses, masks, or hats.
                </p>
                <ul className="feature-list">
                  <li>✓ Multi-face detection in group photos</li>
                  <li>✓ Works in low light and challenging conditions</li>
                  <li>✓ Recognizes faces from different angles</li>
                  <li>✓ Privacy-focused with encrypted data</li>
                </ul>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-row reverse">
              <div className="feature-visual">
                <div className="visual-placeholder email-visual">
                  <span className="visual-icon">📧</span>
                  <div className="email-animation">
                    <div className="email-card">
                      <div className="email-header"></div>
                      <div className="email-body"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <div className="feature-badge">Automated</div>
                <h3 className="feature-title">Intelligent Email Delivery</h3>
                <p className="feature-description">
                  Personalized photo collections are automatically sent to each guest with 
                  your custom branding. Schedule deliveries or send instantly.
                </p>
                <ul className="feature-list">
                  <li>✓ Custom email templates with your branding</li>
                  <li>✓ Schedule delivery for optimal timing</li>
                  <li>✓ Track open rates and downloads</li>
                  <li>✓ Automatic follow-up reminders</li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-row">
              <div className="feature-visual">
                <div className="visual-placeholder speed-visual">
                  <span className="visual-icon">⚡</span>
                  <div className="progress-bars">
                    <div className="progress-bar"></div>
                    <div className="progress-bar"></div>
                    <div className="progress-bar"></div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <div className="feature-badge">Ultra Fast</div>
                <h3 className="feature-title">Bulk Processing Power</h3>
                <p className="feature-description">
                  Upload and process 10,000+ photos in minutes, not hours. Our cloud 
                  infrastructure scales automatically to handle events of any size.
                </p>
                <ul className="feature-list">
                  <li>✓ Process 1,000 photos in under 10 minutes</li>
                  <li>✓ Unlimited concurrent uploads</li>
                  <li>✓ Real-time progress tracking</li>
                  <li>✓ Automatic quality optimization</li>
                </ul>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-row reverse">
              <div className="feature-visual">
                <div className="visual-placeholder dashboard-visual">
                  <span className="visual-icon">📊</span>
                  <div className="dashboard-grid">
                    <div className="dashboard-card"></div>
                    <div className="dashboard-card"></div>
                    <div className="dashboard-card"></div>
                    <div className="dashboard-card"></div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <div className="feature-badge">Professional</div>
                <h3 className="feature-title">Complete Event Dashboard</h3>
                <p className="feature-description">
                  Manage all your events from one beautiful dashboard. Get insights, 
                  track metrics, and collaborate with your team in real-time.
                </p>
                <ul className="feature-list">
                  <li>✓ Real-time analytics and reporting</li>
                  <li>✓ Team collaboration tools</li>
                  <li>✓ Guest management system</li>
                  <li>✓ Export data and generate reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

  {/* How It Works */}
<section className="how-it-works-section" id="how-it-works">
  <div className="how-it-works-container">
    <h2 className="section-title">How PhotoEvents Works</h2>
    <p className="section-subtitle">Simple 5-step process from upload to delivery</p>

    <div className="timeline">
      <div className="timeline-item">
        <div className="timeline-content">
          <div className="timeline-marker">1</div>
          <div className="timeline-icon">📤</div>
          <div className="timeline-text">
            <h3 className="timeline-title">Upload Photos</h3>
            <p className="timeline-description">
              Drag and drop all your event photos. Supports bulk upload of thousands of images at once.
            </p>
          </div>
        </div>
      </div>

      <div className="timeline-item">
        <div className="timeline-content">
          <div className="timeline-marker">2</div>
          <div className="timeline-icon">🎯</div>
          <div className="timeline-text">
            <h3 className="timeline-title">AI Detection</h3>
            <p className="timeline-description">
              Our AI scans every photo and detects all faces with 99.8% accuracy in under 10 minutes.
            </p>
          </div>
        </div>
      </div>

      <div className="timeline-item">
        <div className="timeline-content">
          <div className="timeline-marker">3</div>
          <div className="timeline-icon">🤖</div>
          <div className="timeline-text">
            <h3 className="timeline-title">Smart Matching</h3>
            <p className="timeline-description">
              AI matches faces across all photos and groups them by person automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="timeline-item">
        <div className="timeline-content">
          <div className="timeline-marker">4</div>
          <div className="timeline-icon">📧</div>
          <div className="timeline-text">
            <h3 className="timeline-title">Automated Delivery</h3>
            <p className="timeline-description">
              Personalized photo collections are automatically sent via email with your branding.
            </p>
          </div>
        </div>
      </div>

      <div className="timeline-item">
        <div className="timeline-content">
          <div className="timeline-marker">5</div>
          <div className="timeline-icon">😊</div>
          <div className="timeline-text">
            <h3 className="timeline-title">Happy Guests</h3>
            <p className="timeline-description">
              Guests receive instant access to their photos. Download, share, or order prints easily.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <h2 className="section-title">Loved by Event Professionals</h2>
          <p className="section-subtitle">See what our customers say about PhotoEvents</p>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "PhotoEvents transformed our wedding business. We used to spend 40+ hours 
                sorting photos. Now it's done in 10 minutes. Our clients are thrilled with 
                the instant delivery!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">SJ</div>
                <div className="author-info">
                  <div className="author-name">Sarah Johnson</div>
                  <div className="author-title">Wedding Planner, WedPro Studio</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "The AI accuracy is incredible. It finds faces even in challenging lighting 
                and crowded group shots. Our corporate clients love the professional 
                dashboard and branded emails."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">MR</div>
                <div className="author-info">
                  <div className="author-name">Mike Rodriguez</div>
                  <div className="author-title">Event Director, Marriott Events</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Best investment we made this year. ROI in the first month! The time saved 
                allows us to take on more events. Support team is amazing too."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">DC</div>
                <div className="author-info">
                  <div className="author-name">David Chen</div>
                  <div className="author-title">CEO, EventBrite Pro</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="faq-container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Everything you need to know about PhotoEvents</p>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeFaq === index ? 'active' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={activeFaq === index}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">{activeFaq === index ? '−' : '+'}</span>
                </button>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="faq-cta">
            <p>Still have questions?</p>
            <Link to="/contact" className="btn-faq-contact">Contact Support →</Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-container">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">Choose the plan that fits your needs</p>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-title">Starter</h3>
                <div className="pricing-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">49</span>
                  <span className="price-period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✓ 1,000 photos per month</li>
                <li>✓ AI face recognition</li>
                <li>✓ Automated email delivery</li>
                <li>✓ Basic analytics</li>
                <li>✓ Email support</li>
              </ul>
              <Link to="/register?plan=starter" className="btn-pricing">
                Start Free Trial
              </Link>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h3 className="pricing-title">Pro</h3>
                <div className="pricing-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">99</span>
                  <span className="price-period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✓ 5,000 photos per month</li>
                <li>✓ Advanced AI matching</li>
                <li>✓ Custom email templates</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
                <li>✓ Team collaboration</li>
              </ul>
              <Link to="/register?plan=pro" className="btn-pricing primary">
                Start Free Trial
              </Link>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-title">Enterprise</h3>
                <div className="pricing-price">
                  <span className="price-amount">Custom</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✓ Unlimited photos</li>
                <li>✓ White-label solution</li>
                <li>✓ API access</li>
                <li>✓ Dedicated support</li>
                <li>✓ Custom integrations</li>
                <li>✓ SLA guarantee</li>
              </ul>
              <Link to="/contact" className="btn-pricing">
                Contact Sales
              </Link>
            </div>
          </div>

          <div className="pricing-note">
            <p>All plans include 14-day free trial • No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-section">
        <div className="final-cta-container">
          <h2 className="cta-title">Ready to Transform Your Event Photography?</h2>
          <p className="cta-subtitle">Join 500+ event professionals using PhotoEvents today</p>
          <div className="cta-actions">
            <Link to="/register" className="btn-cta-primary">
              Start Free Trial - No Credit Card Required
            </Link>
            <Link to="/dashboard" className="btn-cta-secondary">
              View Demo Dashboard
            </Link>
          </div>
          <div className="cta-trust">
            <span>✓ 14-day free trial</span>
            <span>✓ No credit card</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-column">
              <div className="footer-brand">
                <span className="brand-icon">📸</span>
                <span className="brand-name">PhotoEvents</span>
              </div>
              <p className="footer-description">
                AI-powered event photo delivery platform. Save time, delight guests.
              </p>
              <div className="footer-social">
                <a href="#facebook" aria-label="Facebook">📘</a>
                <a href="#twitter" aria-label="Twitter">🐦</a>
                <a href="#linkedin" aria-label="LinkedIn">💼</a>
                <a href="#instagram" aria-label="Instagram">📷</a>
              </div>
            </div>

            <div className="footer-column">
              <h4 className="footer-title">Product</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#security">Security</a></li>
                <li><a href="#updates">Updates</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-title">Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#press">Press</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-title">Resources</h4>
              <ul className="footer-links">
                <li><a href="#blog">Blog</a></li>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#api">API Docs</a></li>
                <li><a href="#guides">Guides</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-title">Legal</h4>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy</a></li>
                <li><a href="#terms">Terms</a></li>
                <li><a href="#cookies">Cookies</a></li>
                <li><a href="#gdpr">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-newsletter">
            <h4 className="newsletter-title">Stay Updated</h4>
            <p className="newsletter-text">Get the latest features and tips delivered to your inbox</p>
            <form className="newsletter-form">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-button">Subscribe</button>
            </form>
          </div>

          <div className="footer-bottom">
            <p>© 2026 PhotoEvents. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
