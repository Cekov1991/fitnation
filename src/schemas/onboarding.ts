import { z } from 'zod';

export const onboardingSchema = z.object({
  // Personal Info (age, gender, height, weight)
  age: z.number()
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Please enter a valid age')
    .nullable(),
  gender: z.enum(['male', 'female', 'other']),
  height: z.number()
    .min(100, 'Height must be at least 100 cm')
    .max(250, 'Height must be less than 250 cm')
    .nullable(),
  weight: z.number()
    .min(30, 'Weight must be at least 30 kg')
    .max(300, 'Weight must be less than 300 kg')
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
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
