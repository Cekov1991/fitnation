import React, { useEffect, createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { partnersApi } from '../services/api';
import { getPartnerSlugFromSubdomain } from '../utils/subdomain';
import { updatePWAManifest } from '../utils/pwa';
import type { PartnerVisualIdentityResource } from '../types/api';

export type Theme = 'light' | 'dark' | 'system';

interface BrandingContextType {
  logo: string | null;
  partnerName: string | null;
  hasBranding: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  partnerSlug: string | null;
  subdomainLoading: boolean;
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
  
  // Track effective theme to trigger color updates
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => 
    getEffectiveTheme(theme)
  );

  // --- Subdomain-based branding (for unauthenticated routes) ---
  const [subdomainBranding, setSubdomainBranding] = useState<{
    name: string;
    slug: string;
    visual_identity: PartnerVisualIdentityResource | null;
  } | null>(null);
  const [subdomainLoading, setSubdomainLoading] = useState(false);

  const detectedSlug = getPartnerSlugFromSubdomain();

  // TODO: Remove debug logs after verifying subdomain branding works
  console.log('[Branding] detectedSlug:', detectedSlug);

  // Fetch partner branding on mount if subdomain is detected
  useEffect(() => {
    console.log('[Branding] useEffect fired, detectedSlug:', detectedSlug);
    if (!detectedSlug) return;

    let cancelled = false;
    setSubdomainLoading(true);

    partnersApi.getBrandingBySlug(detectedSlug)
      .then((response) => {
        console.log('[Branding] API response:', response);
        if (!cancelled) {
          // Transform backend response: map 'identity' to 'visual_identity' to match frontend expectations
          const branding = {
            name: response.data.name,
            slug: response.data.slug,
            visual_identity: response.data.visual_identity || null,
          };
          console.log('[Branding] Setting subdomainBranding:', branding);
          setSubdomainBranding(branding);
        }
      })
      .catch((err) => {
        console.warn('[Branding] Failed to load partner branding for subdomain:', detectedSlug, err);
        if (!cancelled) setSubdomainBranding(null);
      })
      .finally(() => {
        if (!cancelled) setSubdomainLoading(false);
      });

    return () => { cancelled = true; };
  }, [detectedSlug]);

  // --- Resolve which branding to use ---
  // Authenticated: use user's partner branding (existing behavior)
  // Unauthenticated: use subdomain branding
  const visualIdentity: PartnerVisualIdentityResource | null =
    user
      ? (user.partner?.visual_identity || null)
      : (subdomainBranding?.visual_identity || null);

  const logo = user
    ? (user.partner?.visual_identity?.logo || null)
    : (subdomainBranding?.visual_identity?.logo || null);

  const partnerName = user
    ? (user.partner?.name || null)
    : (subdomainBranding?.name || null);

  const partnerSlug = user
    ? (user.partner?.slug || null)
    : (subdomainBranding?.slug || detectedSlug);

  const hasBranding = !!visualIdentity;

  // Apply theme to document and update effective theme
  useEffect(() => {
    const root = document.documentElement;
    const currentEffectiveTheme = getEffectiveTheme(theme);
    root.setAttribute('data-theme', currentEffectiveTheme);
    setEffectiveTheme(currentEffectiveTheme);
  }, [theme]);

  // Listen to system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const root = document.documentElement;
      const newEffectiveTheme = getSystemTheme();
      root.setAttribute('data-theme', newEffectiveTheme);
      setEffectiveTheme(newEffectiveTheme);
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

  // Apply CSS variables when branding is available (from user or subdomain)
  console.log('[Branding] Render - visualIdentity:', visualIdentity, 'hasBranding:', hasBranding, 'effectiveTheme:', effectiveTheme);
  useEffect(() => {
    const root = document.documentElement;
    console.log('[Branding] CSS effect - visualIdentity:', visualIdentity);
    
    if (visualIdentity) {
      // Apply partner branding colors based on effective theme
      // Use dark variants in dark theme, fallback to regular colors if dark variants aren't available
      const primaryColor = effectiveTheme === 'dark' 
        ? (visualIdentity.primary_color_dark || visualIdentity.primary_color)
        : visualIdentity.primary_color;
      
      const secondaryColor = effectiveTheme === 'dark'
        ? (visualIdentity.secondary_color_dark || visualIdentity.secondary_color)
        : visualIdentity.secondary_color;
      
      root.style.setProperty('--color-primary', primaryColor || DEFAULT_PRIMARY);
      root.style.setProperty('--color-secondary', secondaryColor || DEFAULT_SECONDARY);
    } else {
      // Reset to defaults when no branding is available
      root.style.setProperty('--color-primary', DEFAULT_PRIMARY);
      root.style.setProperty('--color-secondary', DEFAULT_SECONDARY);
    }
  }, [visualIdentity, effectiveTheme]);

  // Update PWA manifest based on partner slug
  useEffect(() => {
    if (partnerSlug) {
      updatePWAManifest(partnerSlug);
    } else {
      updatePWAManifest(null);
    }
  }, [partnerSlug]);

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
        partnerSlug,
        subdomainLoading,
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
