import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../services/api';
import '../styles/Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { theme, changeTheme, effectiveTheme, toggleTheme } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const navigate = useNavigate();

  // Calculate time spent on portal (in minutes)
  useEffect(() => {
    const startTime = localStorage.getItem('sessionStartTime');
    if (!startTime) {
      localStorage.setItem('sessionStartTime', Date.now().toString());
    }
    
    const calculateTimeSpent = () => {
      const start = localStorage.getItem('sessionStartTime');
      if (start) {
        const elapsed = Math.floor((Date.now() - parseInt(start)) / 60000); // in minutes
        setTimeSpent(elapsed);
      }
    };

    calculateTimeSpent();
    const interval = setInterval(calculateTimeSpent, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { documents } = await documentService.getDocuments();
      setDocuments(documents);
      
      // Get recent documents (last 5 updated)
      const recent = documents
        .filter(doc => doc.createdBy === user?.userId)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);
      setRecentDocuments(recent);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStats = () => {
    const myDocs = documents.filter(doc => doc.createdBy === user?.userId);
    const myPublicDocs = myDocs.filter(doc => doc.isPublic);
    const myPrivateDocs = myDocs.filter(doc => !doc.isPublic);
    const totalPublicDocs = documents.filter(doc => doc.isPublic);
    const collaboratingDocs = documents.filter(doc => 
      doc.createdBy !== user?.userId && doc.collaborators?.includes(user?.userId)
    );
    
    return {
      myDocs: myDocs.length,
      myPublicDocs: myPublicDocs.length,
      myPrivateDocs: myPrivateDocs.length,
      totalPublicDocs: totalPublicDocs.length,
      collaboratingDocs: collaboratingDocs.length,
      totalAccessible: documents.length
    };
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = getDocumentStats();

  if (loading) {
    return (
      <div className="profile-container">
        <nav className="profile-nav">
          <div className="profile-nav-content">
            <div className="profile-nav-inner">
              <div className="profile-nav-left">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="profile-nav-back"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="profile-nav-title">Profile</h1>
              </div>
              <div className="profile-nav-right">
                <button
                  onClick={toggleTheme}
                  className="profile-nav-theme"
                  title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {effectiveTheme === 'light' ? '🌙' : '☀️'}
                </button>
                <button
                  onClick={logout}
                  className="profile-nav-logout"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
        <div className="profile-content">
          <div className="profile-loading">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="mt-4">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <nav className="profile-nav">
        <div className="profile-nav-content">
          <div className="profile-nav-inner">
            <div className="profile-nav-left">
              <button
                onClick={() => navigate('/dashboard')}
                className="profile-nav-back"
              >
                ← Back to Dashboard
              </button>
              <h1 className="profile-nav-title">Profile Dashboard</h1>
            </div>
            <div className="profile-nav-right">
              <button
                onClick={toggleTheme}
                className="profile-nav-theme"
                title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
              >
                {effectiveTheme === 'light' ? '🌙' : '☀️'}
              </button>
              <span className="profile-nav-welcome">{getGreeting()}, {user?.name}</span>
              <button
                onClick={logout}
                className="profile-nav-logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="profile-content">
        <div className="profile-main">
          <div className="profile-header">
            <div className="profile-avatar">
              <div className="profile-avatar-circle">
                <span className="profile-avatar-initial">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="profile-header-info">
              <h2 className="profile-name">{user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
              <p className="profile-member-since">
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="profile-sections">
            {/* Dashboard Statistics Overview */}
            <div className="profile-section">
              <h3 className="profile-section-title">📊 Dashboard Overview</h3>
              <div className="profile-stats">
                <div className="profile-stat-item">
                  <div className="profile-stat-icon">📄</div>
                  <div className="profile-stat-content">
                    <div className="profile-stat-number">{stats.myDocs}</div>
                    <div className="profile-stat-label">My Documents</div>
                  </div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-icon">🌍</div>
                  <div className="profile-stat-content">
                    <div className="profile-stat-number">{stats.myPublicDocs}</div>
                    <div className="profile-stat-label">My Public Documents</div>
                  </div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-icon">🔒</div>
                  <div className="profile-stat-content">
                    <div className="profile-stat-number">{stats.myPrivateDocs}</div>
                    <div className="profile-stat-label">My Private Documents</div>
                  </div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-icon">🤝</div>
                  <div className="profile-stat-content">
                    <div className="profile-stat-number">{stats.collaboratingDocs}</div>
                    <div className="profile-stat-label">Collaborating Documents</div>
                  </div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-icon">📚</div>
                  <div className="profile-stat-content">
                    <div className="profile-stat-number">{stats.totalPublicDocs}</div>
                    <div className="profile-stat-label">Total Public Documents</div>
                  </div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-icon">🗂️</div>
                  <div className="profile-stat-content">
                    <div className="profile-stat-number">{stats.totalAccessible}</div>
                    <div className="profile-stat-label">Total Accessible</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Spent Section */}
            <div className="profile-section">
              <h3 className="profile-section-title">⏱️ Session Activity</h3>
              <div className="profile-time-spent">
                <div className="profile-time-display">
                  <div className="profile-time-icon">🕒</div>
                  <div className="profile-time-content">
                    <div className="profile-time-number">{formatTime(timeSpent)}</div>
                    <div className="profile-time-label">Current Session Duration</div>
                  </div>
                </div>
                <div className="profile-activity-info">
                  <div className="profile-activity-item">
                    <span className="profile-activity-label">Session Start:</span>
                    <span className="profile-activity-value">
                      {new Date(parseInt(localStorage.getItem('sessionStartTime') || Date.now())).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="profile-activity-item">
                    <span className="profile-activity-label">Current Time:</span>
                    <span className="profile-activity-value">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="profile-activity-item">
                    <span className="profile-activity-label">Status:</span>
                    <span className="profile-activity-value profile-status-active">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Documents */}
            <div className="profile-section">
              <h3 className="profile-section-title">📝 Recent Documents</h3>
              <div className="profile-recent-docs">
                {recentDocuments.length > 0 ? (
                  recentDocuments.map((doc, index) => (
                    <div 
                      key={doc.id} 
                      className="profile-recent-doc"
                      onClick={() => navigate(`/editor/${doc.id}`)}
                    >
                      <div className="profile-recent-doc-icon">
                        {doc.isPublic ? '🌍' : '🔒'}
                      </div>
                      <div className="profile-recent-doc-content">
                        <div className="profile-recent-doc-title">{doc.title}</div>
                        {doc.updatedAt && !isNaN(new Date(doc.updatedAt).getTime()) && (
                          <div className="profile-recent-doc-meta">
                            Updated {new Date(doc.updatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="profile-recent-doc-arrow">→</div>
                    </div>
                  ))
                ) : (
                  <div className="profile-no-documents">
                    <div className="profile-no-documents-icon">📝</div>
                    <p>No documents yet. Create your first document!</p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="profile-create-doc-btn"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Theme Settings */}
            <div className="profile-section">
              <h3 className="profile-section-title">🎨 Appearance Settings</h3>
              <div className="profile-settings">
                <div className="profile-setting-item">
                  <div className="profile-setting-info">
                    <h4 className="profile-setting-name">Theme Preference</h4>
                    <p className="profile-setting-desc">Choose your preferred color scheme</p>
                  </div>
                  <select 
                    className="profile-setting-select"
                    value={theme}
                    onChange={(e) => changeTheme(e.target.value)}
                  >
                    <option value="light">☀️ Light</option>
                    <option value="dark">🌙 Dark</option>
                    <option value="system">💻 System</option>
                  </select>
                </div>
                <div className="profile-theme-preview">
                  <div className="profile-theme-info">
                    <p>Current theme: <strong>{effectiveTheme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}</strong></p>
                    <p>Theme automatically switches based on your {theme === 'system' ? 'system preference' : 'manual selection'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;