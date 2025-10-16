// frontend/apiClient.js

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Backend base URL
});

// ✅ Attach token to every request if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Handle 401 errors globally — force re-login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Token expired or unauthorized
      localStorage.removeItem('access_token'); // Clean up
      window.location.href = '/login'; // Force re-login
    }

    return Promise.reject(err);
  }
);

export default api;
