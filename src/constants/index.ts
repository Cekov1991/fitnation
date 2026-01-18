// ============================================
// DATE & TIME CONSTANTS
// ============================================

/**
 * Full day names, starting from Monday (index 0) to Sunday (index 6)
 * Matches the API's day_of_week field (0 = Monday, 6 = Sunday)
 */
export const DAY_NAMES = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

/**
 * Short day labels for compact UI displays
 */
export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/**
 * Day information for form selectors
 */
export const DAYS_OF_WEEK = [
  { short: 'M', full: 'Monday' },
  { short: 'T', full: 'Tuesday' },
  { short: 'W', full: 'Wednesday' },
  { short: 'T', full: 'Thursday' },
  { short: 'F', full: 'Friday' },
  { short: 'S', full: 'Saturday' },
  { short: 'S', full: 'Sunday' },
] as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type DayName = typeof DAY_NAMES[number];
export type WeekdayLabel = typeof WEEKDAY_LABELS[number];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert day name to index (0-6)
 */
export function dayNameToIndex(dayName: DayName): number {
  return DAY_NAMES.indexOf(dayName);
}

/**
 * Convert index (0-6) to day name
 */
export function indexToDayName(index: number): DayName | undefined {
  return DAY_NAMES[index];
}
