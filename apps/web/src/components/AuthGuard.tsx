import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTodayWorkout } from '@fit-nation/shared';
import { gateRedirect } from '../utils/authGate';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { data: todayWorkout } = useTodayWorkout();

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-base)' }}
      >
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Redirect to={{ pathname: '/login', state: { from: location } }} />;
  }

  // Verify-email → App Download Screen → subscription, decided in authGate.ts
  const redirect = gateRedirect(user, location.pathname);
  if (redirect) {
    return <Redirect to={redirect} />;
  }
  // On a prerequisite screen the gate let through — render it, skip the
  // active-session redirect below
  if (
    user.email_verified_at === null ||
    user.onboarding_completed_at === null ||
    !user.entitlements.includes('app_access')
  ) {
    return <>{children}</>;
  }

  // If there is an active (confirmed, not yet completed) session and the user is not
  // already viewing that session, redirect them to it.
  const activeSession = todayWorkout?.session;
  const isActiveSession =
    activeSession?.id != null &&
    activeSession.performed_at != null &&
    activeSession.completed_at == null;
  const isOnSessionRoute = location.pathname.startsWith('/session/');

  if (isActiveSession && !isOnSessionRoute) {
    return <Redirect to={`/session/${activeSession!.id}`} />;
  }

  return <>{children}</>;
}
