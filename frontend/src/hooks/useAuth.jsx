import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('wf_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('wf_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem('wf_user');
      return;
    }

    localStorage.setItem('wf_token', token);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      async register(payload) {
        const { data } = await api.post('/auth/register', payload);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('wf_user', JSON.stringify(data.user));
      },
      async login(payload) {
        const { data } = await api.post('/auth/login', payload);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('wf_user', JSON.stringify(data.user));
      },
      logout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem('wf_token');
        localStorage.removeItem('wf_user');
      },
      async refreshProfile() {
        if (!token) {
          return;
        }

        const { data } = await api.get('/auth/me');
        setUser(data);
        localStorage.setItem('wf_user', JSON.stringify(data));
      }
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
