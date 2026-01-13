import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { eventAPI } from '../../services/api';
import './BillingPage.css';

const BillingPage = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [usage, setUsage] = useState({
    eventsCreated: 0,
    totalPhotos: 0,
    totalGuests: 0,
    storageUsed: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch actual usage data
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await eventAPI.getAll();
        const events = response.data?.data?.events || [];
        
        const totalPhotos = events.reduce((sum, e) => sum + (e.photosUploaded || 0), 0);
        const totalGuests = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
        
        // Calculate approximate storage (assuming avg 2MB per photo)
        const storageUsed = totalPhotos * 2 * 1024 * 1024; // in bytes
        
        setUsage({
          eventsCreated: events.length,
          totalPhotos,
          totalGuests,
          storageUsed
        });
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      limits: {
        events: 3,
        photos: 100,
        guests: 50,
        storage: 200 // MB
      },
      features: [
        '3 Events per month',
        '100 Photos per event',
        '50 Guest registrations',
        '200 MB storage',
        'Basic face matching',
        'Email support',
        '30 days data retention'
      ],
      color: '#6b7280',
      recommended: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: 29, annual: 290 },
      limits: {
        events: 20,
        photos: -1, // unlimited
        guests: -1,
        storage: 10240 // 10 GB
      },
      features: [
        '20 Events per month',
        'Unlimited Photos',
        'Unlimited Guests',
        '10 GB storage',
        'Advanced AI matching',
        'Priority support',
        'Analytics dashboard',
        '1 year data retention',
        'Custom branding'
      ],
      color: '#a855f7',
      recommended: true
    },
    {
      id: 'business',
      name: 'Business',
      price: { monthly: 99, annual: 990 },
      limits: {
        events: -1, // unlimited
        photos: -1,
        guests: -1,
        storage: -1 // unlimited
      },
      features: [
        'Unlimited Events',
        'Unlimited Photos',
        'Unlimited Guests',
        'Unlimited storage',
        'AI + Manual verification',
        '24/7 Premium support',
        'Advanced analytics',
        'Unlimited data retention',
        'White-label solution',
        'API access',
        'Dedicated account manager'
      ],
      color: '#ec4899',
      recommended: false
    }
  ];

  const handleUpgrade = (planId) => {
    console.log('Upgrading to:', planId);
    // Implement Stripe integration here
    alert(`Upgrade to ${planId} plan - Stripe integration coming soon!`);
  };

  const currentPlan = plans.find(p => p.id === (user?.subscription?.plan || 'free')) || plans[0];

  // Calculate usage percentages
  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const formatStorage = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const getUsageStatus = (percentage) => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'good';
  };

  return (
    <div className="billing-page">
      <div className="billing-header">
        <h2>Subscription & Billing</h2>
        <p>Choose the perfect plan for your needs</p>
      </div>

      {/* Current Plan Status */}
      <div className="current-plan-banner">
        <div className="banner-content">
          <div className="plan-info">
            <div className="plan-badge" style={{ background: currentPlan.color }}>
              {currentPlan.name}
            </div>
            <h3>Current Plan</h3>
            <p className="plan-price-info">
              {currentPlan.id === 'free' 
                ? 'Free forever • Upgrade to unlock more features'
                : `$${currentPlan.price[billingCycle]} / ${billingCycle === 'monthly' ? 'month' : 'year'} • ${billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="usage-section">
        <h3>Current Usage</h3>
        <div className="usage-grid">
          <div className="usage-card">
            <div className="usage-header">
              <div className="usage-icon" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                </svg>
              </div>
              <div className="usage-info">
                <span className="usage-label">Events Created</span>
                <span className="usage-value">
                  {loading ? '...' : usage.eventsCreated}
                  {currentPlan.limits.events !== -1 && ` / ${currentPlan.limits.events}`}
                </span>
              </div>
            </div>
            {currentPlan.limits.events !== -1 && (
              <div className="usage-bar-container">
                <div 
                  className={`usage-bar ${getUsageStatus(getUsagePercentage(usage.eventsCreated, currentPlan.limits.events))}`}
                  style={{ width: `${getUsagePercentage(usage.eventsCreated, currentPlan.limits.events)}%` }}
                />
              </div>
            )}
          </div>

          <div className="usage-card">
            <div className="usage-header">
              <div className="usage-icon" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
              <div className="usage-info">
                <span className="usage-label">Total Photos</span>
                <span className="usage-value">
                  {loading ? '...' : usage.totalPhotos.toLocaleString()}
                  {currentPlan.limits.photos !== -1 && ` / ${currentPlan.limits.photos}`}
                </span>
              </div>
            </div>
            {currentPlan.limits.photos !== -1 && (
              <div className="usage-bar-container">
                <div 
                  className={`usage-bar ${getUsageStatus(getUsagePercentage(usage.totalPhotos, currentPlan.limits.photos))}`}
                  style={{ width: `${getUsagePercentage(usage.totalPhotos, currentPlan.limits.photos)}%` }}
                />
              </div>
            )}
          </div>

          <div className="usage-card">
            <div className="usage-header">
              <div className="usage-icon" style={{ background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <div className="usage-info">
                <span className="usage-label">Total Guests</span>
                <span className="usage-value">
                  {loading ? '...' : usage.totalGuests.toLocaleString()}
                  {currentPlan.limits.guests !== -1 && ` / ${currentPlan.limits.guests}`}
                </span>
              </div>
            </div>
            {currentPlan.limits.guests !== -1 && (
              <div className="usage-bar-container">
                <div 
                  className={`usage-bar ${getUsageStatus(getUsagePercentage(usage.totalGuests, currentPlan.limits.guests))}`}
                  style={{ width: `${getUsagePercentage(usage.totalGuests, currentPlan.limits.guests)}%` }}
                />
              </div>
            )}
          </div>

          <div className="usage-card">
            <div className="usage-header">
              <div className="usage-icon" style={{ background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                </svg>
              </div>
              <div className="usage-info">
                <span className="usage-label">Storage Used</span>
                <span className="usage-value">
                  {loading ? '...' : formatStorage(usage.storageUsed)}
                  {currentPlan.limits.storage !== -1 && ` / ${currentPlan.limits.storage} MB`}
                </span>
              </div>
            </div>
            {currentPlan.limits.storage !== -1 && (
              <div className="usage-bar-container">
                <div 
                  className={`usage-bar ${getUsageStatus(getUsagePercentage(usage.storageUsed / 1024 / 1024, currentPlan.limits.storage))}`}
                  style={{ width: `${getUsagePercentage(usage.storageUsed / 1024 / 1024, currentPlan.limits.storage)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="billing-toggle-section">
        <h3>Choose Your Plan</h3>
        <div className="billing-toggle">
          <button
            className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual
            <span className="save-badge">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.recommended ? 'recommended' : ''} ${
              currentPlan.id === plan.id ? 'current' : ''
            }`}
          >
            {plan.recommended && (
              <div className="recommended-badge" style={{ background: plan.color }}>
                ⭐ Most Popular
              </div>
            )}
            
            {currentPlan.id === plan.id && (
              <div className="current-badge">
                ✓ Current Plan
              </div>
            )}

            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="price-currency">$</span>
                <span className="price-amount">
                  {plan.price[billingCycle]}
                </span>
                <span className="price-period">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              {billingCycle === 'annual' && plan.price.annual > 0 && (
                <p className="annual-savings">
                  Save ${(plan.price.monthly * 12) - plan.price.annual}/year
                </p>
              )}
            </div>

            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`plan-button ${currentPlan.id === plan.id ? 'current-btn' : ''}`}
              style={{ 
                background: currentPlan.id === plan.id ? '#94a3b8' : plan.color,
                cursor: currentPlan.id === plan.id ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handleUpgrade(plan.id)}
              disabled={currentPlan.id === plan.id}
            >
              {currentPlan.id === plan.id 
                ? '✓ Current Plan' 
                : plan.id === 'free' 
                ? 'Downgrade to Free' 
                : `Upgrade to ${plan.name}`
              }
            </button>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      {user?.subscription?.plan !== 'free' && currentPlan.id !== 'free' && (
        <div className="billing-section">
          <h3>Payment Method</h3>
          <div className="payment-method">
            <div className="card-info">
              <svg width="50" height="32" viewBox="0 0 50 32" fill="none">
                <rect width="50" height="32" rx="6" fill="url(#card-gradient)"/>
                <rect x="6" y="10" width="38" height="4" rx="2" fill="rgba(255,255,255,0.3)"/>
                <rect x="6" y="18" width="14" height="6" rx="2" fill="rgba(255,255,255,0.5)"/>
                <defs>
                  <linearGradient id="card-gradient" x1="0" y1="0" x2="50" y2="32">
                    <stop stopColor="#a855f7"/>
                    <stop offset="1" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <p className="card-number">•••• •••• •••• 4242</p>
                <p className="card-expiry">Expires 12/25</p>
              </div>
            </div>
            <button className="btn btn-secondary">Update Payment</button>
          </div>
        </div>
      )}

      {/* Billing History */}
      {user?.subscription?.plan !== 'free' && currentPlan.id !== 'free' && (
        <div className="billing-section">
          <h3>Billing History</h3>
          <div className="billing-history">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Jan 1, 2026</td>
                  <td>{currentPlan.name} Plan - {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}</td>
                  <td>${currentPlan.price[billingCycle]}.00</td>
                  <td><span className="status-badge status-paid">Paid</span></td>
                  <td><button className="btn-link">Download</button></td>
                </tr>
                <tr>
                  <td>Dec 1, 2025</td>
                  <td>{currentPlan.name} Plan - {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}</td>
                  <td>${currentPlan.price[billingCycle]}.00</td>
                  <td><span className="status-badge status-paid">Paid</span></td>
                  <td><button className="btn-link">Download</button></td>
                </tr>
                <tr>
                  <td>Nov 1, 2025</td>
                  <td>{currentPlan.name} Plan - {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}</td>
                  <td>${currentPlan.price[billingCycle]}.00</td>
                  <td><span className="status-badge status-paid">Paid</span></td>
                  <td><button className="btn-link">Download</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="billing-faq">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>💳 Can I change plans anytime?</h4>
            <p>Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your billing period.</p>
          </div>
          <div className="faq-item">
            <h4>📦 What happens to my data if I downgrade?</h4>
            <p>Your data is safe. If you exceed the limits of a lower plan, you'll have read-only access until you upgrade or reduce your usage.</p>
          </div>
          <div className="faq-item">
            <h4>💰 Do you offer refunds?</h4>
            <p>Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked.</p>
          </div>
          <div className="faq-item">
            <h4>🔒 Is my payment information secure?</h4>
            <p>Absolutely. We use Stripe for secure payment processing and never store your card details on our servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;