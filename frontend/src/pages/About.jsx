import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/About.css';

const About = () => {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['what-is', 'features', 'tech-stack', 'use-cases'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="about-container">
      {/* Animated Background Elements */}
      <div className="about-background">
        <div className="about-bg-element about-bg-element-1"></div>
        <div className="about-bg-element about-bg-element-2"></div>
        <div className="about-bg-element about-bg-element-3"></div>
      </div>

      {/* Navigation */}
      <nav className="about-nav">
        <div className="about-nav-container">
          <Link to="/" className="about-logo">
            <div className="about-logo-icon">
              <span className="text-white font-bold">N</span>
            </div>
            <h1 className="about-logo-text">Notion Clone</h1>
          </Link>
          <div className="about-nav-links">
            <Link to="/" className="about-nav-link">Home</Link>
            <Link to="/login" className="about-signin-btn">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="about-content">
        <div className="about-card">
          <h1 className="about-title">About Notion Clone</h1>

          <div className="about-content-sections">
            <div id="what-is" className="about-section">
              <h2 className="about-section-title">What is Notion Clone?</h2>
              <p className="about-section-content">
                Notion Clone is a modern, collaborative workspace inspired by Notion.com. Built with cutting-edge 
                web technologies, it provides teams and individuals with a powerful platform to create, edit, and 
                share documents in real-time.
              </p>
            </div>

            <div id="features" className="about-section">
              <h2 className="about-section-title">Key Features</h2>
              <ul className="about-features-list">
                <li className="about-feature-item">
                  <span className="about-feature-check">✓</span>
                  <span>Rich text editor with block-based editing</span>
                </li>
                <li className="about-feature-item">
                  <span className="about-feature-check">✓</span>
                  <span>Real-time collaboration with live cursors</span>
                </li>
                <li className="about-feature-item">
                  <span className="about-feature-check">✓</span>
                  <span>Document sharing and permission controls</span>
                </li>
                <li className="about-feature-item">
                  <span className="about-feature-check">✓</span>
                  <span>Auto-save functionality</span>
                </li>
                <li className="about-feature-item">
                  <span className="about-feature-check">✓</span>
                  <span>Responsive design for all devices</span>
                </li>
                <li className="about-feature-item">
                  <span className="about-feature-check">✓</span>
                  <span>Secure authentication and data protection</span>
                </li>
              </ul>
            </div>

            <div id="tech-stack" className="about-section">
              <h2 className="about-section-title">Technology Stack</h2>
              <div className="about-tech-grid">
                <div className="about-tech-section">
                  <h3 className="about-tech-title">Frontend</h3>
                  <ul className="about-tech-list">
                    <li className="about-tech-item">React.js with JavaScript</li>
                    <li className="about-tech-item">Tailwind CSS for styling</li>
                    <li className="about-tech-item">Tiptap for rich text editing</li>
                    <li className="about-tech-item">Vite for build tooling</li>
                  </ul>
                </div>
                <div className="about-tech-section">
                  <h3 className="about-tech-title backend">Backend</h3>
                  <ul className="about-tech-list">
                    <li className="about-tech-item">Node.js with Express.js</li>
                    <li className="about-tech-item">Firebase Firestore database</li>
                    <li className="about-tech-item">JWT authentication</li>
                    <li className="about-tech-item">Bun runtime and package manager</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="use-cases" className="about-section">
              <h2 className="about-section-title">Use Cases</h2>
              <div className="about-use-cases-grid">
                <div className="about-use-case-card">
                  <h3 className="about-use-case-title">Team Collaboration</h3>
                  <p className="about-use-case-desc">Perfect for teams working on shared documents, meeting notes, and project planning.</p>
                </div>
                <div className="about-use-case-card">
                  <h3 className="about-use-case-title">Personal Notes</h3>
                  <p className="about-use-case-desc">Organize your thoughts, create to-do lists, and maintain personal knowledge bases.</p>
                </div>
                <div className="about-use-case-card">
                  <h3 className="about-use-case-title">Educational Content</h3>
                  <p className="about-use-case-desc">Create and share educational materials, course notes, and collaborative learning spaces.</p>
                </div>
                <div className="about-use-case-card">
                  <h3 className="about-use-case-title">Documentation</h3>
                  <p className="about-use-case-desc">Build comprehensive documentation, wikis, and knowledge sharing platforms.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-cta-section">
            <Link to="/register" className="about-cta-btn">
              Get Started Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;