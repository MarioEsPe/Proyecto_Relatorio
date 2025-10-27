// relatorio-ui/src/services/api.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore'; 


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();      
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;