/**
 * The query key registry (spec 0028).
 *
 * Every React Query key in the front-end is built here and nowhere else.
 * Before this file there were 107 inline array literals across 23 shapes, and
 * the facts a caller needed to invalidate correctly lived in no type: that the
 * segment is `'sessions'` and not the URL's `'workout-sessions'`; that
 * `detail(id)` and `today()` are siblings under `all()`, so invalidating
 * `all()` reaches both; that `history(id, params)` is reached by the shorter
 * `histories(id)` only because React Query matches by prefix. Two keys drifted
 * out of that folklore and were invalidated against nothing (0018).
 *
 * Each domain derives its narrower keys from its list key, so the prefix
 * relationships are visible in the code rather than remembered. A wrong shape
 * is a compile error; a misspelled segment cannot happen, because segments are
 * written once.
 *
 * Invalidate with the widest key that says what you mean: after a session
 * changes, `sessions.all()` refreshes the detail, today's workout and every
 * calendar range in one call. The narrower keys exist for reads and for
 * targeted patches, not for invalidating alongside their parent.
 */

export interface ExerciseHistoryParams {
  limit?: number;
  start_date?: string;
  end_date?: string;
}

export type BodyRegion = 'upper' | 'lower' | 'core';

const profileRoot = ['profile'] as const;
const fitnessMetricsRoot = ['fitness-metrics'] as const;
const plansRoot = ['plans'] as const;
const plannerRoot = ['planner'] as const;
const programsRoot = ['programs'] as const;
const templatesRoot = ['templates'] as const;
const routinesRoot = ['routines'] as const;
const sessionsRoot = ['sessions'] as const;
const exercisesRoot = ['exercises'] as const;

export const queryKeys = {
  profile: {
    all: () => profileRoot,
  },
  fitnessMetrics: {
    all: () => fitnessMetricsRoot,
  },
  plans: {
    all: () => plansRoot,
    detail: (planId: number) => [...plansRoot, planId] as const,
  },
  planner: {
    all: () => plannerRoot,
    weekly: () => [...plannerRoot, 'weekly'] as const,
  },
  programs: {
    all: () => programsRoot,
    library: () => [...programsRoot, 'library'] as const,
    detail: (programId: number) => [...programsRoot, programId] as const,
    nextWorkout: (programId: number) => [...programsRoot, programId, 'next-workout'] as const,
  },
  templates: {
    all: () => templatesRoot,
    detail: (templateId: number) => [...templatesRoot, templateId] as const,
  },
  routines: {
    all: () => routinesRoot,
    detail: (routineId: number) => [...routinesRoot, routineId] as const,
  },
  sessions: {
    all: () => sessionsRoot,
    detail: (sessionId: number) => [...sessionsRoot, sessionId] as const,
    today: () => [...sessionsRoot, 'today'] as const,
    /** One date range, exactly as `useCalendar` was called. */
    calendar: (startDate: string, endDate: string) => [...sessionsRoot, 'calendar', startDate, endDate] as const,
    /** Every cached range — the prefix of `calendar()`. */
    calendars: () => [...sessionsRoot, 'calendar'] as const,
  },
  exercises: {
    all: () => exercisesRoot,
    list: (search?: string) => [...exercisesRoot, search ?? ''] as const,
    detail: (exerciseId: number) => [...exercisesRoot, exerciseId] as const,
    /** One history query, exactly as `useExerciseHistory` was called. */
    history: (exerciseId: number, params?: ExerciseHistoryParams) =>
      [...exercisesRoot, exerciseId, 'history', params] as const,
    /** Every cached history for the exercise — the prefix of `history()`. */
    histories: (exerciseId: number) => [...exercisesRoot, exerciseId, 'history'] as const,
  },
  taxonomy: {
    muscleGroups: (bodyRegion?: BodyRegion) => ['muscle-groups', bodyRegion] as const,
    movementPatterns: () => ['movement-patterns'] as const,
    equipmentTypes: () => ['equipment-types'] as const,
    targetRegions: () => ['target-regions'] as const,
    angles: () => ['angles'] as const,
    categories: (type?: 'workout') => ['categories', type] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
