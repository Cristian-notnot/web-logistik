import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('simlog_user');
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      // Data storage bisa rusak karena perubahan versi aplikasi atau edit manual.
      localStorage.removeItem('simlog_user');
      localStorage.removeItem('simlog_token');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function login(username, password) {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('simlog_token', data.token);
      localStorage.setItem('simlog_user', JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Coba lagi.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('simlog_token');
    localStorage.removeItem('simlog_user');
    setUser(null);
  }

  function updateUser(nextUser) {
    localStorage.setItem('simlog_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }

  const isAdmin = user?.role === 'admin_logistik';

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, error, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
