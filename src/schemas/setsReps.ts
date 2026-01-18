import { z } from 'zod';

export const setsRepsSchema = z.object({
  sets: z.number().min(1, 'At least 1 set required').max(20, 'Maximum 20 sets'),
  reps: z.string().min(1, 'Reps is required'),
  weight: z.string().optional(),
});

export type SetsRepsFormData = z.infer<typeof setsRepsSchema>;
