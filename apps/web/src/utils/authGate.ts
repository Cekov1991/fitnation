import type { UserResource } from '@fit-nation/shared';

export type GateUser =
  | Pick<UserResource, 'email_verified_at' | 'onboarding_completed_at' | 'entitlements'>
  | null
  | undefined;

/**
 * Where a signed-in person goes, decided in one place (the web twin of
 * mobile's gate.ts). Prerequisites first — verify the email, then the App
 * Download Screen for anyone not yet onboarded (onboarding lives only in
 * the app, ADR-0003) — then the subscription gate. Returns the path to
 * redirect to, or null to render the requested page.
 */
export function gateRedirect(user: GateUser, pathname: string): string | null {
  if (!user) return '/login';

  // Email verification comes first (House Partner signups only, ADR-0004)
  if (user.email_verified_at === null) {
    return pathname === '/verify-email' ? null : '/verify-email';
  }
  if (pathname === '/verify-email') {
    return user.onboarding_completed_at === null ? '/get-the-app' : '/';
  }

  // Not onboarded → the App Download Screen; onboarding happens in the app
  if (user.onboarding_completed_at === null) {
    return pathname === '/get-the-app' ? null : '/get-the-app';
  }
  if (pathname === '/get-the-app') return '/';

  // Subscription gate
  const hasAppAccess = user.entitlements.includes('app_access');
  if (!hasAppAccess) {
    return pathname === '/subscribe' ? null : '/subscribe';
  }
  if (pathname === '/subscribe') return '/';

  return null;
}
