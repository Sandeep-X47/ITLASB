import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => JSON.parse(localStorage.getItem('itlasb_user') || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem('itlasb_token'));

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('itlasb_token', data.token);
    localStorage.setItem('itlasb_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, password) => {
    await api.post('/auth/register', { username, password });
  };

  const logout = () => {
    localStorage.removeItem('itlasb_token');
    localStorage.removeItem('itlasb_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
