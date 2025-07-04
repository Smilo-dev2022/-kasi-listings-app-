import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (passwords) => api.put('/auth/password', passwords),
};

// Listings API calls
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  getUserListings: () => api.get('/listings/my-listings'),
};

// Jobs API calls
export const jobsAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  getUserJobs: () => api.get('/jobs/my-jobs'),
  apply: (id, data) => api.post(`/jobs/${id}/apply`, data),
};

// Skills API calls
export const skillsAPI = {
  getAll: (params) => api.get('/skills', { params }),
  getById: (id) => api.get(`/skills/${id}`),
  create: (data) => api.post('/skills', data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
  getUserSkills: () => api.get('/skills/my-skills'),
  hire: (id, data) => api.post(`/skills/${id}/hire`, data),
};

// Businesses API calls
export const businessesAPI = {
  getAll: (params) => api.get('/businesses', { params }),
  getById: (id) => api.get(`/businesses/${id}`),
  create: (data) => api.post('/businesses', data),
  update: (id, data) => api.put(`/businesses/${id}`, data),
  delete: (id) => api.delete(`/businesses/${id}`),
  getUserBusinesses: () => api.get('/businesses/my-businesses'),
};

// Advertisements API calls
export const adsAPI = {
  getAll: (params) => api.get('/advertisements', { params }),
  getById: (id) => api.get(`/advertisements/${id}`),
  create: (data) => api.post('/advertisements', data),
  update: (id, data) => api.put(`/advertisements/${id}`, data),
  delete: (id) => api.delete(`/advertisements/${id}`),
  getUserAds: () => api.get('/advertisements/my-ads'),
  markAsPaid: (id) => api.put(`/advertisements/${id}/paid`),
};

// Messaging API calls
export const messagingAPI = {
  getConversations: () => api.get('/messaging/conversations'),
  getMessages: (conversationId) => api.get(`/messaging/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, data) => api.post(`/messaging/conversations/${conversationId}/messages`, data),
  createConversation: (data) => api.post('/messaging/conversations', data),
  markAsRead: (conversationId) => api.put(`/messaging/conversations/${conversationId}/read`),
};

// Search API calls
export const searchAPI = {
  search: (query, filters) => api.post('/search', { query, filters }),
  getSuggestions: (query) => api.get('/search/suggestions', { params: { q: query } }),
};

// Users API calls
export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Subscriptions API calls
export const subscriptionsAPI = {
  getAll: () => api.get('/subscriptions'),
  getUserSubscriptions: () => api.get('/subscriptions/my-subscriptions'),
  create: (data) => api.post('/subscriptions', data),
  cancel: (id) => api.post(`/subscriptions/${id}/cancel`),
};

// Payments API calls
export const paymentsAPI = {
  createPaymentIntent: (data) => api.post('/payments/create-payment-intent', data),
  processAdvertisementPayment: (data) => api.post('/payments/advertisement', data),
  processSubscriptionPayment: (data) => api.post('/payments/subscription', data),
  getPaymentHistory: () => api.get('/payments/history'),
};

// Admin API calls
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getListings: (params) => api.get('/admin/listings', { params }),
  approveListing: (id) => api.put(`/admin/listings/${id}/approve`),
  rejectListing: (id) => api.put(`/admin/listings/${id}/reject`),
  getAds: (params) => api.get('/admin/advertisements', { params }),
  approveAd: (id) => api.put(`/admin/advertisements/${id}/approve`),
  rejectAd: (id) => api.put(`/admin/advertisements/${id}/reject`),
};

export default api; 