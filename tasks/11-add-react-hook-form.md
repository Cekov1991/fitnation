# Task: Add React Hook Form for Better Form Management

## Priority: 🟢 Later
## Estimated Time: 3-4 hours
## Type: Developer Experience / Performance

---

## Problem

Forms are managed with individual `useState` calls:

```tsx
// ProfilePage.tsx - 10 separate useState calls
const [fullName, setFullName] = useState('');
const [email, setEmail] = useState('');
const [physicalGoal, setPhysicalGoal] = useState<FitnessGoal>('general_fitness');
const [age, setAge] = useState(0);
const [sex, setSex] = useState<Gender>('other');
const [height, setHeight] = useState(0);
const [weight, setWeight] = useState(0);
const [experienceLevel, setExperienceLevel] = useState<TrainingExperience>('beginner');
const [trainingDays, setTrainingDays] = useState(0);
const [workoutDuration, setWorkoutDuration] = useState(0);
```

**Issues:**
- Verbose code
- No built-in validation
- Each input change re-renders entire form
- Manual reset/initialization logic
- No dirty state tracking

---

## Solution

### Step 1: Install Dependencies

```bash
npm install react-hook-form @hookform/resolvers zod
```

- `react-hook-form`: Form state management
- `@hookform/resolvers`: Validation adapter
- `zod`: Schema validation library

---

### Step 2: Create Form Schemas

Create `src/schemas/profile.ts`:

```typescript
import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  fitness_goal: z.enum(['fat_loss', 'muscle_gain', 'strength', 'general_fitness']),
  age: z.number().min(13, 'Must be at least 13').max(120, 'Invalid age').optional(),
  gender: z.enum(['male', 'female', 'other']),
  height: z.number().min(50, 'Invalid height').max(300, 'Invalid height').optional(),
  weight: z.number().min(20, 'Invalid weight').max(500, 'Invalid weight').optional(),
  training_experience: z.enum(['beginner', 'intermediate', 'advanced']),
  training_days_per_week: z.number().min(1).max(7).optional(),
  workout_duration_minutes: z.number().min(15).max(300).optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
```

Create `src/schemas/plan.ts`:

```typescript
import { z } from 'zod';

export const planSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  is_active: z.boolean(),
});

export type PlanFormData = z.infer<typeof planSchema>;
```

Create `src/schemas/workout.ts`:

```typescript
import { z } from 'zod';

export const workoutSchema = z.object({
  plan: z.string().min(1, 'Please select a plan'),
  name: z.string().min(1, 'Workout name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  daysOfWeek: z.array(z.string()).optional(),
});

export type WorkoutFormData = z.infer<typeof workoutSchema>;
```

---

### Step 3: Refactor ProfilePage

**Before (ProfilePage.tsx):**
```tsx
const [fullName, setFullName] = useState('');
const [email, setEmail] = useState('');
// ... 8 more useState calls

useEffect(() => {
  if (!profile || hasInitialized) return;
  setFullName(profile.name || '');
  setEmail(profile.email || '');
  // ... set 8 more values
  setHasInitialized(true);
}, [hasInitialized, profile]);

const handleSaveChanges = async () => {
  await updateProfile.mutateAsync({
    name: fullName,
    email,
    // ... pass all values
  });
};
```

**After:**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileFormData } from '../schemas/profile';

export function ProfilePage({ onLogout }: ProfilePageProps) {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      fitness_goal: 'general_fitness',
      gender: 'other',
      training_experience: 'beginner',
    },
  });

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        email: profile.email || '',
        fitness_goal: profile.profile?.fitness_goal || 'general_fitness',
        age: profile.profile?.age || undefined,
        gender: profile.profile?.gender || 'other',
        height: profile.profile?.height || undefined,
        weight: profile.profile?.weight || undefined,
        training_experience: profile.profile?.training_experience || 'beginner',
        training_days_per_week: profile.profile?.training_days_per_week || undefined,
        workout_duration_minutes: profile.profile?.workout_duration_minutes || undefined,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Name input */}
      <div>
        <label>Full Name</label>
        <input {...register('name')} />
        {errors.name && <span className="text-red-400">{errors.name.message}</span>}
      </div>

      {/* Email input */}
      <div>
        <label>Email Address</label>
        <input {...register('email')} type="email" />
        {errors.email && <span className="text-red-400">{errors.email.message}</span>}
      </div>

      {/* Number inputs need valueAsNumber */}
      <div>
        <label>Age</label>
        <input {...register('age', { valueAsNumber: true })} type="number" />
        {errors.age && <span className="text-red-400">{errors.age.message}</span>}
      </div>

      {/* Select inputs */}
      <div>
        <label>Physical Goal</label>
        <select {...register('fitness_goal')}>
          <option value="fat_loss">Fat Loss</option>
          <option value="muscle_gain">Muscle Gain</option>
          <option value="strength">Strength</option>
          <option value="general_fitness">General Fitness</option>
        </select>
      </div>

      {/* Submit button */}
      <button 
        type="submit" 
        disabled={!isDirty || isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'SAVE CHANGES'}
      </button>
    </form>
  );
}
```

---

### Step 4: Create Reusable Form Components

Create `src/components/forms/FormInput.tsx`:

```tsx
import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';

