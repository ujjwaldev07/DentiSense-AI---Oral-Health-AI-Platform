import api from './client.js';

// Authentication Endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/signup', userData),
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/profile'),
  forgotPassword: (emailData) => api.post('/auth/forgot-password', emailData),
  resetPassword: (payload) => api.post('/auth/reset-password', payload)
};

// User Profile & Settings Endpoints
export const userAPI = {
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  updatePreferences: (preferences) => api.put('/auth/profile', { preferredLanguage: preferences.preferredLanguage }),
  updatePassword: (passwordData) => api.put('/auth/profile', passwordData),
  getAllUsers: (params) => api.get('/users', { params }),
  updateUserStatus: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// AI Dental Chat Endpoints
export const chatAPI = {
  sendMessage: (payload) => api.post('/chat/message', payload),
  getHistory: (params) => api.get('/chat/conversations', { params }),
  getChatById: (id) => api.get(`/chat/conversations/${id}`),
  deleteChat: (id) => api.delete(`/chat/conversations/${id}`),
  getChatSources: (id) => api.get(`/chat/conversations/${id}`),
  rateChat: (id, ratingData) => api.post(`/chat/conversations/${id}/rate`, ratingData)
};

// Dental Knowledge Base Endpoints (/api/knowledge namespace)
export const knowledgeAPI = {
  getDocuments: (params) => api.get('/knowledge', { params }),
  getDocumentBySlug: (slug) => api.get(`/knowledge/${slug}`),
  getCategories: () => api.get('/knowledge/categories'),
  createCategory: (categoryData) => api.post('/knowledge/categories', categoryData),
  createDocument: (docData) => api.post('/knowledge', docData),
  updateDocument: (id, docData) => api.put(`/knowledge/${id}`, docData),
  deleteDocument: (id) => api.delete(`/knowledge/${id}`),
  reindexAll: () => api.post('/knowledge/admin/reindex'),
  reindexDocument: (id) => api.post(`/knowledge/${id}/reindex`),
  uploadPdf: (formData) => api.post('/knowledge/upload-pdf', formData),
  getIngestionStatus: (jobId) => api.get(`/knowledge/ingestion-status/${jobId}`)
};

// Alias for backwards compatibility across older imports
export const diseaseAPI = knowledgeAPI;

// Symptom Assessment Endpoints
export const assessmentAPI = {
  submitAssessment: (payload) => api.post('/assessment', payload),
  getHistory: (params) => api.get('/assessment', { params }),
  getAssessmentById: (id) => api.get(`/assessment/${id}`),
  deleteAssessment: (id) => api.delete(`/assessment/${id}`)
};

// Analytics Endpoints
export const analyticsAPI = {
  getUserAnalytics: (params) => api.get('/analytics/me', { params }),
  getUserActivity: async (params) => {
    const res = await api.get('/analytics/me', { params });
    return { data: { activity: res.data?.recentActivities || [] } };
  },
  getUserTopics: async (params) => {
    const res = await api.get('/analytics/me', { params });
    return { data: { topics: res.data?.userTopics || [] } };
  },
  getAdminOverview: async () => {
    const res = await api.get('/analytics/admin');
    return { data: { overview: res.data?.summary || {}, ...res.data } };
  },
  getAdminTopics: async () => {
    const res = await api.get('/analytics/admin');
    return { data: { topics: res.data?.topTopics || [] } };
  },
  getAdminUsers: async () => {
    const res = await api.get('/analytics/admin');
    return { data: { users: { languageDistribution: res.data?.languageDistribution || [] } } };
  },
  getAdminFeedback: async () => {
    const res = await api.get('/analytics/admin');
    return { data: { feedback: { ratingDistribution: res.data?.ratingDistribution || [] } } };
  }
};

// Feedback Endpoints
export const feedbackAPI = {
  submitFeedback: (payload) => api.post('/feedback', payload),
  getMyFeedback: () => api.get('/feedback/me'),
  getAllFeedbacks: (params) => api.get('/feedback', { params }),
  updateStatus: (id, data) => api.put(`/feedback/${id}`, data)
};

// System Health
export const systemAPI = {
  getHealth: () => api.get('/health')
};

