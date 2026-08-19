import { z } from 'zod';
import { BOUNDS } from '../units';

// Height/weight are entered in whichever unit system the user picks during
// onboarding, and converted to cm/kg server-side. Bounds are checked per unit
// system in the superRefine below, so the field-level rules here only need to
// be loose enough to admit both. The table itself lives in ../units so the
// profile editor checks against the same numbers.

export const onboardingSchema = z.object({
  // Personal Info (name, age, gender, height, weight)
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  age: z.number()
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Please enter a valid age')
    .nullable(),
  gender: z.enum(['male', 'female', 'other']),
  unit_system: z.enum(['metric', 'imperial']),
  height: z.number()
    .min(BOUNDS.height.imperial.min, 'Please enter a valid height')
    .max(BOUNDS.height.metric.max, 'Please enter a valid height')
    .nullable(),
  weight: z.number()
    .min(BOUNDS.weight.metric.min, 'Please enter a valid weight')
    .max(BOUNDS.weight.imperial.max, 'Please enter a valid weight')
    .nullable(),

  // Fitness Goals
  fitness_goal: z.enum(['fat_loss', 'muscle_gain', 'strength', 'general_fitness']),

  // Training Preferences
  training_experience: z.enum(['beginner', 'intermediate', 'advanced']),
  training_days_per_week: z.number()
    .min(1, 'At least 1 day per week')
    .max(7, 'Maximum 7 days per week'),
  workout_duration_minutes: z.number()
    .min(15, 'Minimum 15 minutes')
    .max(180, 'Maximum 180 minutes'),
}).superRefine((data, ctx) => {
  const system = data.unit_system === 'imperial' ? 'imperial' : 'metric';

  const height = BOUNDS.height[system];
  if (data.height != null && (data.height < height.min || data.height > height.max)) {
    ctx.addIssue({
      code: 'custom',
      path: ['height'],
      message: `Height must be between ${height.min} and ${height.max} ${height.unit}`,
    });
  }

  const weight = BOUNDS.weight[system];
  if (data.weight != null && (data.weight < weight.min || data.weight > weight.max)) {
    ctx.addIssue({
      code: 'custom',
      path: ['weight'],
      message: `Weight must be between ${weight.min} and ${weight.max} ${weight.unit}`,
    });
  }
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
