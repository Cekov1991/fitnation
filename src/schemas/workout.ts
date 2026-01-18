import { z } from 'zod';

export const workoutSchema = z.object({
  plan: z.string().min(1, 'Please select a plan'),
  name: z.string().min(1, 'Workout name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  daysOfWeek: z.array(z.string()).optional(),
});

export type WorkoutFormData = z.infer<typeof workoutSchema>;
