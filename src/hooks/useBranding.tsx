import React, { useEffect, createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { PartnerVisualIdentityResource } from '../types/api';

export type Theme = 'light' | 'dark' | 'system';

interface BrandingContextType {
  logo: string | null;
  partnerName: string | null;
  hasBranding: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Default colors (must match index.css)
const DEFAULT_PRIMARY = '#2563eb';
const DEFAULT_SECONDARY = '#9333ea';

// Theme storage key
const THEME_STORAGE_KEY = 'fit-nation-theme';

// Get system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

// Get effective theme (resolves 'system' to actual theme)
const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  return theme === 'system' ? getSystemTheme() : theme;
};

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Initialize theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  });
  
  // Extract branding information from user's partner
  const visualIdentity: PartnerVisualIdentityResource | null = 
    user?.partner?.visual_identity || null;
  
  const logo = visualIdentity?.logo || null;
  const partnerName = user?.partner?.name || null;
  const hasBranding = !!visualIdentity;

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = getEffectiveTheme(theme);
    root.setAttribute('data-theme', effectiveTheme);
  }, [theme]);

  // Listen to system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const root = document.documentElement;
      root.setAttribute('data-theme', getSystemTheme());
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  // Apply CSS variables when user is logged in and has branding
  useEffect(() => {
    const root = document.documentElement;
    
    if (user && visualIdentity) {
      // Apply partner branding colors
      if (visualIdentity.primary_color) {
        root.style.setProperty('--color-primary', visualIdentity.primary_color);
      } else {
        root.style.setProperty('--color-primary', DEFAULT_PRIMARY);
      }
      
      if (visualIdentity.secondary_color) {
        root.style.setProperty('--color-secondary', visualIdentity.secondary_color);
      } else {
        root.style.setProperty('--color-secondary', DEFAULT_SECONDARY);
      }
    } else {
      // Reset to defaults when user logs out or has no branding
      root.style.setProperty('--color-primary', DEFAULT_PRIMARY);
      root.style.setProperty('--color-secondary', DEFAULT_SECONDARY);
    }
  }, [user, visualIdentity]);

  // Theme management functions
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const effectiveTheme = getEffectiveTheme(theme);
    const newTheme: Theme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  return (
    <BrandingContext.Provider
      value={{
        logo,
        partnerName,
        hasBranding,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
