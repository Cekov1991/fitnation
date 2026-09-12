import type { SessionExerciseDetail, SetLogResource } from '../types/api';
import { formatVolumeFull, formatWeight } from '../units/format';
import { sessionTotals } from './readModel';

/**
 * How a finished session reads on the Session Details screen: one line per
 * exercise, a comparison with last time, and the text a share sheet gets.
 * Pure over the session detail response; the screens only lay it out.
 */

export interface SetSummaryOptions {
  /** Double-progression exercises carry a weight; total-reps ones do not. */
  weighted: boolean;
  unit: string;
}

function range(values: number[], format: (n: number) => string): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? format(min) : `${format(min)}–${format(max)}`;
}

/**
 * The sets of one exercise on one line. Identical sets are stated once —
 * `4 × 8 @ 107.5 kg` — and sets that vary collapse to ranges:
 * `4 × 8–10 @ 60–80 kg`. Bodyweight reads `3 × 12 reps`.
 */
export function summarizeSets(sets: readonly SetLogResource[], { weighted, unit }: SetSummaryOptions): string {
  if (sets.length === 0) return 'No sets logged';
  const reps = range(sets.map((s) => s.reps), String);
  if (!weighted) return `${sets.length} × ${reps} reps`;
  const weight = range(sets.map((s) => s.weight), formatWeight);
  return `${sets.length} × ${reps} @ ${weight} ${unit}`;
}

export interface VolumeComparison {
  /** Σ weight × reps this session, over the exercises that have a comparable previous performance. */
  current: number;
  /** The same exercises the last time they were done. */
  previous: number;
  /** Rounded percentage change; positive is more volume. */
  percent: number;
  /** How many exercises the comparison covers. */
  exercises: number;
}

function volumeOf(sets: readonly SetLogResource[]): number {
  return sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
}

/**
 * This session's weighted volume against the last time the same exercises
 * were done. The server hands each exercise the sets from its most recent
 * *other* completed session — for a session opened from history that can be
 * a later one — so a previous set only counts when it was logged before this
 * session started. Exercises without a usable previous performance are left
 * out on both sides, so a newly added exercise cannot inflate the change.
 * Null when nothing is comparable or the previous volume is zero.
 */
export function volumeComparison(
  exercises: readonly SessionExerciseDetail[],
  performedAt: string | null | undefined
): VolumeComparison | null {
  if (!performedAt) return null;
  const startedAt = new Date(performedAt).getTime();
  let current = 0;
  let previous = 0;
  let count = 0;
  for (const detail of exercises) {
    if (detail.session_exercise.progression_mode !== 'double_progression') continue;
    const logged = detail.logged_sets ?? [];
    const prior = (detail.previous_sets ?? []).filter((set) => new Date(set.created_at).getTime() < startedAt);
    if (logged.length === 0 || prior.length === 0) continue;
    current += volumeOf(logged);
    previous += volumeOf(prior);
    count++;
  }
  if (count === 0 || previous <= 0) return null;
  return { current, previous, percent: Math.round(((current - previous) / previous) * 100), exercises: count };
}

export interface VolumeComparisonParts {
  direction: 'up' | 'down' | 'flat';
  /** `4%` — empty when flat. */
  percent: string;
  /** `more volume than last time` — the sentence after the figure. */
  text: string;
}

/** The comparison as the screen words it: an arrow, the figure, the sentence. */
export function volumeComparisonParts(comparison: VolumeComparison): VolumeComparisonParts {
  if (comparison.percent > 0) {
    return { direction: 'up', percent: `${comparison.percent}%`, text: 'more volume than last time' };
  }
  if (comparison.percent < 0) {
    return { direction: 'down', percent: `${Math.abs(comparison.percent)}%`, text: 'less volume than last time' };
  }
  return { direction: 'flat', percent: '', text: 'Same volume as last time' };
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export interface SessionShareInput {
  /** The workout's name, or a stand-in like "Workout session". */
  name: string;
  /** `Thursday, Sep 12 · 18:40` */
  dateLine: string;
  unit: string;
  exercises: readonly SessionExerciseDetail[];
}

/** Plain text for the share sheet: a headline, the totals, then one line per exercise. */
export function sessionShareText({ name, dateLine, unit, exercises }: SessionShareInput): string {
  const totals = sessionTotals({ exercises: [...exercises] });
  const figures = totals.hasWeighted
    ? `${formatVolumeFull(totals.weightedVolume)} ${unit} total volume`
    : `${plural(totals.bodyweightReps, 'rep')} in total`;
  const headline = `${figures} · ${plural(totals.exercisesCount, 'exercise')} · ${plural(totals.totalSets, 'set')}`;
  const lines = exercises.map((detail) => {
    const weighted = detail.session_exercise.progression_mode === 'double_progression';
    const label = detail.session_exercise.exercise?.name ?? 'Exercise';
    return `• ${label} — ${summarizeSets(detail.logged_sets ?? [], { weighted, unit })}`;
  });
  return [`${name} · ${dateLine}`, headline, '', ...lines].join('\n');
}
