import { useEffect, useMemo } from 'react';
import { usePartnerBranding, partnerBrandColors } from '@fit-nation/shared';
import { useBranding } from './useBranding';

/**
 * Partner colours on a public Station page. The pages live on the main web
 * domain, so BrandingProvider's subdomain detection finds no Partner there —
 * instead the slug comes from the Station the QR named, once its fetch lands.
 *
 * Writes the same two CSS variables BrandingProvider owns and hands them back
 * on unmount, so leaving the Station pages restores the session's own brand.
 */
export function useStationBranding(partnerSlug: string | null | undefined) {
  const { colors: baseColors, effectiveTheme } = useBranding();
  const branding = usePartnerBranding(partnerSlug ?? null);

  const colors = useMemo(
    () => ({ ...baseColors, ...partnerBrandColors(branding.data?.visual_identity, effectiveTheme) }),
    [baseColors, branding.data?.visual_identity, effectiveTheme]
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    return () => {
      root.style.setProperty('--color-primary', baseColors.primary);
      root.style.setProperty('--color-secondary', baseColors.secondary);
    };
  }, [colors, baseColors]);
}
