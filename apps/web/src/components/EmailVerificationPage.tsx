import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoadingButton } from './ui';

const RESEND_COOLDOWN_S = 60;

export function EmailVerificationPage() {
  const { user, refetchUser, resendVerification, logout } = useAuth();
  const history = useHistory();

  const [refreshing, setRefreshing] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logoUrl = user?.partner?.visual_identity?.logo ?? null;

  // Guard: if already verified (e.g. direct nav), redirect away
  useEffect(() => {
    if (user?.email_verified_at) {
      history.replace(user.onboarding_completed_at ? '/' : '/onboarding');
    }
  }, [user?.email_verified_at]);

  // Cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown > 0]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refetchUser();
      if (!user?.email_verified_at) {
        // Not yet verified — visibilitychange listener or manual button will advance them
      }
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResending(true);
    try {
      await resendVerification();
      setResendCooldown(RESEND_COOLDOWN_S);
    } catch (e: any) {
      if (e?.status === 422) {
        // Already verified — refresh and let the useEffect redirect
        try { await refetchUser(); } catch { /* ignore */ }
      }
      // Other errors surface via global mutation cache toast
    } finally {
      setResending(false);
    }
  }

  async function handleSignOut() {
    await logout();
    history.replace('/login');
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Icon */}
        <div className="flex flex-col items-center mb-8">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={user?.partner?.name}
              className="w-20 h-20 object-contain mb-6 rounded-2xl"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}
            >
              <Mail className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
            </div>
          )}

          <h1
            className="text-3xl font-bold mb-2 text-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Check your email
          </h1>
          <p className="text-sm text-center mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            We sent a verification link to
          </p>
          <p className="text-base font-semibold text-center" style={{ color: 'var(--color-primary)' }}>
            {user?.email}
          </p>
        </div>

        {/* Card */}
        <div
          className="border rounded-3xl p-8 shadow-2xl"
          style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-sm text-center mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Click the link in the email to verify your account and get started.
            You can return to this tab once you've verified.
          </p>

          <div className="space-y-3">
            {/* I have verified */}
            <LoadingButton
              type="button"
              isLoading={refreshing}
              loadingText="Checking..."
              onClick={handleRefresh}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-shadow text-white"
              style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
            >
              I have verified my email
            </LoadingButton>

            {/* Resend */}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all border disabled:opacity-50"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
              }}
            >
              {resending
                ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span>
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend verification email'}
            </button>

            {/* Sign out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
