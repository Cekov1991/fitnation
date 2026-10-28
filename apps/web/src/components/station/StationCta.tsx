import { getConfig, publicStationsApi } from '@fit-nation/shared';
import type { Benefit } from '../../utils/station';
import { appGetUrl } from '../../utils/station';

/**
 * The quiet sticky download CTA of the winning prototype (variant A,
 * "video-first"): a low bar above the bottom edge, one line of benefit copy
 * and a small gradient button — never a takeover.
 */
export function StationCta({
  title,
  code,
  exerciseId,
  benefit,
}: {
  title: string;
  /** The Station's Short code — funnel attribution and the click event. */
  code: string;
  /** Set on the exercise detail page only. */
  exerciseId?: number;
  /** The benefit this Scan shows (one per Scan, `benefitForScan`). */
  benefit: Benefit;
}) {
  // The backend's device-aware store redirect (routes/web.php `app.get`): a QR
  // visit always comes from a real phone UA, so the server-side sniff is safe —
  // same reasoning as AppDownloadPage's QR code. The base is what index.tsx
  // gave initApi (VITE_API_URL), read here so no second env lookup exists.
  const getAppUrl = appGetUrl(getConfig().baseUrl, {
    station: code,
    exercise: exerciseId,
    benefit: benefit.key,
  });

  // Fire-and-forget (recordEvent never throws); the navigation is a plain
  // href, so a lost event can never hold up the store redirect.
  const recordClick = () => {
    void publicStationsApi.recordEvent(code, { type: 'cta_click', exercise_id: exerciseId, benefit: benefit.key });
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 px-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      <a
        href={getAppUrl}
        onClick={recordClick}
        className="max-w-md mx-auto flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 shadow-2xl border"
        style={{ backgroundColor: 'var(--color-bg-modal)', borderColor: 'var(--color-border)' }}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {benefit.body}
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
