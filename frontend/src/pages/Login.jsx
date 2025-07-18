import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formAnimated, setFormAnimated] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setFormAnimated(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Elements */}
      <div className="login-background">
        <div className="login-bg-element login-bg-element-1"></div>
        <div className="login-bg-element login-bg-element-2"></div>
        <div className="login-bg-element login-bg-element-3"></div>
      </div>

      {/* Navigation */}
      <nav className="login-nav">
        <div className="login-nav-container">
          <Link to="/" className="login-logo">
            <div className="login-logo-icon">
              <span className="text-white font-bold">N</span>
            </div>
            <h1 className="login-logo-text">Notion Clone</h1>
          </Link>
          <div className="login-nav-links">
            <Link to="/" className="login-nav-link">Home</Link>
            <Link to="/about" className="login-nav-link">About</Link>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="login-form-container">
        <div className="login-form-wrapper">
          <div className={`login-form-card ${formAnimated ? 'animated' : ''}`}>
            <div className="login-form-header">
              <h2 className="login-form-title">Welcome back</h2>
              <p className="login-form-subtitle">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <div className="login-form-fields">
                <div className="login-form-group">
                  <label htmlFor="email" className="login-form-label">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-form-input"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="login-form-group">
                  <label htmlFor="password" className="login-form-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-form-input login-form-input-with-icon"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-btn"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L7.5 7.5m2.378 2.378a3 3 0 004.243 4.243M21 3l-18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="login-submit-btn"
              >
                {loading ? (
                  <div className="login-loading">
                    <div className="login-loading-spinner"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="login-form-footer">
                <div style={{ marginBottom: '0.5rem' }}>
                  <Link 
                    to="/forgot-password" 
                    className="login-form-footer-link"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Forgot your password?
                  </Link>
                </div>
                <p className="login-form-footer-text">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="login-form-footer-link"
                  >
                    Sign up here
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

export default Login;