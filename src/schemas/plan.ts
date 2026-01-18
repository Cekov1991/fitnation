import { z } from 'zod';

export const planSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  is_active: z.boolean(),
});

export type PlanFormData = z.infer<typeof planSchema>;
