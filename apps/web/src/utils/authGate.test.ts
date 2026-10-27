import { describe, expect, it } from 'vitest';
import { gateRedirect, type GateUser } from './authGate';

/**
 * ADR-0003: web onboarding moved to the app. A signed-in user who has not
 * onboarded is sent to the App Download Screen (/get-the-app), never to a
 * web onboarding flow. Everything else keeps the old AuthGuard order:
 * verify-email first, then the download gate, then the subscription gate.
 */

const user = (overrides: Partial<NonNullable<GateUser>> = {}): GateUser => ({
  email_verified_at: '2026-01-01T00:00:00Z',
  onboarding_completed_at: '2026-01-02T00:00:00Z',
  entitlements: ['app_access'],
  ...overrides,
});

describe('gateRedirect', () => {
  it('sends a signed-out visitor to login', () => {
    expect(gateRedirect(null, '/dashboard')).toBe('/login');
  });

  it('sends an unverified user to verify-email, and renders it once there', () => {
    expect(gateRedirect(user({ email_verified_at: null }), '/')).toBe('/verify-email');
    expect(gateRedirect(user({ email_verified_at: null }), '/verify-email')).toBeNull();
  });

  it('sends a verified, not-onboarded user to the app download screen', () => {
    expect(gateRedirect(user({ onboarding_completed_at: null }), '/')).toBe('/get-the-app');
    expect(gateRedirect(user({ onboarding_completed_at: null }), '/onboarding')).toBe('/get-the-app');
    expect(gateRedirect(user({ onboarding_completed_at: null }), '/get-the-app')).toBeNull();
  });

  it('the download screen comes before the subscription gate', () => {
    expect(gateRedirect(user({ onboarding_completed_at: null, entitlements: [] }), '/')).toBe('/get-the-app');
  });

  it('bounces an onboarded user off the download and verify screens', () => {
    expect(gateRedirect(user(), '/get-the-app')).toBe('/');
    expect(gateRedirect(user(), '/verify-email')).toBe('/');
  });

  it('a verified, not-onboarded user leaving verify-email goes to the download screen', () => {
    expect(gateRedirect(user({ onboarding_completed_at: null }), '/verify-email')).toBe('/get-the-app');
  });

  it('keeps the subscription gate for onboarded users', () => {
    expect(gateRedirect(user({ entitlements: [] }), '/')).toBe('/subscribe');
    expect(gateRedirect(user({ entitlements: [] }), '/subscribe')).toBeNull();
    expect(gateRedirect(user(), '/subscribe')).toBe('/');
  });

  it('lets a fully-gated user through', () => {
    expect(gateRedirect(user(), '/')).toBeNull();
    expect(gateRedirect(user(), '/plans')).toBeNull();
  });
});
