import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validators, getPasswordStrength } from '../../utils/validators';
import './AuthPages.css';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (!validators.name(formData.name)) {
      newErrors.name = 'Name must be 2-50 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validators.email(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validators.password(formData.password)) {
      newErrors.password = 'Password must be 8+ characters with uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-gradient-1" />
        <div className="auth-gradient-2" />
        <div className="auth-gradient-3" />
      </div>

      <div className="auth-content">
        <div className="auth-card auth-card-wide animate-slide-up">
          {/* Logo & Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-circle">
                <span className="logo-icon">📸</span>
              </div>
            </div>
            <h1>Create Your Account</h1>
            <p className="auth-subtitle">
              Start managing your event photos with AI
            </p>
          </div>

          {/* Alert Messages */}
          {authError && (
            <div className="alert alert-error animate-fade-in">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              {authError}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              {/* Name Field */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  <input
                    type="text"
                    name="name"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              {/* Password Field */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Create strong password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill" 
                        style={{ 
                          width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%',
                          background: passwordStrength.color
                        }}
                      />
                    </div>
                    <span style={{ color: passwordStrength.color, fontSize: '0.75rem', fontWeight: 600 }}>
                      {passwordStrength.level.toUpperCase()}
                    </span>
                  </div>
                )}
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-with-icon">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
                  </svg>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.terms) {
                      setErrors(prev => ({ ...prev, terms: '' }));
                    }
                  }}
                />
                <span>
                  I accept the{' '}
                  <Link to="/terms" className="auth-link" target="_blank">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="auth-link" target="_blank">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && <span className="form-error">{errors.terms}</span>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-pink btn-lg w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }} />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link-bold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
