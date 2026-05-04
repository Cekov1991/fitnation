/**
 * Progress calendar: shared week boundaries, `YYYY-MM-DD` handling, and URL parsing.
 *
 * Why this module exists:
 * - **One source of truth** — `ProgressPage` (query params `week` + `date`) and
 *   `WeeklyCalendar` (grid + API range) must use the *same* Monday-based week and
 *   local-date rules, or you get subtle bugs (selected day “outside” the grid week,
 *   duplicate `getWeekStart` logic drifting apart, DST/timezone edge cases).
 * - **URL normalization** — validating keys, clamping `date` into `week`, and
 *   canonicalizing `week` to the Monday `YYYY-MM-DD` is easier to test and reason
 *   about in one place than inlined in components.
 * - **Week navigation** — shifting by 7 days for prev/next uses the same primitives
 *   as the router `replace`, so browser **back** from session detail restores the
 *   full query string including the visible week.
 */

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` in the user's local timezone */
export function formatCalendarDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday 00:00:00 local time for the ISO-style week containing `date` */
export function getWeekStartMonday(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function isValidCalendarDateKey(key: string): boolean {
  if (!YMD_PATTERN.test(key)) return false;
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function calendarDateKeyToDate(key: string): Date | null {
  if (!isValidCalendarDateKey(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/** Add calendar days in local time; `dateKey` must be valid `YYYY-MM-DD`. */
export function addDaysToCalendarDateKey(dateKey: string, deltaDays: number): string {
  const dt = calendarDateKeyToDate(dateKey);
  if (!dt) return dateKey;
  dt.setDate(dt.getDate() + deltaDays);
  return formatCalendarDateKey(dt);
}

/** Whether `dateKey` falls on any day of the week starting at `weekStart` (Mon, 7 days). */
export function isDateKeyInWeek(dateKey: string, weekStart: Date): boolean {
  if (!isValidCalendarDateKey(dateKey)) return false;
  const [y, m, d] = dateKey.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(12, 0, 0, 0);
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return target.getTime() >= start.getTime() && target.getTime() <= end.getTime();
}

/**
 * Monday of the week shown in the grid: from `week` query (any day in that week
 * is accepted; normalized to Monday) or else the week containing `weekAnchor`.
 */
export function resolveWeekStartFromSearch(search: string, weekAnchor: Date): Date {
  const w = new URLSearchParams(search).get('week');
  if (w) {
    const d = calendarDateKeyToDate(w);
    if (d) return getWeekStartMonday(d);
  }
  return getWeekStartMonday(weekAnchor);
}

/** Prefer "today" if it lies in `weekStart`'s week; otherwise Monday of that week. */
export function pickDefaultDateInWeek(weekStart: Date, weekAnchor: Date): string {
  const todayKey = formatCalendarDateKey(weekAnchor);
  if (isDateKeyInWeek(todayKey, weekStart)) return todayKey;
  return formatCalendarDateKey(weekStart);
}

/**
 * Selected list day from `date` query if it lies in `weekStart`'s week; else default.
 */
export function resolveCalendarDateFromSearch(
  search: string,
  weekStart: Date,
  weekAnchor: Date
): string {
  const raw = new URLSearchParams(search).get('date');
  if (raw && isValidCalendarDateKey(raw) && isDateKeyInWeek(raw, weekStart)) {
    return raw;
  }
  return pickDefaultDateInWeek(weekStart, weekAnchor);
}

export function formatWeekRangeLabel(weekStartMonday: Date): string {
  const end = new Date(weekStartMonday);
  end.setDate(end.getDate() + 6);
  const sy = weekStartMonday.getFullYear();
  const ey = end.getFullYear();
  const s = weekStartMonday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (sy === ey) {
    const e = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${s} – ${e}, ${sy}`;
  }
  return `${weekStartMonday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
