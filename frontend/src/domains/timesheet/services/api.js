import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''; 
// lascia vuoto per fare intercettazione MSW per i mocks

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere token se necessario
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor globale per errori
api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || error.message)
);

export default api;