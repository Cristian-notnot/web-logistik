import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Sisipkan token JWT ke setiap request kalau ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('simlog_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Kalau token kadaluarsa / tidak valid, paksa kembali ke halaman login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('simlog_token');
      localStorage.removeItem('simlog_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
