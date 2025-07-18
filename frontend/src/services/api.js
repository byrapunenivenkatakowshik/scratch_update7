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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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

  addComment: async (documentId, text, selectedText, range, position, type, suggestedText) => {
    const response = await api.post('/comments', {
      documentId,
      text,
      selectedText,
      range,
      position,
      type,
      suggestedText
    });
    return response.data;
  },

  updateComment: async (commentId, text) => {
    const response = await api.put(`/comments/${commentId}`, { text });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  resolveComment: async (commentId, action) => {
    const response = await api.put(`/comments/${commentId}/resolve`, { action });
    return response.data;
  },

  addReply: async (commentId, text) => {
    const response = await api.post(`/comments/${commentId}/reply`, { text });
    return response.data;
  },

  getUserComments: async (userId) => {
    const response = await api.get(`/comments/user/${userId}`);
    return response.data;
  }
};

export default api;