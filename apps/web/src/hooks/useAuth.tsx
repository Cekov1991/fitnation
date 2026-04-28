import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, getAuthStorage, AUTH_TOKEN_KEY } from '@fit-nation/shared';
import type { UserResource } from '@fit-nation/shared';

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
    partner_id: number;
  }) => Promise<void>;
  resendVerification: () => Promise<void>;
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
    const initAuthCheck = async () => {
      const storage = getAuthStorage()
      const token = await storage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          setUser(response.user);
          // Save partner slug for PWA manifest selection
          if (response.user.partner?.slug) {
            await storage.setItem('partner-slug', response.user.partner.slug);
          } else {
            await storage.removeItem('partner-slug');
          }
        } catch (error) {
          await storage.removeItem(AUTH_TOKEN_KEY);
          await storage.removeItem('partner-slug');
        }
      }
      setLoading(false);
    };
    initAuthCheck();
  }, []);
  const login = async (email: string, password: string) => {
    // Clear cache before login to ensure fresh data is fetched for the new user
    queryClient.clear();
    const storage = getAuthStorage()
    const response = await authApi.login(email, password);
    await storage.setItem(AUTH_TOKEN_KEY, response.token);
    setUser(response.user);
    // Save partner slug for PWA manifest selection
    if (response.user.partner?.slug) {
      await storage.setItem('partner-slug', response.user.partner.slug);
    } else {
      await storage.removeItem('partner-slug');
    }
  };
  const logout = async () => {
    const storage = getAuthStorage()
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    }
    await storage.removeItem(AUTH_TOKEN_KEY);
    await storage.removeItem('partner-slug');
    // Clear all React Query cache to prevent previous user's data from persisting
    queryClient.clear();
    setUser(null);
  };
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    partner_id: number;
  }) => {
    const storage = getAuthStorage()
    const response = await authApi.register(data);
    await storage.setItem(AUTH_TOKEN_KEY, response.token);
    setUser(response.user);
    // Save partner slug for PWA manifest selection
    if (response.user.partner?.slug) {
      await storage.setItem('partner-slug', response.user.partner.slug);
    } else {
      await storage.removeItem('partner-slug');
    }
  };

  const resendVerification = async () => {
    await authApi.resendVerificationEmail();
  };
  // Refresh user when tab becomes visible (so email_verified_at updates automatically)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      const storage = getAuthStorage();
      const token = await storage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;
      try {
        const response = await authApi.getCurrentUser();
        setUser(response.user);
        if (response.user.partner?.slug) {
          await storage.setItem('partner-slug', response.user.partner.slug);
        } else {
          await storage.removeItem('partner-slug');
        }
      } catch {
        // silent — protected route guards will handle expiry
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const refetchUser = async () => {
    const storage = getAuthStorage()
    const token = await storage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.user);
      // Save partner slug for PWA manifest selection
      if (response.user.partner?.slug) {
        await storage.setItem('partner-slug', response.user.partner.slug);
      } else {
        await storage.removeItem('partner-slug');
      }
    } catch (error) {
      // If refetch fails, user might be logged out
      await storage.removeItem(AUTH_TOKEN_KEY);
      await storage.removeItem('partner-slug');
      setUser(null);
    }
  };
  return <AuthContext.Provider value={{
    user,
    loading,
    login,
    logout,
    register,
    resendVerification,
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
