import type { PartnerVisualIdentityResource, UserResource } from '../types/api';

/**
 * The Partner visual identity seam (spec 0029).
 *
 * White-label branding is the product's multi-tenant premise, and it used to
 * reach components through channels with no compile-time link: on mobile,
 * AuthContext pushed colours into ThemeContext (so auth depended on theming and
 * the provider order was load-bearing); on web, five ternaries merged two
 * tenant resolvers and wrote CSS variables from an effect. This module owns the
 * resolution — which Partner, which colours for the active scheme — and the
 * derivations that follow. Each platform keeps its own rendering mechanism
 * (AppColors on mobile, CSS variables on web); what matters is one owner.
 *
 * A Partner may override `primary` and `secondary` only, deliberately. The
 * semantic colours — success, warning, error — are never a Partner's to change:
 * "this set failed" reads the same under every brand.
 */

export type ColorScheme = 'light' | 'dark';

export interface PartnerBrandColors {
  primary?: string;
  secondary?: string;
}

/**
 * The brand colours a Partner contributes for a scheme — the dark variants
 * when present and the scheme is dark, else the light ones — and nothing for a
 * missing identity. Both platforms merge this over their default palette, so a
 * partnerless session is the default palette by construction.
 */
export function partnerBrandColors(
  identity: PartnerVisualIdentityResource | null | undefined,
  scheme: ColorScheme = 'light'
): PartnerBrandColors {
  if (!identity) return {};
  const primary = (scheme === 'dark' ? identity.primary_color_dark : null) ?? identity.primary_color;
  const secondary = (scheme === 'dark' ? identity.secondary_color_dark : null) ?? identity.secondary_color;
  return {
    ...(primary ? { primary } : {}),
    ...(secondary ? { secondary } : {}),
  };
}

/** `partnerBrandColors` for a signed-in user: their Partner's identity, or none. */
export function partnerColorOverrides(user: UserResource | null | undefined, scheme: ColorScheme = 'light'): PartnerBrandColors {
  return partnerBrandColors(user?.partner?.visual_identity, scheme);
}

export interface PartnerBrandingSource {
  name: string;
  slug: string;
  visual_identity: PartnerVisualIdentityResource | null;
}

export interface ResolvedPartnerIdentity {
  slug: string | null;
  name: string | null;
  logo: string | null;
  visualIdentity: PartnerVisualIdentityResource | null;
}

/**
 * Which Partner this session belongs to: the signed-in user's, else the one
 * the host name (or a dev query string) named, else none. One answer for the
 * logo, the name, the slug and the colours — they cannot disagree.
 */
export function resolvePartnerIdentity(
  user: UserResource | null | undefined,
  fallback: PartnerBrandingSource | null | undefined,
  fallbackSlug: string | null = null
): ResolvedPartnerIdentity {
  if (user) {
    const partner = user.partner;
    return {
      slug: partner?.slug ?? null,
      name: partner?.name ?? null,
      logo: partner?.visual_identity?.logo ?? null,
      visualIdentity: partner?.visual_identity ?? null,
    };
  }
  return {
    slug: fallback?.slug ?? fallbackSlug,
    name: fallback?.name ?? null,
    logo: fallback?.visual_identity?.logo ?? null,
    visualIdentity: fallback?.visual_identity ?? null,
  };
}

/**
 * A colour at an opacity, as one string. Replaces the `${colors.primary}20`
 * convention — a hex alpha pair appended by hand at ~170 sites in a dozen
 * spellings. Hex in, 8-digit hex out (React Native and CSS both read it);
 * `rgb()`/`rgba()` in, `rgba()` out; anything else is returned as-is.
 */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.min(1, Math.max(0, alpha));
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(color.trim());
  if (hex) {
    let rgb = hex[1];
    if (rgb.length === 3) rgb = rgb.split('').map(c => c + c).join('');
    rgb = rgb.slice(0, 6);
    return `#${rgb}${Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase()}`;
  }
  const rgb = /^rgba?\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)(?:,\s*[^)]+)?\)$/i.exec(color.trim());
  if (rgb) return `rgba(${rgb[1].trim()}, ${rgb[2].trim()}, ${rgb[3].trim()}, ${a})`;
  return color;
}
