import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// Extend Window interface to include MSStream for iOS detection
declare global {
  interface Window {
    MSStream?: unknown;
  }
}

interface InstallPromptContextType {
  canInstall: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  isDismissed: boolean;
  dismissInstall: () => void;
  resetDismissal: () => void;
}

const INSTALL_BANNER_DISMISSED_KEY = 'installBannerDismissed';

const InstallPromptContext = createContext<InstallPromptContextType | undefined>(undefined);

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [canInstall, setCanInstall] = useState(false);

  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const isIOS = typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismissInstall = useCallback(() => {
    try {
      localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, 'true');
    } catch {
      /* ignore quota / private mode */
    }
    setInstallBannerDismissed(true);
  }, []);

  const resetDismissal = useCallback(() => {
    try {
      localStorage.removeItem(INSTALL_BANNER_DISMISSED_KEY);
    } catch {
      /* ignore */
    }
    setInstallBannerDismissed(false);
  }, []);

  const value: InstallPromptContextType = {
    canInstall: canInstall && !isStandalone && !installBannerDismissed,
    isIOS: isIOS && !isStandalone && !installBannerDismissed,
    isStandalone,
    isDismissed: installBannerDismissed,
    dismissInstall,
    resetDismissal,
  };

  return (
    <InstallPromptContext.Provider value={value}>
      {children}
    </InstallPromptContext.Provider>
  );
}

export function useInstallPrompt() {
  const context = useContext(InstallPromptContext);
  if (!context) {
    throw new Error('useInstallPrompt must be used within InstallPromptProvider');
  }
  return context;
}
