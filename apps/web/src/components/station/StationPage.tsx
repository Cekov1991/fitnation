import { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, Redirect, useParams } from 'react-router-dom';
import { publicStationsApi, usePublicStation } from '@fit-nation/shared';
import type { PublicStationExerciseSummary } from '@fit-nation/shared';
import { ExerciseImage } from '../ExerciseImage';
import { useNoIndex } from '../../hooks/useNoIndex';
import { benefitForScan, claimScan, stationProblemOf } from '../../utils/station';
import { StationCta } from './StationCta';
import { StationFallback } from './StationFallback';

/**
 * The Station chooser (`/s/{code}`, ADR-0005): what a printed QR sticker
 * opens. Public — no login, no auth redirect. Lists the Station's curated
 * exercises in the winning prototype's visual language; a single-exercise
 * Station skips straight to the detail page.
 */
export function StationPage() {
  const { code: rawCode } = useParams<{ code: string }>();
  // React Router v5 hands params back still URL-encoded; decode once at the
  // page boundary so API calls and funnel params never double-encode.
  const code = decodeURIComponent(rawCode);
  useNoIndex();
  const { data, isPending, error, refetch } = usePublicStation(code);

  // The Scan is recorded when the station fetch succeeds — a mistyped or dead
  // code is not a Scan. `claimScan` makes it exactly one per page load:
  // StrictMode double effects, refetches, and the single-exercise redirect
  // below (whose effect runs before the chooser unmounts) all hit the same
  // guard. Fire-and-forget: `recordEvent` never throws.
  const loaded = !!data;
  useEffect(() => {
    if (!loaded || !claimScan(code)) return;
    void publicStationsApi.recordEvent(code, { type: 'scan', benefit: benefitForScan(code).key });
  }, [loaded, code]);

  if (error) return <StationFallback problem={stationProblemOf(error)} onRetry={() => refetch()} />;
  if (isPending || !data) return <StationSkeleton />;

  const station = data.data;

  // A single-purpose machine (e.g. a leg press) should not force a pointless
  // list — land directly on its exercise. Replace, not push, so Back leaves
  // the scan entirely instead of bouncing between chooser and detail.
  if (station.exercises.length === 1) {
    return <Redirect to={`/s/${encodeURIComponent(code)}/e/${station.exercises[0].id}`} />;
  }

  return (
    <div
      className="min-h-screen w-full pb-32"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <main className="max-w-md mx-auto">
        <header className="px-6 pt-10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary)' }}>
            {station.partner.name}
          </p>
          <h1 className="text-3xl font-bold mb-1">{station.name}</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Pick an exercise to see how it&apos;s done.
          </p>
        </header>

        <ul className="px-4 space-y-3">
          {station.exercises.map(exercise => (
            <li key={exercise.id}>
              <ExerciseRow code={code} exercise={exercise} />
            </li>
          ))}
        </ul>

        {station.exercises.length === 0 && (
          <p className="px-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No exercises are set up at this station yet.
          </p>
        )}
      </main>

      <StationCta code={code} benefit={benefitForScan(code)} />
    </div>
  );
}

function ExerciseRow({ code, exercise }: { code: string; exercise: PublicStationExerciseSummary }) {
  const meta = [exercise.primary_muscles.join(', '), exercise.difficulty].filter(Boolean).join(' · ');

  return (
    <Link
      to={{ pathname: `/s/${encodeURIComponent(code)}/e/${exercise.id}`, state: { fromStation: true } }}
      className="flex items-center gap-4 rounded-2xl border p-3 transition-all hover:opacity-90 active:scale-[0.98]"
      style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        <ExerciseImage src={exercise.image} alt={exercise.name} className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-tight truncate">{exercise.name}</p>
        {meta && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {meta}
          </p>
        )}
      </div>
      <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
    </Link>
  );
}

function StationSkeleton() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <main className="max-w-md mx-auto px-4 pt-10 animate-pulse">
        <div className="px-2 space-y-3 mb-8">
          <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="h-8 w-48 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
        </div>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-[88px] rounded-2xl border mb-3"
            style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)' }}
          />
        ))}
      </main>
    </div>
  );
}
