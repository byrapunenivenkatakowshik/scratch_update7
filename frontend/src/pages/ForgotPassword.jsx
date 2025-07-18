import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import config from '../config/config';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reset email');
      }

      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-background">
          <div className="forgot-password-bg-element forgot-password-bg-element-1"></div>
          <div className="forgot-password-bg-element forgot-password-bg-element-2"></div>
          <div className="forgot-password-bg-element forgot-password-bg-element-3"></div>
        </div>

        <nav className="forgot-password-nav">
          <div className="forgot-password-nav-container">
            <Link to="/" className="forgot-password-logo">
              <div className="forgot-password-logo-icon">
                <span className="text-white font-bold">N</span>
              </div>
              <h1 className="forgot-password-logo-text">Notion Clone</h1>
            </Link>
            <div className="forgot-password-nav-links">
              <Link to="/" className="forgot-password-nav-link">Home</Link>
              <Link to="/login" className="forgot-password-nav-link">Sign In</Link>
            </div>
          </div>
        </nav>

        <div className="forgot-password-form-container">
          <div className="forgot-password-form-wrapper">
            <div className="forgot-password-success-card">
              <div className="forgot-password-success-icon">
                <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="forgot-password-success-content">
                <h2 className="forgot-password-success-title">Check your email</h2>
                <p className="forgot-password-success-message">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                
                <div className="forgot-password-success-instructions">
                  <p>Didn't receive the email? Check your spam folder or</p>
                  <button 
                    onClick={() => {
                      setSent(false);
                      setEmail('');
                    }}
                    className="forgot-password-resend-btn"
                  >
                    try again
                  </button>
                </div>

                <div className="forgot-password-success-actions">
                  <Link to="/login" className="forgot-password-back-btn">
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-background">
        <div className="forgot-password-bg-element forgot-password-bg-element-1"></div>
        <div className="forgot-password-bg-element forgot-password-bg-element-2"></div>
        <div className="forgot-password-bg-element forgot-password-bg-element-3"></div>
      </div>

      <nav className="forgot-password-nav">
        <div className="forgot-password-nav-container">
          <Link to="/" className="forgot-password-logo">
            <div className="forgot-password-logo-icon">
              <span className="text-white font-bold">N</span>
            </div>
            <h1 className="forgot-password-logo-text">Notion Clone</h1>
          </Link>
          <div className="forgot-password-nav-links">
            <Link to="/" className="forgot-password-nav-link">Home</Link>
            <Link to="/login" className="forgot-password-nav-link">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="forgot-password-form-container">
        <div className="forgot-password-form-wrapper">
          <div className="forgot-password-form-card">
            <div className="forgot-password-form-header">
              <h2 className="forgot-password-form-title">Reset your password</h2>
              <p className="forgot-password-form-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="forgot-password-form">
              {error && (
                <div className="forgot-password-error">
                  {error}
                </div>
              )}

              <div className="forgot-password-form-group">
                <label htmlFor="email" className="forgot-password-form-label">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="forgot-password-form-input"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="forgot-password-submit-btn"
              >
                {loading ? (
                  <div className="forgot-password-loading">
                    <div className="forgot-password-loading-spinner"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="forgot-password-form-footer">
                <p className="forgot-password-form-footer-text">
                  Remember your password?{' '}
                  <Link 
                    to="/login" 
                    className="forgot-password-form-footer-link"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;