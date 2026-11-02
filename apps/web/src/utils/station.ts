import { failureOf } from '@fit-nation/shared';

/**
 * Pure logic behind the public QR Station pages (ADR-0005), kept out of the
 * components so it can be tested without a DOM.
 */

/** What a failed Station fetch means for the visitor. */
export type StationProblem =
  /** Unknown Short code, or the exercise is archived / not on the Station (404). */
  | 'not_found'
  /** The Station was deleted; its printed sticker outlived it (410). */
  | 'gone'
  /** Gym wifi, server trouble — nothing definitive; worth a retry. */
  | 'error';

export function stationProblemOf(error: unknown): StationProblem {
  const status = failureOf(error).status;
  if (status === 404) return 'not_found';
  if (status === 410) return 'gone';
  return 'error';
}

/** What the guidance section renders, resolved from the backfill state. */
export type Guidance =
  | { kind: 'steps'; steps: string[] }
  | { kind: 'paragraphs'; paragraphs: string[] }
  | { kind: 'none' };

/**
 * Structured `instructions` win; until the backfill has filled them the plain
 * `description` renders as paragraphs (split on blank or single line breaks),
 * so a page is never empty while backfill is in progress.
 */
export function guidanceOf(exercise: { instructions: string[] | null; description: string | null }): Guidance {
  const steps = (exercise.instructions ?? []).map(s => s.trim()).filter(Boolean);
  if (steps.length > 0) return { kind: 'steps', steps };

  const paragraphs = (exercise.description ?? '')
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean);
  if (paragraphs.length > 0) return { kind: 'paragraphs', paragraphs };

  return { kind: 'none' };
}

/** Common mistakes worth a section — trimmed, empties dropped. */
export function mistakesOf(exercise: { common_mistakes: string[] | null }): string[] {
  return (exercise.common_mistakes ?? []).map(m => m.trim()).filter(Boolean);
}

/**
 * One app benefit the CTA nudges with. The `key` is the stable identifier
 * that travels on the funnel URL and in the events — copy may be reworded,
 * keys never change, or the conversion data stops lining up.
 */
export interface Benefit {
  key: string;
  title: string;
  body: string;
}

/** Hardcoded by design (v1): no backend-served or A/B-managed copy yet. */
export const BENEFITS: readonly Benefit[] = [
  { key: 'track_sets', title: 'Track every set', body: 'Log reps and weight in seconds — right from this exercise.' },
  { key: 'see_progress', title: 'See your progress', body: 'Charts of your strength on this exact machine, week over week.' },
  { key: 'personal_plan', title: 'A plan built for you', body: 'Get a full training program generated around your goals.' },
  { key: 'last_weight', title: 'Never guess again', body: 'Know exactly what weight you lifted here last time.' },
];

/** One benefit, uniformly at random; `random` is injectable for tests. */
export function pickBenefit(random: () => number = Math.random): Benefit {
  return BENEFITS[Math.min(Math.floor(random() * BENEFITS.length), BENEFITS.length - 1)];
}

/**
 * Per-Scan state, keyed by Short code and scoped to the page's lifetime: a
 * module-level map survives chooser → detail navigation (and React remounts)
 * but resets on a fresh page load — which is exactly what "per Scan" means.
 */
const benefitByCode = new Map<string, Benefit>();
const scannedCodes = new Set<string>();
const openedExercises = new Set<string>();

/**
 * The benefit this Scan shows — chosen once per Short code per page load, so
 * the chooser CTA, the detail CTA, the funnel URL and every event all tell
 * the same story.
 */
export function benefitForScan(code: string): Benefit {
  let benefit = benefitByCode.get(code);
  if (!benefit) {
    benefit = pickBenefit();
    benefitByCode.set(code, benefit);
  }
  return benefit;
}

/**
 * True exactly once per Short code per page load: the caller that gets
 * `true` records the `scan` event. Guards against StrictMode double
 * effects, query refetches, remounts, and the single-exercise redirect.
 */
export function claimScan(code: string): boolean {
  if (scannedCodes.has(code)) return false;
  scannedCodes.add(code);
  return true;
}

/**
 * True exactly once per (Short code, exercise) per page load: the caller that
 * gets `true` records the `exercise_open` event. Same job as `claimScan` —
 * StrictMode double effects, refetches and remounts all hit this guard.
 */
export function claimExerciseOpen(code: string, exerciseId: number): boolean {
  const key = `${code}#${exerciseId}`;
  if (openedExercises.has(key)) return false;
  openedExercises.add(key);
  return true;
}

/** Test seam: a fresh "page load" for the per-Scan state. */
export function resetScanState(): void {
  benefitByCode.clear();
  scannedCodes.clear();
  openedExercises.clear();
}

/** The funnel parameters a CTA tap carries onto `/get` (ticket 04). */
export interface QrFunnel {
  /** The Station's Short code. */
  station: string;
  /** Set on the exercise detail page only. */
  exercise?: number;
  /** The stable key of the benefit the CTA showed. */
  benefit?: string;
}

/**
 * The backend's device-aware `/get` store redirect, derived from the API base
 * the way AppDownloadPage does: a QR visit always comes from a real phone UA,
 * so the server-side sniff is safe. With a funnel, the QR attribution
 * parameters (`funnel=qr`, station, exercise, benefit key) ride along.
 */
export function appGetUrl(apiBase: string, funnel?: QrFunnel): string {
  const base = apiBase.replace(/\/api\/?$/, '') + '/get';
  if (!funnel) return base;

  const params = new URLSearchParams({ funnel: 'qr', station: funnel.station });
  if (funnel.exercise !== undefined) params.set('exercise', String(funnel.exercise));
  if (funnel.benefit !== undefined) params.set('benefit', funnel.benefit);
  return `${base}?${params.toString()}`;
}

/** The exercise id as the route carries it — a positive integer or nothing. */
export function parseExerciseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
