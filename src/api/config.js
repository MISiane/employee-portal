import axios from 'axios';
import { isSessionInvalid } from './authFailure';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// If the server says the session is no longer valid (token expired, account
// deactivated or deleted), clear it and send the user to the login page
// instead of leaving the app on a blank, empty screen.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSessionInvalid(error)) {
      try {
        localStorage.removeItem('token');
      } catch (_) {}
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;