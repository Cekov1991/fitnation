import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  partner_id: z.number({ required_error: 'Please select a partner' }).int().positive('Please select a partner'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
