import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Evitar redirecciones infinitas si ya estamos en rutas públicas de autenticación
      const publicPaths = ['/login', '/forgot-password', '/reset-password'];
      const isPublicPath = publicPaths.some(path => window.location.pathname.includes(path));
      
      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
