import { describe, expect, it } from 'vitest';
import type { PartnerVisualIdentityResource, UserResource } from '../types/api';
import { partnerBrandColors, partnerColorOverrides, resolvePartnerIdentity, withAlpha } from './visualIdentity';

const identity = (over: Partial<PartnerVisualIdentityResource> = {}): PartnerVisualIdentityResource =>
  ({ primary_color: '#111111', secondary_color: '#222222', logo: 'logo.png', primary_color_dark: null, secondary_color_dark: null, ...over }) as PartnerVisualIdentityResource;
const user = (partner: unknown): UserResource => ({ id: 1, partner }) as unknown as UserResource;
const partnerA = user({ name: 'A', slug: 'a', visual_identity: identity() });
const partnerB = user({ name: 'B', slug: 'b', visual_identity: identity({ primary_color: '#333333', secondary_color: null }) });
const plain = user(null);

describe('partnerBrandColors', () => {
  it('takes primary and secondary from the identity', () => {
    expect(partnerBrandColors(identity())).toEqual({ primary: '#111111', secondary: '#222222' });
  });

  it('omits a colour the Partner leaves unset rather than writing null', () => {
    expect(partnerBrandColors(identity({ secondary_color: null }))).toEqual({ primary: '#111111' });
  });

  it('prefers the dark variants in the dark scheme and falls back when they are absent', () => {
    const id = identity({ primary_color_dark: '#AAAAAA' });
    expect(partnerBrandColors(id, 'dark')).toEqual({ primary: '#AAAAAA', secondary: '#222222' });
    expect(partnerBrandColors(id, 'light')).toEqual({ primary: '#111111', secondary: '#222222' });
  });

  it('is empty without an identity', () => {
    expect(partnerBrandColors(null)).toEqual({});
    expect(partnerBrandColors(undefined)).toEqual({});
  });
});

describe('partnerColorOverrides (0017)', () => {
  it('is empty for a plain account and for no account', () => {
    expect(partnerColorOverrides(plain)).toEqual({});
    expect(partnerColorOverrides(null)).toEqual({});
  });

  it('resolves Partner A → plain account to the default palette, and A → B to B alone', () => {
    expect(partnerColorOverrides(partnerA)).toEqual({ primary: '#111111', secondary: '#222222' });
    expect(partnerColorOverrides(plain)).toEqual({});
    expect(partnerColorOverrides(partnerB)).toEqual({ primary: '#333333' });
  });
});

describe('resolvePartnerIdentity', () => {
  const subdomain = { name: 'Synergy', slug: 'synergy', visual_identity: identity({ logo: 'synergy.png' }) };

  it("prefers the signed-in user's Partner over the host's", () => {
    expect(resolvePartnerIdentity(partnerA, subdomain)).toEqual({ slug: 'a', name: 'A', logo: 'logo.png', visualIdentity: identity() });
  });

  it('falls back to the host Partner when signed out, and to its slug alone while it loads', () => {
    expect(resolvePartnerIdentity(null, subdomain)).toMatchObject({ slug: 'synergy', name: 'Synergy', logo: 'synergy.png' });
    expect(resolvePartnerIdentity(null, null, 'synergy')).toEqual({ slug: 'synergy', name: null, logo: null, visualIdentity: null });
  });

  it('is empty for a plain user on the main domain', () => {
    expect(resolvePartnerIdentity(plain, null)).toEqual({ slug: null, name: null, logo: null, visualIdentity: null });
  });
});

describe('withAlpha', () => {
  it('appends the alpha pair to a hex colour, exactly as the old convention did', () => {
    expect(withAlpha('#00B4C5', 0.125)).toBe('#00B4C520');
    expect(withAlpha('#00B4C5', 0.25)).toBe('#00B4C540');
    expect(withAlpha('#00B4C5', 1)).toBe('#00B4C5FF');
    expect(withAlpha('#00B4C5', 0)).toBe('#00B4C500');
  });

  it('expands short hex and replaces an existing alpha', () => {
    expect(withAlpha('#fff', 0.5)).toBe('#ffffff80');
    expect(withAlpha('#00B4C5FF', 0.5)).toBe('#00B4C580');
  });

  it('rewrites the alpha of an rgb/rgba colour and leaves anything else alone', () => {
    expect(withAlpha('rgba(0, 0, 0, 0.1)', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    expect(withAlpha('rgb(17, 24, 39)', 0.2)).toBe('rgba(17, 24, 39, 0.2)');
    expect(withAlpha('transparent', 0.5)).toBe('transparent');
  });

  it('clamps the alpha', () => {
    expect(withAlpha('#000000', 2)).toBe('#000000FF');
    expect(withAlpha('#000000', -1)).toBe('#00000000');
  });
});
