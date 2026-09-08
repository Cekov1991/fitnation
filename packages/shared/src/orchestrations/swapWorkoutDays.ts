import type { UpdateTemplateInput } from '../types/api';
import type { Outcome } from './outcome';

/**
 * Exchange the days of two Workout Templates: two PATCHes. If the second fails
 * after the first, both templates sit on the same day — the exact collision
 * the day picker exists to prevent — so the first template is moved back to
 * where it was.
 */
export interface SwapWorkoutDaysDeps {
  updateTemplate: (vars: { templateId: number; data: UpdateTemplateInput }) => Promise<unknown>;
}

export interface WorkoutDay {
  templateId: number;
  /** The server requires the name on every template update. */
  name: string;
  /** 0–6, or undefined for unassigned. */
  dayOfWeek: number | undefined;
}

export type SwapWorkoutDaysOutcome = Outcome<'first' | 'second'>;

export async function swapWorkoutDays(
  deps: SwapWorkoutDaysDeps,
  input: { current: WorkoutDay; target: WorkoutDay }
): Promise<SwapWorkoutDaysOutcome> {
  const { current, target } = input;
  try {
    await deps.updateTemplate({ templateId: target.templateId, data: { name: target.name, day_of_week: current.dayOfWeek } });
  } catch (error) {
    return { ok: false, failed: 'first', error, compensated: true };
  }

  try {
    await deps.updateTemplate({ templateId: current.templateId, data: { name: current.name, day_of_week: target.dayOfWeek } });
  } catch (error) {
    let compensated = false;
    try {
      await deps.updateTemplate({ templateId: target.templateId, data: { name: target.name, day_of_week: target.dayOfWeek } });
      compensated = true;
    } catch {
      // Both now share a day; the outcome says so.
    }
    return { ok: false, failed: 'second', error, compensated };
  }

  return { ok: true };
}
