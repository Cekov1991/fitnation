import QRCode from 'react-qr-code';
import { LogOut, Smartphone } from 'lucide-react';
import { getConfig } from '@fit-nation/shared';
import { useAuth } from '../hooks/useAuth';
import { useBranding } from '../hooks/useBranding';
import { appGetUrl } from '../utils/station';
import { pickStoreUrl, APP_STORE_URL, PLAY_STORE_URL } from '../utils/storeUrl';

// The backend's device-aware store redirect (routes/web.php `app.get`): a QR
// scan always comes from a real phone UA, so the server-side sniff is safe
// there. The on-page CTA picks the store client-side instead (storeUrl.ts).
// Derived from the API base via the shared helper so this page and the QR
// station CTA can never drift apart.

/**
 * The App Download Screen (ADR-0003): where a registered, not-yet-onboarded
 * user lands. Onboarding and program generation live in the mobile app, so
 * the web's job ends here — badges, a QR for desktop, and a sign-out.
 */
export function AppDownloadPage() {
  const { logout } = useAuth();
  const getAppUrl = appGetUrl(getConfig().baseUrl);
  const { logo, partnerName, hasBranding } = useBranding();

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
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={hasBranding && logo ? logo : '/logo.png'}
            alt={partnerName || 'Fit Nation'}
            className="w-20 h-20 object-contain mb-6 rounded-2xl"
          />
          <h1
            className="text-3xl font-bold mb-2 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            You&apos;re In!
          </h1>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Download the Fit Nation app to finish setting up your profile and get your training program.
          </p>
        </div>

        <div
          className="border rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6"
          style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
        >
          {/* Store badges */}
          <div className="flex flex-col items-center gap-3">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download Fit Nation on the App Store"
              className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <img src="/app-store-badge-420.webp" alt="Download on the App Store" className="h-[52px] w-auto" />
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get Fit Nation on Google Play"
              className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <img src="/google-play-badge-420.webp" alt="Get it on Google Play" className="h-[52px] w-auto" />
            </a>
          </div>

          {/* QR for desktop visitors */}
          <div className="hidden sm:flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-white">
              <QRCode value={getAppUrl} size={132} aria-label="QR code linking to the app download" />
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              Scan with your phone to download
            </p>
          </div>

          {/* Direct link for phones — store chosen client-side (storeUrl.ts) */}
          <a
            href={pickStoreUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden w-full py-4 rounded-xl font-bold text-lg text-center text-white shadow-lg"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            <Smartphone className="inline w-5 h-5 mr-2 -mt-0.5" />
            Download the App
          </a>

          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Sign in to the app with the email and password you just created.
          </p>
        </div>

        {/* Sign out */}
        <div className="mt-8 text-center">
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
