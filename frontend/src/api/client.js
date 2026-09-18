import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5060/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
});

// Request Interceptor: Attach JWT Token & Preserve FormData Boundaries
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('denta_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // When transmitting FormData, let the browser/Axios compute the boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors & Token Expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup');
      if (!isAuthRoute) {
        localStorage.removeItem('denta_token');
        localStorage.removeItem('denta_user');
      }
    }

    let message = error.response?.data?.message;

    if (!message) {
      if (error.response?.status === 502) {
        message = 'Unable to connect to the server (502 Bad Gateway). Please check if the backend service is running.';
      } else if (error.response?.status === 503) {
        message = 'The service is temporarily unavailable. Please try again in a moment.';
      } else if (error.response?.status === 504) {
        message = 'Gateway timeout. The server took too long to respond.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        message = 'Request timed out. The operation took longer than expected.';
      } else {
        message = error.message || 'An unexpected communication error occurred.';
      }
    }

    const err = new Error(message);
    err.response = error.response;
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

export default api;
