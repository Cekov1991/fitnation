import { getConfig } from '@fit-nation/shared';
import { appGetUrl } from '../../utils/station';

/**
 * The quiet sticky download CTA of the winning prototype (variant A,
 * "video-first"): a low bar above the bottom edge, one line of benefit copy
 * and a small gradient button — never a takeover.
 */
export function StationCta({ title }: { title: string }) {
  // The backend's device-aware store redirect (routes/web.php `app.get`): a QR
  // visit always comes from a real phone UA, so the server-side sniff is safe —
  // same reasoning as AppDownloadPage's QR code. The base is what index.tsx
  // gave initApi (VITE_API_URL), read here so no second env lookup exists.
  // Ticket 04 adds the funnel parameters (funnel=qr, station, exercise,
  // benefit key) and the rotating benefit copy here; until then this is a
  // plain link with fixed copy.
  const getAppUrl = appGetUrl(getConfig().baseUrl);
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 px-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      <a
        href={getAppUrl}
        className="max-w-md mx-auto flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 shadow-2xl border"
        style={{ backgroundColor: 'var(--color-bg-modal)', borderColor: 'var(--color-border)' }}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Free in the Fit Nation app
          </p>
        </div>
        <span
          className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
        >
          Get app
        </span>
      </a>
    </div>
  );
}
