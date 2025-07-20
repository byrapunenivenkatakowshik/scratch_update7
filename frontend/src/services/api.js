import axios from 'axios';
import config from '../config/config';

const API_BASE_URL = config.apiUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      details: error.response?.data?.details
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login/register pages
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const documentService = {
  createDocument: async (title, content = '', isPublic = false) => {
    const response = await api.post('/documents', { title, content, isPublic });
    return response.data;
  },

  getDocuments: async () => {
    const response = await api.get('/documents');
    return response.data;
  },

  getPublicDocuments: async () => {
    const response = await api.get('/documents/public');
    return response.data;
  },

  getDocument: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  updateDocument: async (id, title, content) => {
    const response = await api.put(`/documents/${id}`, { title, content });
    return response.data;
  },

  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  searchUsers: async (query) => {
    const response = await api.get(`/documents/search/users?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  inviteUser: async (documentId, userEmail, role = 'editor') => {
    const response = await api.post(`/documents/${documentId}/invite`, { userEmail, role });
    return response.data;
  },

  getCollaborators: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/collaborators`);
    return response.data;
  },

  removeCollaborator: async (documentId, collaboratorId) => {
    const response = await api.delete(`/documents/${documentId}/collaborators/${collaboratorId}`);
    return response.data;
  },

  updateCollaboratorRole: async (documentId, collaboratorId, role) => {
    const response = await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/role`, { role });
    return response.data;
  },
};

export const commentService = {
  getComments: async (documentId) => {
    const response = await api.get(`/comments/document/${documentId}`);
    return response.data;
  },

  addComment: async (documentId, content) => {
    const response = await api.post(`/comments/document/${documentId}`, { content });
    return response.data;
  },

  updateComment: async (commentId, content) => {
    const response = await api.put(`/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  resolveComment: async (commentId, isResolved) => {
    const response = await api.put(`/comments/${commentId}/resolve`, { isResolved });
    return response.data;
  },
};


export default api;