import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Register.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPassword = (password) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-wrapper">
        <div className="register-form-header">
          <Link to="/" className="register-logo">
            <h1>Collaboration Tool</h1>
          </Link>
          <h2 className="register-form-title">Create your account</h2>
          <p className="register-form-subtitle">Join us and start collaborating</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div className="register-error">
              {error}
            </div>
          )}

          <div className="register-form-fields">
            <div className="register-form-group">
              <label htmlFor="name" className="register-form-label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="register-form-input"
                placeholder="Enter your full name"
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="email" className="register-form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="register-form-input"
                placeholder="Enter your email address"
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="password" className="register-form-label">
                Password
              </label>
              <div className="register-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="register-form-input"
                  placeholder="Choose a secure password (8+ characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="register-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="register-form-group">
              <label htmlFor="confirmPassword" className="register-form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="register-form-input"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="register-submit-btn"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="register-form-footer">
            <p className="register-form-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="register-form-footer-link">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;