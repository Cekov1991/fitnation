/**
 * Extracts the partner slug from the subdomain.
 * 
 * Production:  synergy.fitnation.mk      → "synergy"
 *              premium-fitness.fitnation.mk → "premium-fitness"
 *              fitnation.mk               → null
 *              www.fitnation.mk            → null (ignore www)
 * 
 * Local dev:   Uses ?partner=synergy query param as a fallback
 *              http://localhost:5173/login?partner=synergy
 */
export function getPartnerSlugFromSubdomain(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // fitnation.mk = 2 parts; synergy.fitnation.mk = 3 parts
  if (parts.length > 2) {
    // First segment is the partner slug (e.g. "synergy")
    // Ignore "www" as a subdomain
    const subdomain = parts[0];
    if (subdomain === 'www' || subdomain === 'app') return null;
    return subdomain;
  }

  // Dev fallback: http://localhost:5173?partner=synergy
  if (import.meta.env.DEV) {
    return new URLSearchParams(window.location.search).get('partner');
  }

  return null;
}
