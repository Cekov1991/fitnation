import React, { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { authApi } from '../services/api';
import type { UserResource } from '../types/api';
interface AuthContextType {
  user: UserResource | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    partner_id?: number;
  }) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<UserResource | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          setUser(response.user);
          // Save partner slug for PWA manifest selection
          if (response.user.partner?.slug) {
            localStorage.setItem('partner-slug', response.user.partner.slug);
          } else {
            localStorage.removeItem('partner-slug');
          }
        } catch (error) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('partner-slug');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);
  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('authToken', response.token);
    setUser(response.user);
    // Save partner slug for PWA manifest selection
    if (response.user.partner?.slug) {
      localStorage.setItem('partner-slug', response.user.partner.slug);
    } else {
      localStorage.removeItem('partner-slug');
    }
  };
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('partner-slug');
    setUser(null);
  };
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    partner_id?: number;
  }) => {
    const response = await authApi.register(data);
    localStorage.setItem('authToken', response.token);
    setUser(response.user);
    // Save partner slug for PWA manifest selection
    if (response.user.partner?.slug) {
      localStorage.setItem('partner-slug', response.user.partner.slug);
    } else {
      localStorage.removeItem('partner-slug');
    }
  };
  return <AuthContext.Provider value={{
    user,
    loading,
    login,
    logout,
    register
  }}>
      {children}
    </AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}