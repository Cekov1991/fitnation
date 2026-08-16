import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Loader2, Smartphone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const APP_STORE_URL = 'https://apps.apple.com/app/fit-nation-the-movement/id6766201705';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.fitnation.app&hl=en';

export function SubscribePage() {
  const { user, refetchUser, logout } = useAuth();
  const history = useHistory();
  const [checking, setChecking] = useState(false);

  const logoUrl = user?.partner?.visual_identity?.logo ?? null;

  async function handleCheck() {
    setChecking(true);
    try {
      await refetchUser();
      // AuthGuard will redirect away if entitlements now include app_access
    } catch {
      // silent
    } finally {
      setChecking(false);
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
      {/* Background gradients */}
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
          <img
            src={logoUrl || '/logo.png'}
            alt={user?.partner?.name || 'Fit Nation'}
            className="w-20 h-20 object-contain mb-6 rounded-2xl"
          />
          <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: 'var(--color-text-primary)' }}>
            Subscription required
          </h1>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Get full access to {user?.partner?.name || 'Fit Nation'} by subscribing through the mobile app.
          </p>
        </div>

        {/* Card */}
        <div
          className="border rounded-3xl p-8 shadow-2xl"
          style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-6"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}
          >
            <Smartphone className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
          </div>

          <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Download the Fit Nation app, sign in with this account, and subscribe to unlock workouts,
            progress tracking, and AI-powered plans — then come back here for full web access.
          </p>

          <div className="space-y-3">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-4 rounded-xl font-bold text-lg shadow-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
            >
              Download on the App Store
            </a>

            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm border transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
              }}
            >
              Get it on Google Play
            </a>

            <button
              type="button"
              onClick={handleCheck}
              disabled={checking}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all border disabled:opacity-50"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
              }}
            >
              {checking
                ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking...</span>
                : 'I\'ve already subscribed'}
            </button>

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
