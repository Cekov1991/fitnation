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
 * The backend's device-aware `/get` store redirect, derived from the API base
 * the way AppDownloadPage does: a QR visit always comes from a real phone UA,
 * so the server-side sniff is safe. Ticket 04 appends the funnel parameters
 * (`funnel=qr`, station, exercise, benefit key) here.
 */
export function appGetUrl(apiBase: string): string {
  return apiBase.replace(/\/api\/?$/, '') + '/get';
}

/** The exercise id as the route carries it — a positive integer or nothing. */
export function parseExerciseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
