import type { ExerciseHistoryResource, PerformanceDataPoint } from '../types/api';

/**
 * What the exercise-detail screens derive from an exercise's history (0031 #5).
 * Five derivations existed twice on mobile and once more on web, unreachable
 * by any test; progressPercentage in particular is a business calculation.
 * The screens format these numbers with their units; nothing here does.
 */
export type ChartMode = 'weight' | 'volume';

export interface HistoryViewOptions {
  /** Bodyweight exercises chart best-set reps instead of a weight or a volume. */
  allowWeightLogging: boolean;
  chartMode: ChartMode;
}

/** The number a point contributes under the chart's current mode. */
export function historyMetric(point: PerformanceDataPoint, { allowWeightLogging, chartMode }: HistoryViewOptions): number {
  if (!allowWeightLogging) return point.best_set_reps;
  return chartMode === 'weight' ? point.weight : point.volume;
}

export function chartPoints(history: ExerciseHistoryResource | null | undefined, options: HistoryViewOptions): { date: string; value: number }[] {
  return (history?.performance_data ?? []).map(point => ({ date: point.date, value: historyMetric(point, options) }));
}

/** Change from the first session to the latest, in percent; 0 when there is no history or nothing to grow from. */
export function progressPercentage(history: ExerciseHistoryResource | null | undefined, options: HistoryViewOptions): number {
  const data = history?.performance_data ?? [];
  if (data.length === 0) return 0;
  const first = historyMetric(data[0], options);
  const last = historyMetric(data[data.length - 1], options);
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}

/** The last `count` sessions, most recent first. */
export function recentSessions(history: ExerciseHistoryResource | null | undefined, count = 3): PerformanceDataPoint[] {
  return [...(history?.performance_data ?? [])].reverse().slice(0, count);
}

/** The latest session's number under the chart's mode, or null with no history. */
export function currentValue(history: ExerciseHistoryResource | null | undefined, options: HistoryViewOptions): number | null {
  const data = history?.performance_data ?? [];
  if (data.length === 0) return null;
  if (!options.allowWeightLogging) return history!.stats.current_best_set_reps;
  return options.chartMode === 'weight' ? history!.stats.current_weight : data[data.length - 1].volume;
}

/** The all-time best under the chart's mode, or null with no history. */
export function bestValue(history: ExerciseHistoryResource | null | undefined, options: HistoryViewOptions): number | null {
  const data = history?.performance_data ?? [];
  if (data.length === 0) return null;
  if (!options.allowWeightLogging) return history!.stats.best_set_reps;
  return options.chartMode === 'weight' ? history!.stats.best_weight : Math.max(...data.map(p => p.volume));
}
