/**
 * Display formatting for the values a Unit System governs (spec 0027).
 *
 * Before this file, `formatWeight` existed five times, `formatDuration` five
 * times with four signatures, `formatDate` six times with three formats, and
 * the same exercise chart was labelled `08-27` on one mobile screen and
 * `Aug 27` on the other. Where the copies disagreed, the choice made here is
 * written next to the function that makes it.
 *
 * Nothing here converts: these format the number the server already put in the
 * user's unit (back-end/docs/adr/0001). And nothing here belongs on a writable
 * value — `formatWeight(82.55)` is `"82.5"`, so an input must hold
 * `String(weight)`, never the formatted text (see fixed-point.test.ts).
 *
 * Two formatters stay on mobile on purpose: `RestTimer.formatTime` and
 * `SessionClock.formatElapsed` are Reanimated worklets that run on the UI
 * thread and cannot call a JS-thread function. They mirror `formatClock` and
 * `formatRestCountdown`; a change to one is a change to both.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Whole kilos/pounds as `"80"`, anything else to one decimal: `"82.5"`. */
export function formatWeight(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

/** Compact volume for cards and charts: `"12.4k"` at and above 1000, else the number. */
export function formatVolume(volume: number): string {
  return volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(volume);
}

/** The full figure with thousands separators, for where the compact form is expanded. */
export function formatVolumeFull(volume: number): string {
  return volume.toLocaleString();
}

/**
 * Minutes as `"45m"`, `"1h 5m"`, `"2h"`. Unknown or zero is `""` — callers
 * that need a placeholder add it (`formatDuration(x) || 'N/A'`) rather than
 * every list rendering "N/A" where a blank belongs. This replaces one copy
 * that said `N/A`, two that said `""`, and one that said `"45 min"`.
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return '';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Whole minutes between two ISO timestamps, or null when either is missing. */
export function minutesBetween(startIso: string | null | undefined, endIso: string | null | undefined): number | null {
  if (!startIso || !endIso) return null;
  return Math.floor((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

/**
 * Elapsed or remaining seconds as a clock: `"4:05"`, and `"1:04:05"` once an
 * hour is reached. Minutes are not zero-padded — three of the four copies
 * agreed on that, and a session clock reading `5:30` is what a stopwatch shows.
 */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** A rest countdown: `"45s"` under a minute, the clock form from a minute up. */
export function formatRestCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return seconds < 60 ? `${seconds}s` : formatClock(seconds);
}

export type DateStyle = 'short' | 'long' | 'weekday';

/**
 * Parse an ISO string the way the screens mean it. A date-only value like
 * `2026-08-27` is a calendar day, so it is anchored to local noon; parsed
 * as-is, `new Date("2026-08-27")` is UTC midnight, which is the evening of
 * the 26th anywhere west of Greenwich.
 */
function parseDisplayDate(iso: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
}

/**
 * One format per context:
 * - `short`   `Aug 27`        — chart axes, session lists
 * - `long`    `Aug 27, 2026`  — a session's detail header
 * - `weekday` `Monday, Aug 27` — a day heading, in the device locale
 */
export function formatDate(iso: string, style: DateStyle = 'short'): string {
  const date = parseDisplayDate(iso);
  if (style === 'weekday') {
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }
  const monthDay = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return style === 'long' ? `${monthDay}, ${date.getFullYear()}` : monthDay;
}

/** `"+"` for a gain (zero included, so a flat week reads `+0%`), nothing for a loss. */
export function signPrefix(value: number): '+' | '' {
  return value >= 0 ? '+' : '';
}

/** A change as a signed percentage: `"+12%"`, `"-5%"`. */
export function formatSignedPercent(percentage: number, digits = 0): string {
  return `${signPrefix(percentage)}${percentage.toFixed(digits)}%`;
}
