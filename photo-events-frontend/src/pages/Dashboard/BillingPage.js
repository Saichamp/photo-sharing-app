import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './BillingPage.css';

const BillingPage = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      features: [
        '3 Events',
        '100 Photos per event',
        '50 Guest registrations',
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
      features: [
        '20 Events',
        'Unlimited Photos',
        'Unlimited Guests',
        'Advanced AI matching',
        'Priority support',
        'Analytics dashboard',
        '1 year data retention',
        'Custom branding'
      ],
      color: '#dea193',
      recommended: true
    },
    {
      id: 'business',
      name: 'Business',
      price: { monthly: 99, annual: 990 },
      features: [
        'Unlimited Events',
        'Unlimited Photos',
        'Unlimited Guests',
        'AI + Manual verification',
        '24/7 Premium support',
        'Advanced analytics',
        'Unlimited data retention',
        'White-label solution',
        'API access',
        'Dedicated account manager'
      ],
      color: '#8b5cf6',
      recommended: false
    }
  ];

  const handleUpgrade = (planId) => {
    console.log('Upgrading to:', planId);
    // Implement Stripe integration here
    alert(`Upgrade to ${planId} plan - Stripe integration coming soon!`);
  };

  const currentPlan = plans.find(p => p.id === user?.subscription?.plan) || plans[0];

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
            <h3>Current Plan: {currentPlan.name}</h3>
            <p>
              {currentPlan.id === 'free' 
                ? 'Upgrade to unlock more features'
                : `$${currentPlan.price[billingCycle]} / ${billingCycle === 'monthly' ? 'month' : 'year'}`
              }
            </p>
          </div>
          <div className="plan-usage">
            <div className="usage-item">
              <span className="usage-label">Events Used</span>
              <span className="usage-value">
                {user?.eventsCreated || 0} / {currentPlan.id === 'free' ? '3' : currentPlan.id === 'pro' ? '20' : '∞'}
              </span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Storage Used</span>
              <span className="usage-value">
                {((user?.storageUsed || 0) / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
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

      {/* Pricing Plans */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.recommended ? 'recommended' : ''} ${
              currentPlan.id === plan.id ? 'current' : ''
            }`}
            style={{ borderColor: plan.color }}
          >
            {plan.recommended && (
              <div className="recommended-badge">Most Popular</div>
            )}
            
            {currentPlan.id === plan.id && (
              <div className="current-badge">Current Plan</div>
            )}

            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="price-amount">
                  ${plan.price[billingCycle]}
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
              style={{ background: plan.color }}
              onClick={() => handleUpgrade(plan.id)}
              disabled={currentPlan.id === plan.id}
            >
              {currentPlan.id === plan.id 
                ? 'Current Plan' 
                : plan.id === 'free' 
                ? 'Downgrade' 
                : 'Upgrade Now'
              }
            </button>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      {user?.subscription?.plan !== 'free' && (
        <div className="billing-section">
          <h3>Payment Method</h3>
          <div className="payment-method">
            <div className="card-info">
              <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
                <rect width="40" height="28" rx="4" fill="#1e293b"/>
                <rect x="4" y="8" width="32" height="4" fill="#475569"/>
                <rect x="4" y="16" width="12" height="6" rx="2" fill="#94a3b8"/>
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
      {user?.subscription?.plan !== 'free' && (
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
                  <td>Nov 1, 2025</td>
                  <td>Pro Plan - Monthly</td>
                  <td>$29.00</td>
                  <td><span className="status-badge status-paid">Paid</span></td>
                  <td><button className="btn-link">Download</button></td>
                </tr>
                <tr>
                  <td>Oct 1, 2025</td>
                  <td>Pro Plan - Monthly</td>
                  <td>$29.00</td>
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
            <h4>Can I change plans anytime?</h4>
            <p>Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div className="faq-item">
            <h4>What happens to my data if I downgrade?</h4>
            <p>Your data is safe. If you exceed the limits of a lower plan, you'll need to upgrade again to access it.</p>
          </div>
          <div className="faq-item">
            <h4>Do you offer refunds?</h4>
            <p>Yes, we offer a 30-day money-back guarantee for all paid plans.</p>
          </div>
          <div className="faq-item">
            <h4>Is my payment information secure?</h4>
            <p>Absolutely. We use Stripe for secure payment processing and never store your card details.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
