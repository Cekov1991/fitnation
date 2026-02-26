import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';
import type { UserResource } from '../types/api';
import { updatePWAManifest } from '../utils/pwa';
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
    invitation_token: string;
  }) => Promise<void>;
  refetchUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
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
            // Update PWA manifest and icons dynamically
            updatePWAManifest(response.user.partner.slug);
          } else {
            localStorage.removeItem('partner-slug');
            updatePWAManifest(null);
          }
        } catch (error) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('partner-slug');
          updatePWAManifest(null);
        }
      } else {
        // No user logged in, reset to default
        updatePWAManifest(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);
  const login = async (email: string, password: string) => {
    // Clear cache before login to ensure fresh data is fetched for the new user
    queryClient.clear();
    const response = await authApi.login(email, password);
    localStorage.setItem('authToken', response.token);
    setUser(response.user);
    // Save partner slug for PWA manifest selection
    if (response.user.partner?.slug) {
      localStorage.setItem('partner-slug', response.user.partner.slug);
      // Update PWA manifest and icons dynamically
      updatePWAManifest(response.user.partner.slug);
    } else {
      localStorage.removeItem('partner-slug');
      updatePWAManifest(null);
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
    // Clear all React Query cache to prevent previous user's data from persisting
    queryClient.clear();
    setUser(null);
    // Reset PWA manifest to default
    updatePWAManifest(null);
  };
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    invitation_token: string;
  }) => {
    const response = await authApi.register(data);
    localStorage.setItem('authToken', response.token);
    setUser(response.user);
    // Save partner slug for PWA manifest selection
    if (response.user.partner?.slug) {
      localStorage.setItem('partner-slug', response.user.partner.slug);
      // Update PWA manifest and icons dynamically
      updatePWAManifest(response.user.partner.slug);
    } else {
      localStorage.removeItem('partner-slug');
      updatePWAManifest(null);
    }
  };
  const refetchUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.user);
      // Save partner slug for PWA manifest selection
      if (response.user.partner?.slug) {
        localStorage.setItem('partner-slug', response.user.partner.slug);
        // Update PWA manifest and icons dynamically
        updatePWAManifest(response.user.partner.slug);
      } else {
        localStorage.removeItem('partner-slug');
        updatePWAManifest(null);
      }
    } catch (error) {
      // If refetch fails, user might be logged out
      localStorage.removeItem('authToken');
      localStorage.removeItem('partner-slug');
      updatePWAManifest(null);
      setUser(null);
    }
  };
  return <AuthContext.Provider value={{
    user,
    loading,
    login,
    logout,
    register,
    refetchUser
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