interface FormInputProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  registration: UseFormRegisterReturn;
  type?: 'text' | 'email' | 'number' | 'password';
  placeholder?: string;
}

export function FormInput({
  label,
  icon: Icon,
  error,
  registration,
  type = 'text',
  placeholder,
}: FormInputProps) {
  return (
    <div>
      <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
            style={{ color: 'var(--color-text-muted)' }} 
          />
        )}
        <input
          {...registration}
          type={type}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all`}
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: error ? '#f87171' : 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
```

Create `src/components/forms/FormSelect.tsx`:

```tsx
import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { LucideIcon, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  registration: UseFormRegisterReturn;
  options: Option[];
}

export function FormSelect({
  label,
  icon: Icon,
  error,
  registration,
  options,
}: FormSelectProps) {
  return (
    <div>
      <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" 
            style={{ color: 'var(--color-text-muted)' }} 
          />
        )}
        <select
          {...registration}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-12 py-4 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer`}
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: error ? '#f87171' : 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
          style={{ color: 'var(--color-text-muted)' }} 
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
```

---

### Step 5: Refactor Other Forms

Apply the same pattern to:

1. **CreatePlanModal / CreatePlanPage**
2. **AddWorkoutPage**
3. **EditSetsRepsModal**
4. **LoginPage**

---

## Forms to Refactor

| Form | Current useState Count | Schema Needed |
|------|----------------------|---------------|
| ProfilePage | 10 | profileSchema |
| CreatePlanPage | 3 | planSchema |
| AddWorkoutPage | 4 | workoutSchema |
| EditSetsRepsModal | 3 | setsRepsSchema |
| LoginPage | 2 | loginSchema |

---

## Benefits After Refactoring

1. **Less Code:** Remove 20+ useState calls
2. **Built-in Validation:** Schema-based validation with error messages
3. **Performance:** Only changed fields re-render
4. **Dirty Tracking:** `isDirty` tells you if user made changes
5. **Reset Support:** Easy form reset with `reset()`
6. **Type Safety:** Form data is fully typed from schema

---

## Validation Steps

1. All forms still submit correctly
2. Validation errors display inline
3. Submit button disabled when form is invalid
4. Forms pre-fill correctly from API data
5. "Unsaved changes" warnings work (using `isDirty`)
6. No TypeScript errors

---

## Example: Complete Refactored CreatePlanPage

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, Check } from 'lucide-react';
import { planSchema, PlanFormData } from '../schemas/plan';
import { FormInput } from './forms/FormInput';
import { BackgroundGradients } from './BackgroundGradients';

interface CreatePlanPageProps {
  mode?: 'create' | 'edit';
  initialData?: PlanFormData;
  onBack: () => void;
  onSubmit: (data: PlanFormData) => Promise<void>;
}

export function CreatePlanPage({ mode = 'create', initialData, onBack, onSubmit }: CreatePlanPageProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      is_active: false,
    },
  });

  const isActive = watch('is_active');

  const handleFormSubmit = async (data: PlanFormData) => {
    await onSubmit(data);
    onBack();
  };

  return (
    <div>
      <div>
        <div className="min-h-screen w-full pb-32" style={{ backgroundColor: 'var(--color-bg-base)' }}>
          <BackgroundGradients />
          
          <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
              <button onClick={onBack} className="btn-icon">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {mode === 'create' ? 'Create Plan' : 'Edit Plan'}
              </h1>
            </motion.div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              <FormInput
                label="Plan Name *"
                registration={register('name')}
                error={errors.name?.message}
                placeholder="e.g., Bulking Plan"
              />

              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                  Description
                </label>
                <textarea
                  {...register('description')}
                  placeholder="Optional description"
                  rows={4}
                  className="w-full px-5 py-4 border rounded-2xl resize-none"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Active Toggle */}
              <div className="border rounded-2xl p-5" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Active Plan
                  </span>
                  <button
                    type="button"
                    onClick={() => setValue('is_active', !isActive)}
                    className="relative w-14 h-8 rounded-full transition-colors"
                    style={{ backgroundColor: isActive ? '#22c55e' : 'var(--color-bg-elevated)' }}
                  >
                    <motion.div
                      animate={{ x: isActive ? 24 : 2 }}
                      className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                    />
                  </button>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Active plans are highlighted and used as the default.
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={!isValid || isSubmitting}
                whileHover={{ scale: isValid ? 1.02 : 1 }}
                whileTap={{ scale: isValid ? 0.98 : 1 }}
                className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50"
                style={{
                  background: isValid
                    ? 'linear-gradient(to right, var(--color-primary), var(--color-secondary))'
                    : 'var(--color-bg-elevated)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Check size={20} />
                  {isSubmitting ? 'Saving...' : mode === 'create' ? 'CREATE PLAN' : 'SAVE CHANGES'}
                </span>
              </motion.button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
```
