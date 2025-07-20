import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { documentService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [publicDocuments, setPublicDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocIsPublic, setNewDocIsPublic] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterLoading, setFilterLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt', 'title', 'createdAt'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'public', 'private', 'my-docs'
  const [isVisible, setIsVisible] = useState(false);
  const { user, logout } = useAuth();
  const { toggleTheme, effectiveTheme } = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
    // Animation trigger
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update filter loading state
  useEffect(() => {
    setFilterLoading(true);
    const timer = setTimeout(() => {
      setFilterLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [debouncedSearchTerm, filterBy, sortBy]);

  useEffect(() => {
    if (showCreateModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateModal]);

  const fetchDocuments = async () => {
    try {
      const { documents } = await documentService.getDocuments();
      setDocuments(documents);
      
      // Separate public documents for better filtering
      const publicDocs = documents.filter(doc => doc.isPublic);
      setPublicDocuments(publicDocs);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicDocuments = async () => {
    try {
      const { documents } = await documentService.getPublicDocuments();
      // This will be redundant now since we get all docs from fetchDocuments
      // but keeping it for potential future use
      setPublicDocuments(documents);
    } catch (err) {
      console.error('Failed to fetch public documents:', err);
    }
  };

  const getDisplayDocuments = () => {
    try {
      let docsToShow = [];
      
      if (filterBy === 'public') {
        // Show all public documents
        docsToShow = documents.filter(doc => doc.isPublic);
      } else if (filterBy === 'my-docs') {
        // Show only documents created by the current user
        docsToShow = documents.filter(doc => doc.createdBy === user?.userId);
      } else if (filterBy === 'private') {
        // Show only private documents created by the current user
        docsToShow = documents.filter(doc => !doc.isPublic && doc.createdBy === user?.userId);
      } else {
        // 'all' - show all documents the user has access to
        docsToShow = documents;
      }

      return docsToShow
        .filter(doc => {
          if (!doc.title) return false;
          const matchesSearch = doc.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
          return matchesSearch;
        })
        .sort((a, b) => {
          try {
            if (sortBy === 'title') {
              return (a.title || '').localeCompare(b.title || '');
            } else if (sortBy === 'createdAt') {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB - dateA;
            } else {
              const dateA = new Date(a.updatedAt || 0);
              const dateB = new Date(b.updatedAt || 0);
              return dateB - dateA;
            }
          } catch (sortError) {
            console.warn('Error sorting documents:', sortError);
            return 0;
          }
        });
    } catch (filterError) {
      console.error('Error filtering documents:', filterError);
      return [];
    }
  };

  const filteredAndSortedDocuments = getDisplayDocuments();

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return;

    try {
      const response = await documentService.createDocument(newDocTitle, '', newDocIsPublic);
      setNewDocTitle('');
      setNewDocIsPublic(false);
      setShowCreateModal(false);
      
      // Navigate to the new document editor
      if (response.document && response.document.id) {
        navigate(`/editor/${response.document.id}`);
      } else {
        // Fallback: refresh documents and show success message
        fetchDocuments();
        console.log('Document created successfully');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create document');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateDocument();
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDocumentStats = () => {
    // My documents (all documents created by me)
    const myDocs = documents.filter(doc => doc.createdBy === user?.userId).length;
    
    // My public documents (public documents created by me)
    const myPublicDocs = documents.filter(doc => doc.isPublic && doc.createdBy === user?.userId).length;
    
    // My private documents (private documents created by me)
    const myPrivateDocs = documents.filter(doc => !doc.isPublic && doc.createdBy === user?.userId).length;
    
    // All public documents
    const allPublicDocs = documents.filter(doc => doc.isPublic).length;
    
    return { myDocs, myPublicDocs, myPrivateDocs, allPublicDocs };
  };

  const stats = getDocumentStats();

  const getFilterTitle = () => {
    switch (filterBy) {
      case 'public':
        return 'All Public Documents';
      case 'my-docs':
        return 'My Documents';
      case 'private':
        return 'My Private Documents';
      case 'all':
      default:
        return 'All Documents';
    }
  };

  const getFilterIcon = () => {
    switch (filterBy) {
      case 'public':
        return '🌍';
      case 'my-docs':
        return '📄';
      case 'private':
        return '🔒';
      case 'all':
      default:
        return '📚';
    }
  };

  const handleDeleteDocument = async (id) => {
    // Create a custom confirmation modal
    const userConfirmed = window.confirm('Are you sure you want to delete this document? This action cannot be undone.');
    if (!userConfirmed) return;

    try {
      setLoading(true);
      await documentService.deleteDocument(id);
      await fetchDocuments(); // This will also update publicDocuments
      // Show success message briefly
      const originalError = error;
      setError('Document deleted successfully');
      setTimeout(() => setError(originalError || ''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="dashboard-loading-text mt-4">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${isVisible ? 'dashboard-visible' : ''}`}>
      <nav className="dashboard-nav">
        <div className="dashboard-nav-content">
          <div className="dashboard-nav-inner">
            <div className="dashboard-nav-left">
              <h1 className="dashboard-nav-title">Collaboration Tool</h1>
            </div>
            <div className="dashboard-nav-actions">
              <span className="dashboard-nav-welcome">{getGreeting()}, {user?.name}</span>
              <button 
                onClick={toggleTheme} 
                className="dashboard-nav-theme"
                title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
              >
                {effectiveTheme === 'light' ? '🌙' : '☀️'}
              </button>
              <button onClick={() => navigate('/profile')} className="dashboard-nav-profile">
                Profile
              </button>
              <button onClick={logout} className="dashboard-nav-logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-main">
          {/* Dashboard Stats */}
          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon dashboard-stat-icon-total">
                <span>📄</span>
              </div>
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-number">{stats.myDocs}</div>
                <div className="dashboard-stat-label">My Documents</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon dashboard-stat-icon-public">
                <span>🌍</span>
              </div>
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-number">{stats.allPublicDocs}</div>
                <div className="dashboard-stat-label">All Public</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon dashboard-stat-icon-private">
                <span>🔒</span>
              </div>
              <div className="dashboard-stat-content">
                <div className="dashboard-stat-number">{stats.myPrivateDocs}</div>
                <div className="dashboard-stat-label">My Private</div>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="dashboard-controls">
            <div className="dashboard-controls-row">
              <div className="dashboard-search">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="dashboard-search-input"
                />
              </div>
              <div className="dashboard-filters">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="dashboard-filter-select"
                >
                  <option value="all">All Documents</option>
                  <option value="my-docs">My Documents</option>
                  <option value="public">All Public Documents</option>
                  <option value="private">My Private Documents</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="dashboard-filter-select"
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="title">Title</option>
                  <option value="createdAt">Created</option>
                </select>
                <div className="dashboard-view-toggle">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`dashboard-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`dashboard-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-header">
            <div className="dashboard-title-section">
              <h2 className="dashboard-title">
                <span className="dashboard-title-icon">{getFilterIcon()}</span>
                {getFilterTitle()}
              </h2>
              {filterLoading ? (
                <span className="dashboard-filter-loading">Filtering...</span>
              ) : (
                <span className="dashboard-document-count">
                  {filteredAndSortedDocuments.length} document{filteredAndSortedDocuments.length !== 1 ? 's' : ''}
                  {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="dashboard-create-btn"
            >
              <span className="dashboard-create-icon">+</span>
              Create Document
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className={`dashboard-documents ${viewMode === 'list' ? 'dashboard-documents-list' : 'dashboard-grid'}`}>
            {filteredAndSortedDocuments.map((doc, index) => (
              <div
                key={doc.id}
                className={`dashboard-card ${viewMode === 'list' ? 'dashboard-card-list' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="dashboard-card-content">
                  <div className="dashboard-card-header">
                    <h3
                      className="dashboard-card-title"
                      onClick={() => navigate(`/editor/${doc.id}`)}
                    >
                      {doc.title}
                    </h3>
                    <div className="dashboard-card-actions">
                      <button
                        onClick={() => navigate(`/editor/${doc.id}`)}
                        className="dashboard-card-edit"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="dashboard-card-delete"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {doc.updatedAt && !isNaN(new Date(doc.updatedAt).getTime()) && (
                    <p className="dashboard-card-meta">
                      Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                  <div className="dashboard-card-footer">
                    <span className={`dashboard-card-status ${
                      doc.isPublic ? 'dashboard-card-status-public' : 'dashboard-card-status-private'
                    }`}>
                      {doc.isPublic ? '🌍 Public' : '🔒 Private'}
                    </span>
                    {doc.createdBy !== user?.userId && (
                      <span className="dashboard-card-author text-xs text-gray-500">
                        by {doc.createdBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedDocuments.length === 0 && documents.length > 0 && (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">🔍</div>
              <p className="dashboard-empty-text">No documents match your search criteria.</p>
            </div>
          )}

          {documents.length === 0 && (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">📝</div>
              <p className="dashboard-empty-text">No documents yet. Create your first document!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="dashboard-empty-create"
              >
                Create Document
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h3 className="dashboard-modal-title">Create New Document</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="dashboard-modal-close"
              >
                ×
              </button>
            </div>
            <div className="dashboard-modal-body">
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter document title..."
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                className="dashboard-modal-input"
              />
              <div className="dashboard-modal-visibility mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newDocIsPublic}
                    onChange={(e) => setNewDocIsPublic(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-600">Make this document public</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {newDocIsPublic ? 'Anyone with an account can view and edit this document' : 'Only you can access this document'}
                </p>
              </div>
            </div>
            <div className="dashboard-modal-actions">
              <button
                onClick={() => setShowCreateModal(false)}
                className="dashboard-modal-btn dashboard-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                className="dashboard-modal-btn dashboard-modal-btn-create"
                disabled={!newDocTitle.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Dashboard;