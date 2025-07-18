import React, { useState, useEffect } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [formAnimated, setFormAnimated] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    setFormAnimated(true);
  }, []);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(email));
  }, [email]);

  useEffect(() => {
    setPasswordMatch(password && confirmPassword && password === confirmPassword);
  }, [password, confirmPassword]);

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    if (strength <= 2) return { strength: 1, text: 'Weak', color: 'text-red-400' };
    if (strength <= 3) return { strength: 2, text: 'Fair', color: 'text-yellow-400' };
    if (strength <= 4) return { strength: 3, text: 'Good', color: 'text-green-400' };
    return { strength: 4, text: 'Strong', color: 'text-green-400' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!passwordMatch) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (getPasswordStrength(password).strength < 2) {
      setError('Password is too weak. Please choose a stronger password.');
      setLoading(false);
      return;
    }

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
    <div className="register-container-enhanced">
      {/* Animated Background Elements */}
      <div className="register-background">
        <div className="register-bg-element register-bg-element-1"></div>
        <div className="register-bg-element register-bg-element-2"></div>
        <div className="register-bg-element register-bg-element-3"></div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon">
              <span className="text-white font-bold">N</span>
            </div>
            <h1 className="landing-logo-text">Notion Clone</h1>
          </Link>
          <div className="landing-nav-links">
            <Link to="/" className="landing-nav-link">Home</Link>
            <Link to="/about" className="landing-nav-link">About</Link>
            <Link to="/login" className="landing-signin-btn">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Register Form */}
      <div className={`register-form-card transition-all duration-1000 ${
        formAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-10 opacity-0'
      }`}>
        <div className="register-form-header-enhanced">
          <h2 className="register-form-title-enhanced animate-pulse">Create your account</h2>
          <p className="register-form-subtitle">Join thousands of users already using Notion Clone</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form-enhanced">
          {error && (
            <div className="register-error-enhanced">
              {error}
            </div>
          )}

          <div className="register-form-fields-enhanced space-y-6">
            <div className="register-form-group-enhanced relative">
              <label htmlFor="name" className="register-form-label">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="register-form-input-enhanced pr-10"
                  placeholder="Enter your full name"
                />
                {name && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {name && (
                <p className="text-green-400 text-xs mt-1">
                  {name.length}/50 characters
                </p>
              )}
            </div>

            <div className="register-form-group-enhanced relative">
              <label htmlFor="email" className="register-form-label">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`register-form-input-enhanced pr-10 ${
                    email && !emailValid ? 'border-red-400' : ''
                  }`}
                  placeholder="Enter your email address"
                />
                {email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {emailValid ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {email && !emailValid && (
                <p className="text-red-400 text-xs mt-1 animate-pulse">Please enter a valid email address</p>
              )}
            </div>

            <div className="register-form-group-enhanced relative">
              <label htmlFor="password" className="register-form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="register-form-input-enhanced pr-12"
                  placeholder="Choose a secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300 flex items-center justify-center"
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
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-1 bg-gray-300 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${
                        getPasswordStrength(password).strength === 1 ? 'bg-red-500 w-1/4' :
                        getPasswordStrength(password).strength === 2 ? 'bg-yellow-500 w-1/2' :
                        getPasswordStrength(password).strength === 3 ? 'bg-green-500 w-3/4' :
                        'bg-green-500 w-full'
                      }`} />
                    </div>
                    <span className={`text-xs ${getPasswordStrength(password).color}`}>
                      {getPasswordStrength(password).text}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    <p>Password must contain:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li className={password.length >= 8 ? 'text-green-400' : 'text-gray-400'}>At least 8 characters</li>
                      <li className={/[a-z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>One lowercase letter</li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>One uppercase letter</li>
                      <li className={/[0-9]/.test(password) ? 'text-green-400' : 'text-gray-400'}>One number</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="register-form-group-enhanced relative">
              <label htmlFor="confirmPassword" className="register-form-label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`register-form-input-enhanced pr-12 ${
                    confirmPassword && !passwordMatch ? 'border-red-400' : ''
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300 flex items-center justify-center"
                >
                  {showConfirmPassword ? (
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
              {confirmPassword && (
                <p className={`text-xs mt-1 ${
                  passwordMatch ? 'text-green-400' : 'text-red-400'
                }`}>
                  {passwordMatch ? 'Passwords match!' : 'Passwords do not match'}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !emailValid || !passwordMatch || getPasswordStrength(password).strength < 2}
            className="register-submit-btn-enhanced disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating account...
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>Create Account</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            )}
          </button>

          <div className="register-form-footer-enhanced">
            <p className="register-form-footer-text-enhanced">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="register-form-footer-link-enhanced"
              >
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