import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { authApi } from '@fit-nation/shared';
import { useAuth } from '../hooks/useAuth';

type Status = 'verifying' | 'success' | 'error';

/**
 * Landing page for the verification link in the email
 * (/verify-email/{id}/{hash}?expires&signature).
 *
 * On phones with the app installed the same URL is caught by the app as a
 * universal/app link and never reaches this page; here we handle desktop
 * browsers and phones without the app by calling the signed API endpoint
 * with the query string forwarded untouched.
 */
export function VerifyEmailLinkPage() {
  const { id, hash } = useParams<{ id: string; hash: string }>();
  const location = useLocation();
  const { user, refetchUser } = useAuth();

  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const params = new URLSearchParams(location.search);
      const expires = params.get('expires');
      const signature = params.get('signature');
      try {
        if (!expires || !signature) {
          throw new Error('This verification link is incomplete. Please open it from the email again.');
        }
        await authApi.verifyEmailLink({ id, hash, expires, signature });
        try {
          await refetchUser();
        } catch {
          // Not logged in on this device — verification still succeeded.
        }
        if (!cancelled) setStatus('success');
      } catch (e: any) {
        if (!cancelled) {
          setStatus('error');
          setMessage(e?.message || 'Verification failed. The link may have expired.');
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div
          className="border rounded-3xl p-8 shadow-2xl text-center"
          style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
        >
          {status === 'verifying' && (
            <>
              <Loader2
                className="w-10 h-10 mx-auto mb-4 animate-spin"
                style={{ color: 'var(--color-primary)' }}
              />
              <h1 className="text-2xl font-bold mb-2">Verifying your email…</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                One moment.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2
                className="w-10 h-10 mx-auto mb-4"
                style={{ color: 'var(--color-primary)' }}
              />
              <h1 className="text-2xl font-bold mb-2">Email verified</h1>
              <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
                {user
                  ? 'You are all set.'
                  : 'You can return to the app on your phone, or log in here.'}
              </p>
              <Link
                to={user ? '/' : '/login'}
                className="inline-block w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-shadow text-white"
                style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
              >
                {user ? 'Continue' : 'Log in'}
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle
                className="w-10 h-10 mx-auto mb-4"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <h1 className="text-2xl font-bold mb-2">We couldn't verify your email</h1>
              <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-3 rounded-xl font-semibold text-sm transition-all border"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Log in to request a new link
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
