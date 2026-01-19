import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * BeforeInstallPromptEvent interface
 * This event is fired by Chrome/Chromium browsers when the app meets PWA installability criteria
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Extend Window interface to include MSStream for iOS detection
declare global {
  interface Window {
    MSStream?: unknown;
  }
}

// Dismissal tracking disabled - always show install button
// const DISMISSED_KEY = 'pwa-install-dismissed';

/**
 * Custom hook for managing PWA "Add to Home Screen" functionality
 * 
 * Handles two platforms:
 * 1. Android/Chrome: Uses the beforeinstallprompt event to show native install prompt
 * 2. iOS Safari: Detects iOS and provides flag to show custom instructions modal
 * 
 * Features:
 * - Stores deferred install prompt for later use (user interaction required)
 * - Remembers user dismissal via localStorage
 * - Detects standalone mode (already installed)
 */
export function useInstallPrompt() {
  // Deferred prompt event from beforeinstallprompt
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  
  // Whether native install prompt is available (Android/Chrome)
  const [canInstall, setCanInstall] = useState(false);
  
  // Whether user has previously dismissed the install prompt
  // Note: Currently disabled - always show install button
  const isDismissed = false;

  // iOS Safari detection
  // Check for iOS devices that are NOT running in standalone mode
  const isIOS = typeof navigator !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    !window.MSStream;

  // Check if app is already running in standalone mode (installed)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari standalone mode check
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );

  // Listen for the beforeinstallprompt event (Android/Chrome only)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      // Update state to show install button
      setCanInstall(true);
    };

    // Listen for app installed event to clean up
    const handleAppInstalled = () => {
      // Clear the deferred prompt
      deferredPrompt.current = null;
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Trigger the native install prompt (Android/Chrome only)
   * Must be called from a user gesture (click handler)
   */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt.current) {
      return;
    }

    // Show the native install prompt
    await deferredPrompt.current.prompt();

    // Wait for the user's response
    await deferredPrompt.current.userChoice;

    // Clear the deferred prompt - it can only be used once
    deferredPrompt.current = null;
    setCanInstall(false);

  }, []);

  /**
   * Manually dismiss the install prompt (no-op, always show button)
   */
  const dismissInstall = useCallback(() => {
    // No-op - always show install button
  }, []);

  /**
   * Reset dismissal state (no-op)
   */
  const resetDismissal = useCallback(() => {
    // No-op
  }, []);

  return {
    // Whether native install prompt is available (Android/Chrome)
    canInstall: canInstall && !isStandalone,
    // Whether on iOS Safari (show custom instructions)
    isIOS: isIOS && !isStandalone,
    // Whether app is already installed/running in standalone mode
    isStandalone,
    // Whether user has dismissed the prompt (always false now)
    isDismissed,
    // Trigger native install prompt (Android/Chrome)
    promptInstall,
    // Dismiss (no-op)
    dismissInstall,
    // Reset dismissal (no-op)
    resetDismissal,
  };
}
