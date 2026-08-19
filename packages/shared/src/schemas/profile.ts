import { z } from 'zod';
import { BOUNDS } from '../units';
import type { UnitSystem } from '../types/api';

// Helper to coerce string/number to number, handling empty strings and null
// This handles the case where IonInput might return a string like "135.00"
const numberCoerce = z.union([
  z.number(),
  z.string().transform((val) => {
    const trimmed = val.trim();
    if (trimmed === '') return null;
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  }),
  z.null(),
  z.undefined(),
]).pipe(z.number().nullable().optional());

/**
 * Build the profile form schema for the unit system the user is currently in.
 *
 * This is a factory rather than a constant because height and weight must be
 * validated in the unit the user typed them in, and the profile form does not
 * carry `unit_system` as a field — the toggle is a separate PATCH, so the unit
 * has to be passed in from the screen.
 *
 * The bug this replaced: the schema applied the *server's* limits (height
 * 50–300, weight 1–500) to the raw number the user typed. Those limits are in
 * canonical units, and the server only applies them after converting. So an
 * imperial user was told 550 lbs was invalid (it is 249 kg — perfectly valid)
 * while 1 lb sailed through the client and was rejected by the server. The
 * onboarding flow never had this bug, which made it worse: the same value
 * passed onboarding and then failed on the profile screen.
 *
 * See the INVARIANT note on BOUNDS: every bound here, once converted, sits
 * strictly inside the server's, so the client never accepts what the server
 * will reject.
 */
export function createProfileSchema(unitSystem: UnitSystem) {
  const height = BOUNDS.height[unitSystem];
  const weight = BOUNDS.weight[unitSystem];

  return z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    fitness_goal: z.enum(['fat_loss', 'muscle_gain', 'strength', 'general_fitness']),
    age: numberCoerce.refine((val) => val == null || val >= 1, { message: 'Age must be 1 or greater' })
      .refine((val) => val == null || val <= 150, { message: 'Age must be 150 or less' }),
    gender: z.enum(['male', 'female', 'other']),
    height: numberCoerce
      .refine((val) => val == null || val >= height.min, {
        message: `Height must be between ${height.min} and ${height.max} ${height.unit}`,
      })
      .refine((val) => val == null || val <= height.max, {
        message: `Height must be between ${height.min} and ${height.max} ${height.unit}`,
      }),
    weight: numberCoerce
      .refine((val) => val == null || val >= weight.min, {
        message: `Weight must be between ${weight.min} and ${weight.max} ${weight.unit}`,
      })
      .refine((val) => val == null || val <= weight.max, {
        message: `Weight must be between ${weight.min} and ${weight.max} ${weight.unit}`,
      }),
    training_experience: z.enum(['beginner', 'intermediate', 'advanced']),
    training_days_per_week: numberCoerce.refine((val) => val == null || val >= 1, { message: 'Training days must be 1 or greater' })
      .refine((val) => val == null || val <= 7, { message: 'Training days must be 7 or less' }),
    workout_duration_minutes: numberCoerce.refine((val) => val == null || val >= 1, { message: 'Duration must be 1 minute or greater' })
      .refine((val) => val == null || val <= 600, { message: 'Duration must be 600 minutes or less' }),
  });
}

// The inferred shape does not depend on the unit system — only the bounds and
// their messages do — so one instance is enough to derive the form type.
export type ProfileFormData = z.infer<ReturnType<typeof createProfileSchema>>;
