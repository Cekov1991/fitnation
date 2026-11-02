import { publicStationsApi } from '@fit-nation/shared';
import type { Benefit } from '../../utils/station';
import { partnerRegisterUrl } from '../../utils/station';

/**
 * The quiet sticky CTA of the winning prototype (variant A, "video-first"):
 * a low bar above the bottom edge, one line of benefit copy and a small
 * gradient button — never a takeover.
 *
 * Stations are B2B, so the tap goes to the Partner's own register page
 * (`partnerRegisterUrl`), never a bare store download.
 */
export function StationCta({
  code,
  partnerSlug,
  exerciseId,
  benefit,
}: {
  /** The Station's Short code — funnel attribution and the click event. */
  code: string;
  /** The Partner whose register page the CTA opens. */
  partnerSlug: string;
  /** Set on the exercise detail page only. */
  exerciseId?: number;
  /** The benefit this Scan shows (one per Scan, `benefitForScan`). */
  benefit: Benefit;
}) {
  const registerUrl = partnerRegisterUrl(window.location, partnerSlug, {
    station: code,
    exercise: exerciseId,
    benefit: benefit.key,
  });

  // Fire-and-forget (recordEvent never throws); the navigation is a plain
  // href, so a lost event can never hold up the redirect.
  const recordClick = () => {
    void publicStationsApi.recordEvent(code, { type: 'cta_click', exercise_id: exerciseId, benefit: benefit.key });
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 px-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      <a
        href={registerUrl}
        onClick={recordClick}
        className="max-w-md mx-auto flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 shadow-2xl border"
        style={{ backgroundColor: 'var(--color-bg-modal)', borderColor: 'var(--color-border)' }}
      >
        <div className="min-w-0">
          {/* Title and body come from the same benefit, so the copy shown and
              the benefit key recorded on events always tell one story. */}
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {benefit.title}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {benefit.body}
          </p>
        </div>
        <span
          className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
        >
          Sign up
        </span>
      </a>
    </div>
  );
}
