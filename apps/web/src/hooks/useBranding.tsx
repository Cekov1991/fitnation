import { useEffect, createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { usePartnerBranding, resolvePartnerIdentity, partnerBrandColors, type ColorScheme } from '@fit-nation/shared';
import { getPartnerSlugFromSubdomain } from '../utils/subdomain';
import { updatePWAManifest } from '../utils/pwa';

export type Theme = 'light' | 'dark' | 'system';

export interface BrandColors {
  primary: string;
  secondary: string;
}

interface BrandingContextType {
  logo: string | null;
  partnerName: string | null;
  hasBranding: boolean;
  /** The brand colours in effect — the same values written to the CSS variables. */
  colors: BrandColors;
  theme: Theme;
  /** `theme` with 'system' resolved. */
  effectiveTheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  partnerSlug: string | null;
  subdomainLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Default colors (must match index.css)
const DEFAULT_COLORS: BrandColors = {
  primary: '#00B4C5',   // Fit Nation teal
  secondary: '#F97316', // Fit Nation orange
};

// Theme storage key
const THEME_STORAGE_KEY = 'fit-nation-theme';

const LIGHT_QUERY = '(prefers-color-scheme: light)';

const getSystemTheme = (): ColorScheme => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark';
};

/**
 * The resolved visual identity for this session (0029): one answer for which
 * Partner — the signed-in user's, else the host name's — and the colours for
 * the active theme, exposed on the context and written to the CSS variables
 * from the same object, so a component's dependency on a brand colour can be
 * visible to the compiler instead of living only in a `var(--color-primary)`.
 */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Initialize theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  });

  // The OS preference, kept current; the effective theme derives from it and
  // `theme` in render, so it is never a render behind.
  const [systemTheme, setSystemTheme] = useState<ColorScheme>(getSystemTheme);
  useEffect(() => {
    const mediaQuery = window.matchMedia(LIGHT_QUERY);
    const handleChange = () => setSystemTheme(getSystemTheme());
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);
  const effectiveTheme: ColorScheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // --- Which Partner ---------------------------------------------------------
  // Signed out on a white-label host, the host name names the Partner; its
  // public branding is fetched through React Query like every other read.
  const detectedSlug = getPartnerSlugFromSubdomain();
  const subdomainBranding = usePartnerBranding(user ? null : detectedSlug);
  const identity = useMemo(
    () => resolvePartnerIdentity(user, subdomainBranding.data ?? null, detectedSlug),
    [user, subdomainBranding.data, detectedSlug]
  );

  const colors = useMemo<BrandColors>(
    () => ({ ...DEFAULT_COLORS, ...partnerBrandColors(identity.visualIdentity, effectiveTheme) }),
    [identity.visualIdentity, effectiveTheme]
  );

  // The CSS variables are written from the same object the context exposes.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
  }, [colors]);

  useEffect(() => {
    updatePWAManifest(identity.slug);
  }, [identity.slug]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(effectiveTheme === 'light' ? 'dark' : 'light');
  }, [effectiveTheme, setTheme]);

  const value = useMemo<BrandingContextType>(
    () => ({
      logo: identity.logo,
      partnerName: identity.name,
      hasBranding: identity.visualIdentity != null,
      colors,
      theme,
      effectiveTheme,
      setTheme,
      toggleTheme,
      partnerSlug: identity.slug,
      subdomainLoading: subdomainBranding.isLoading,
    }),
    [identity, colors, theme, effectiveTheme, setTheme, toggleTheme, subdomainBranding.isLoading]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
