# Task: Extract Constants to Shared File

## Priority: 🟡 Medium
## Estimated Time: 20 minutes
## Type: DRY / Code Organization

---

## Problem

Constants like `DAY_NAMES` and `WEEKDAY_LABELS` are defined in multiple files:

- `src/components/PlansPage.tsx`: `const DAY_NAMES = ['Monday', 'Tuesday', ...]`
- `src/components/AddWorkoutPage.tsx`: `const daysOfWeek = [{short: 'M', full: 'Monday'}, ...]`
- `src/components/WeeklyCalendar.tsx`: `const WEEKDAY_LABELS = ['M', 'T', 'W', ...]`
- `src/App.tsx`: `const DAY_NAMES = ['Monday', 'Tuesday', ...]` (in handler functions)

---

## Solution

### Step 1: Create Constants File

Create `src/constants/index.ts`:

```typescript
// ============================================
// DATE & TIME CONSTANTS
// ============================================

/**
 * Full day names, starting from Monday (index 0) to Sunday (index 6)
 * Matches the API's day_of_week field (0 = Monday, 6 = Sunday)
 */
export const DAY_NAMES = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

/**
 * Short day labels for compact UI displays
 */
export const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/**
 * Day information for form selectors
 */
export const DAYS_OF_WEEK = [
  { short: 'M', full: 'Monday' },
  { short: 'T', full: 'Tuesday' },
  { short: 'W', full: 'Wednesday' },
  { short: 'T', full: 'Thursday' },
  { short: 'F', full: 'Friday' },
  { short: 'S', full: 'Saturday' },
  { short: 'S', full: 'Sunday' },
] as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type DayName = typeof DAY_NAMES[number];
export type WeekdayLabel = typeof WEEKDAY_LABELS[number];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert day name to index (0-6)
 */
export function dayNameToIndex(dayName: DayName): number {
  return DAY_NAMES.indexOf(dayName);
}

/**
 * Convert index (0-6) to day name
 */
export function indexToDayName(index: number): DayName | undefined {
  return DAY_NAMES[index];
}
```

### Step 2: Update Components

#### `src/components/PlansPage.tsx`

**Before:**
```tsx
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
```

**After:**
```tsx
import { DAY_NAMES } from '../constants';
// Remove the local const DAY_NAMES
```

#### `src/components/AddWorkoutPage.tsx`

**Before:**
```tsx
const daysOfWeek = [{
  short: 'M',
  full: 'Monday'
}, {
  short: 'T',
  full: 'Tuesday'
}, /* ... */];
```

**After:**
```tsx
import { DAYS_OF_WEEK } from '../constants';

// In the component, replace `daysOfWeek` with `DAYS_OF_WEEK`
```

#### `src/components/WeeklyCalendar.tsx`

**Before:**
```tsx
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
```

**After:**
```tsx
import { WEEKDAY_LABELS } from '../constants';
// Remove the local const WEEKDAY_LABELS
```

#### `src/App.tsx`

Search for any inline `DAY_NAMES` definitions in handler functions (like `handleCreateWorkout`, `handleUpdateWorkout`) and import from constants:

```tsx
import { DAY_NAMES, dayNameToIndex } from './constants';

// Replace inline day conversion logic with:
const dayOfWeek = data.daysOfWeek.length > 0 
  ? dayNameToIndex(data.daysOfWeek[0] as DayName)
  : undefined;
```

---

## Folder Structure

After this task:

```
src/
├── constants/
│   └── index.ts
├── components/
├── hooks/
├── services/
└── types/
```

---

## Validation Steps

1. Run TypeScript check:
   ```bash
   npx tsc --noEmit
   ```

2. Test affected features:
   - Weekly calendar displays correct day labels
   - Adding a workout shows correct day selector
   - Plans page shows correct days for workouts
   - Creating/editing workouts with day selection works

3. Search codebase for any remaining local day constant definitions:
   ```bash
   grep -r "DAY_NAMES\|WEEKDAY_LABELS\|daysOfWeek" src/ --include="*.tsx" --include="*.ts"
   ```

---

## Optional: Add More Constants

If you find other repeated values, add them:

```typescript
// Animation durations for consistency
export const ANIMATION = {
  FAST: 0.15,
  NORMAL: 0.3,
  SLOW: 0.5,
} as const;

// API stale times
export const STALE_TIMES = {
  SHORT: 30 * 1000,      // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000,  // 30 minutes
} as const;
```
