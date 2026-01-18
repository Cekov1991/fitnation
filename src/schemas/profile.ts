import { z } from 'zod';

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

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  fitness_goal: z.enum(['fat_loss', 'muscle_gain', 'strength', 'general_fitness']),
  age: numberCoerce.refine((val) => val === null || val >= 1, { message: 'Age must be 1 or greater' })
    .refine((val) => val === null || val <= 150, { message: 'Age must be 150 or less' }),
  gender: z.enum(['male', 'female', 'other']),
  height: numberCoerce.refine((val) => val === null || val >= 50, { message: 'Height must be 50cm or greater' })
    .refine((val) => val === null || val <= 300, { message: 'Height must be 300cm or less' }),
  weight: numberCoerce.refine((val) => val === null || val >= 1, { message: 'Weight must be 1kg or greater' })
    .refine((val) => val === null || val <= 500, { message: 'Weight must be 500kg or less' })
    .refine((val) => val === null || Number.isInteger(val), { message: 'Weight must be a whole number' }),
  training_experience: z.enum(['beginner', 'intermediate', 'advanced']),
  training_days_per_week: numberCoerce.refine((val) => val === null || val >= 1, { message: 'Training days must be 1 or greater' })
    .refine((val) => val === null || val <= 7, { message: 'Training days must be 7 or less' }),
  workout_duration_minutes: numberCoerce.refine((val) => val === null || val >= 1, { message: 'Duration must be 1 minute or greater' })
    .refine((val) => val === null || val <= 600, { message: 'Duration must be 600 minutes or less' }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
