import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

const Landing = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const features = [
    {
      title: "Rich Text Editor",
      description: "Powerful block-based editor with formatting options, code blocks, and more.",
      icon: "✍️"
    },
    {
      title: "Real-time Collaboration", 
      description: "Work together in real-time with live cursors and instant synchronization.",
      icon: "🤝"
    },
    {
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security and privacy controls.",
      icon: "🔒"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('[id]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-container">
      {/* Animated Background Elements */}
      <div className="landing-background">
        <div className="landing-bg-element landing-bg-element-1"></div>
        <div className="landing-bg-element landing-bg-element-2"></div>
        <div className="landing-bg-element landing-bg-element-3"></div>
        {/* Interactive cursor follower */}
        <div 
          className="fixed w-4 h-4 bg-purple-400 rounded-full opacity-20 pointer-events-none z-50 transition-all duration-300"
          style={{
            left: mousePosition.x - 8,
            top: mousePosition.y - 8,
            transform: 'scale(1.5)'
          }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <span className="text-white font-bold">N</span>
            </div>
            <h1 className="landing-logo-text">Notion Clone</h1>
          </div>
          <div className="landing-nav-links">
            <Link to="/about" className="landing-nav-link">About</Link>
            <Link to="/login" className="landing-signin-btn">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="landing-hero" id="hero">
        <div className={`text-center transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="landing-hero-title">
            Write, Plan, Share.
            <br />
            <span className="landing-hero-gradient">
              All in one place.
            </span>
          </h1>
          <p className="landing-hero-subtitle">
            A powerful collaborative workspace where teams can create, edit, and share documents in real-time. 
            Experience the future of collaborative writing with our Notion-inspired platform.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-cta-primary">
              Get Started Free
            </Link>
            <Link to="/login" className="landing-cta-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Features Section */}
      <div className="landing-features" id="features">
        <div className={`transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose Notion Clone?
          </h2>
          
          {/* Featured highlight */}
          <div className="mb-12 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md mx-auto transform transition-all duration-500">
              <div className="text-4xl mb-4">{features[currentFeature].icon}</div>
              <h3 className="text-2xl font-semibold text-white mb-3">{features[currentFeature].title}</h3>
              <p className="text-gray-300">{features[currentFeature].description}</p>
            </div>
          </div>
          
          {/* Feature indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentFeature ? 'bg-purple-400' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer" id="footer">
        <div className="landing-footer-content">
          <div className="landing-footer-top">
            <div className="landing-footer-logo">
              <div className="landing-footer-logo-icon">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="landing-footer-logo-text">Notion Clone</span>
            </div>
            <div className="landing-footer-links">
              <Link to="/about" className="landing-footer-link">About</Link>
              <Link to="/docs" className="landing-footer-link">Docs</Link>
              <Link to="/support" className="landing-footer-link">Support</Link>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p>&copy; 2024 Notion Clone. Built with React, Node.js, and Firebase.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;