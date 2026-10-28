import { useEffect } from 'react';
import { ChevronLeft, Dumbbell } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { publicStationsApi, usePublicStationExercise } from '@fit-nation/shared';
import type { PublicStationExerciseResource } from '@fit-nation/shared';
import { ExerciseImage } from '../ExerciseImage';
import { useNoIndex } from '../../hooks/useNoIndex';
import { benefitForScan, guidanceOf, mistakesOf, parseExerciseId, stationProblemOf } from '../../utils/station';
import { StationCta } from './StationCta';
import { StationFallback } from './StationFallback';

/**
 * The public exercise detail (`/s/{code}/e/{id}`, ADR-0005), in the winning
 * prototype's "video-first" design (variant A): full-bleed media hero with the
 * name, partner and muscle chips overlaid on a bottom gradient, numbered steps
 * below — description paragraphs until the backfill has run — and the quiet
 * sticky download CTA.
 */
export function StationExercisePage() {
  const { code, exerciseId: rawExerciseId } = useParams<{ code: string; exerciseId: string }>();
  useNoIndex();
  const exerciseId = parseExerciseId(rawExerciseId);
  const { data, isPending, error, refetch } = usePublicStationExercise(code, exerciseId ?? 0);

  // One `exercise_open` per detail load, once the fetch confirms the exercise
  // is really on this Station. Fire-and-forget: `recordEvent` never throws.
  const loaded = !!data;
  useEffect(() => {
    if (!loaded || exerciseId === null) return;
    void publicStationsApi.recordEvent(code, {
      type: 'exercise_open',
      exercise_id: exerciseId,
      benefit: benefitForScan(code).key,
    });
  }, [loaded, code, exerciseId]);

  // A hand-mangled URL is the same dead end as an exercise that left the Station.
  if (exerciseId === null) return <StationFallback problem="not_found" />;
  if (error) return <StationFallback problem={stationProblemOf(error)} onRetry={() => refetch()} />;
  if (isPending || !data) return <ExerciseSkeleton />;

  const exercise = data.data;
  const { partner } = data.station;

  return (
    <div
      className="min-h-screen w-full pb-36"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <main className="max-w-md mx-auto">
        <div className="relative">
          <MediaHero exercise={exercise} />

          <BackToStation code={code} />

          {/* Identity overlaid on a bottom gradient — fixed whites: the gradient is black in both themes. */}
          <div className="absolute inset-x-0 bottom-0 p-6 pt-20 bg-gradient-to-t from-black via-black/60 to-transparent">
            <div className="flex items-center gap-2 mb-2 text-xs text-white/70">
              <span>{partner.name}</span>
              {exercise.difficulty && (
                <>
                  <span>·</span>
                  <span>{exercise.difficulty}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">{exercise.name}</h1>
            <MuscleChips primary={exercise.primary_muscles} secondary={exercise.secondary_muscles} />
          </div>
        </div>

        <GuidanceSection exercise={exercise} />
        <MistakesSection exercise={exercise} />

        {exercise.equipment && (
          <div className="px-6 pb-6 text-xs flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Dumbbell className="w-4 h-4" />
            {exercise.equipment}
          </div>
        )}
      </main>

      <StationCta
        title="Track your sets on this exercise"
        code={code}
        exerciseId={exercise.id}
        benefit={benefitForScan(code)}
      />
    </div>
  );
}

/** Full-bleed hero: demo video (image as poster) when there is one, else the image, else the house placeholder. */
function MediaHero({ exercise }: { exercise: PublicStationExerciseResource }) {
  if (exercise.video) {
    return (
      <video
        className="w-full aspect-[4/5] object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={exercise.image || undefined}
      >
        <source src={exercise.video} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }
  // ExerciseImage renders the graceful gradient placeholder when there is no image either.
  return <ExerciseImage src={exercise.image} alt={exercise.name} className="w-full aspect-[4/5]" />;
}

/** Back to the chooser — only when the visitor came from it, so a single-exercise scan stays an ordinary page. */
function BackToStation({ code }: { code: string }) {
  const location = useLocation<{ fromStation?: boolean } | undefined>();
  if (!location.state?.fromStation) return null;
  return (
    <Link
      to={`/s/${encodeURIComponent(code)}`}
      aria-label="Back to station"
      className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur border border-white/20"
    >
      <ChevronLeft className="w-5 h-5 text-white" />
    </Link>
  );
}

function MuscleChips({ primary, secondary }: { primary: string[]; secondary: string[] }) {
  if (primary.length === 0 && secondary.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {primary.map(m => (
        <span
          key={m}
          className="px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary-muscle-group)' }}
        >
          {m}
        </span>
      ))}
      {secondary.map(m => (
        <span
          key={m}
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-secondary-muscle-group) 25%, transparent)',
            color: 'var(--color-secondary-muscle-group)',
          }}
        >
          {m}
        </span>
      ))}
    </div>
  );
}

/** Numbered steps when the backfill has run; plain description paragraphs until then. */
function GuidanceSection({ exercise }: { exercise: PublicStationExerciseResource }) {
  const guidance = guidanceOf(exercise);
  if (guidance.kind === 'none') return null;

  return (
    <section className="px-6 py-6">
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-4"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {guidance.kind === 'steps' ? 'How to perform' : 'About this exercise'}
      </h2>
      {guidance.kind === 'steps' ? (
        <ol className="space-y-4">
          {guidance.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed pt-1" style={{ color: 'var(--color-text-primary)' }}>
                {step}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="space-y-3">
          {guidance.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

function MistakesSection({ exercise }: { exercise: PublicStationExerciseResource }) {
  const mistakes = mistakesOf(exercise);
  if (mistakes.length === 0) return null;

  return (
    <section className="px-6 pb-6">
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-4"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Common mistakes
      </h2>
      <ul className="space-y-2">
        {mistakes.map((mistake, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="flex-shrink-0 font-bold" style={{ color: 'var(--color-secondary)' }}>
              •
            </span>
            {mistake}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExerciseSkeleton() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <main className="max-w-md mx-auto animate-pulse">
        <div className="w-full aspect-[4/5]" style={{ backgroundColor: 'var(--color-bg-elevated)' }} />
        <div className="px-6 py-6 space-y-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-4 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          ))}
        </div>
      </main>
    </div>
  );
}
