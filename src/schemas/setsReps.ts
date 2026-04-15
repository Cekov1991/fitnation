import { z } from 'zod';

export const setsRepsSchema = z.object({
  sets: z.number().min(1, 'At least 1 set required').max(20, 'Maximum 20 sets'),
  minReps: z.number().min(1, 'Min reps required').max(200),
  maxReps: z.number().min(1, 'Max reps required').max(200),
  weight: z.string().optional(),
}).refine(data => data.maxReps >= data.minReps, {
  message: 'Max must be ≥ min',
  path: ['maxReps'],
});

export type SetsRepsFormData = z.infer<typeof setsRepsSchema>;
