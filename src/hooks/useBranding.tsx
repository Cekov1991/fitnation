import React, { useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import type { PartnerVisualIdentityResource } from '../types/api';

interface BrandingContextType {
  logo: string | null;
  partnerName: string | null;
  hasBranding: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

// Default colors (must match index.css)
const DEFAULT_PRIMARY = '#2563eb';
const DEFAULT_SECONDARY = '#9333ea';

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Extract branding information from user's partner
  const visualIdentity: PartnerVisualIdentityResource | null = 
    user?.partner?.visual_identity || null;
  
  const logo = visualIdentity?.logo || null;
  const partnerName = user?.partner?.name || null;
  const hasBranding = !!visualIdentity;

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

  return (
    <BrandingContext.Provider
      value={{
        logo,
        partnerName,
        hasBranding,
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
