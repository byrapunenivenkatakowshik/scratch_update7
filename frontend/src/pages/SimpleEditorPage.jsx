import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { documentService } from '../services/api';
import SimpleEditor from '../components/SimpleEditor';

const SimpleEditorPage = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Debug info
  console.log('SimpleEditorPage - ID:', id);
  console.log('SimpleEditorPage - User:', user);

  useEffect(() => {
    if (id && user) {
      fetchDocument();
    } else {
      setLoading(false);
      if (!user) {
        setError('Please log in to view this document');
      }
      if (!id) {
        setError('No document ID provided');
      }
    }
  }, [id, user]);

  const fetchDocument = async () => {
    console.log('🔍 Fetching document with ID:', id);
    setLoading(true);
    setError('');
    
    try {
      const response = await documentService.getDocument(id);
      console.log('📄 Document fetched:', response);
      
      if (response.document) {
        setDocument(response.document);
        setTitle(response.document.title || 'Untitled Document');
        setContent(response.document.content || '');
        setLastSaved(new Date(response.document.updatedAt));
      } else {
        setError('Document not found');
      }
    } catch (err) {
      console.error('❌ Error fetching document:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch document');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (newContent) => {
    console.log('📝 Content changed');
    setContent(newContent);
    // Auto-save after 2 seconds of inactivity
    setTimeout(() => {
      saveDocument(newContent);
    }, 2000);
  };

  const handleTitleChange = (newTitle) => {
    console.log('📝 Title changed:', newTitle);
    setTitle(newTitle);
    // Auto-save after 2 seconds of inactivity
    setTimeout(() => {
      saveDocument(content, newTitle);
    }, 2000);
  };

  const saveDocument = async (contentToSave = content, titleToSave = title) => {
    if (!document) return;

    setSaving(true);
    try {
      console.log('💾 Saving document...');
      await documentService.updateDocument(id, titleToSave, contentToSave);
      setLastSaved(new Date());
      console.log('✅ Document saved successfully');
    } catch (err) {
      console.error('❌ Error saving document:', err);
      setError('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = () => {
    saveDocument();
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading document...</div>
          <div style={{ color: '#666' }}>Document ID: {id}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '20px', 
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Error Loading Document</h3>
          <p style={{ margin: '0 0 20px 0' }}>{error}</p>
          <div>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Go to Dashboard
            </button>
            <button 
              onClick={fetchDocument}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #ddd',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
          
          <div>
            <h1 style={{ margin: 0, fontSize: '20px' }}>Simple Editor</h1>
            {lastSaved && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={handleManualSave}
            disabled={saving}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: saving ? '#6c757d' : '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          
          <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
          
          <button 
            onClick={logout}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Document Title */}
      <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #ddd' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Document Title"
          style={{
            width: '100%',
            fontSize: '24px',
            fontWeight: 'bold',
            border: 'none',
            outline: 'none',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* Editor */}
      <div style={{ padding: '20px' }}>
        <SimpleEditor
          content={content}
          onUpdate={handleContentChange}
          editable={true}
        />
      </div>

      {/* Status */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px',
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '12px',
        color: '#666'
      }}>
        Status: {saving ? 'Saving...' : 'Ready'}
      </div>
    </div>
  );
};

export default SimpleEditorPage;