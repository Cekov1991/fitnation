# Task: Extract Background Gradients Component

## Priority: 🔴 High
## Estimated Time: 30 minutes
## Type: DRY / Refactoring

---

## Problem

The exact same background gradient code is copy-pasted in **8+ components**, violating DRY principles:

```tsx
{/* Background Gradients */}
<div className="fixed inset-0 z-0 pointer-events-none">
  <div 
    className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full   opacity-30" 
    style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
  />
  <div 
    className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full   opacity-30" 
    style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
  />
</div>
```

---

## Solution

### Step 1: Create the Component

Create a new file `src/components/BackgroundGradients.tsx`:

```tsx
import React from 'react';

export function BackgroundGradients() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div 
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full   opacity-30" 
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full   opacity-30" 
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
      />
    </div>
  );
}
```

### Step 2: Update All Components

Replace the duplicated code in the following files:

1. `src/App.tsx` (dashboard section)
2. `src/components/WorkoutSessionPage.tsx`
3. `src/components/PlansPage.tsx`
4. `src/components/ProfilePage.tsx`
5. `src/components/AddWorkoutPage.tsx`
6. `src/components/EditWorkoutPage.tsx`
7. `src/components/ExerciseDetailPage.tsx`
8. `src/components/ExercisePickerPage.tsx`

**In each file:**

1. Add the import:
   ```tsx
   import { BackgroundGradients } from './BackgroundGradients';
   ```

2. Replace the 10-line gradient block with:
   ```tsx
   <BackgroundGradients />
   ```

---

## Validation Steps

1. Visually verify each page still has the gradient background:
   - Dashboard
   - Plans page
   - Profile page
   - Add/Edit workout pages
   - Exercise detail page
   - Workout session page

2. Run TypeScript check:
   ```bash
   npx tsc --noEmit
   ```

3. Ensure the gradients respect the theme (primary/secondary colors)

---

## Optional Enhancement

If you want to make the component more flexible for future use:

```tsx
interface BackgroundGradientsProps {
  primaryOpacity?: number;
  secondaryOpacity?: number;
  disabled?: boolean;
}

export function BackgroundGradients({ 
  primaryOpacity = 0.3, 
  secondaryOpacity = 0.3,
  disabled = false 
}: BackgroundGradientsProps) {
  if (disabled) return null;
  
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div 
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full  " 
        style={{ 
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
          opacity: primaryOpacity 
        }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full  " 
        style={{ 
          backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)',
          opacity: secondaryOpacity 
        }}
      />
    </div>
  );
}
```
