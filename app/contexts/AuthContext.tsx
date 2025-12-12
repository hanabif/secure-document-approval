"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  username: string;
  role: string; // normalized role string like 'ADMIN', 'MANAGER', etc.
}
const normalizeRole = (role: any): string => {
  if (typeof role === 'string') {
    if (/^\d+$/.test(role)) {
      const n = parseInt(role, 10);
      if (n === 99) return 'ADMIN';
      if (n === 3) return 'DIRECTOR';
      if (n === 2) return 'SENIOR_MANAGER';
      if (n === 1) return 'MANAGER';
      return 'USER';
    }
    const upper = role.toUpperCase();
    if (upper === 'ADMIN') return 'ADMIN';
    if (upper === 'DIRECTOR') return 'DIRECTOR';
    if (upper === 'SENIOR_MANAGER') return 'SENIOR_MANAGER';
    if (upper === 'MANAGER') return 'MANAGER';
    return 'USER';
  }
  if (typeof role === 'number') {
    if (role === 99) return 'ADMIN';
    if (role === 3) return 'DIRECTOR';
    if (role === 2) return 'SENIOR_MANAGER';
    if (role === 1) return 'MANAGER';
    return 'USER';
  }
  return 'USER';
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const bootstrap = async () => {
      if (token) {
        try {
          // Authorization header is added by api interceptor, but ensure it's present early
          api.defaults.headers.common['Authorization'] = `Token ${token}`;
          const meRes = await api.get('/accounts/auth/me/');
          const u = meRes.data;
          setUser({ id: u.id, username: u.username, role: normalizeRole(u.role) });
          setIsAuthenticated(true);
        } catch (err) {
          // Invalid token or server unreachable
          localStorage.removeItem('access_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    bootstrap();
  }, []);

  const login = async (token: string) => {
    try {
      localStorage.setItem('access_token', token);
      api.defaults.headers.common['Authorization'] = `Token ${token}`;
      const meRes = await api.get('/accounts/auth/me/');
      const u = meRes.data;
      setUser({ id: u.id, username: u.username, role: normalizeRole(u.role) });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user on login:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('access_token');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};