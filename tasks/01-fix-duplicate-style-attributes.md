# Task: Fix Duplicate Style Attributes (Bug Fix)

## Priority: 🔴 High
## Estimated Time: 10 minutes
## Type: Bug Fix

---

## Problem

Several components have **two `style` props on the same JSX element**, which is invalid JSX. The second `style` prop overwrites the first, causing styles to be lost.

---

## Files to Fix

### 1. `src/components/CreatePlanModal.tsx` (Lines ~113-128)

**Current (broken):**
```tsx
<input 
  id="plan-name" 
  type="text" 
  // ... other props
  style={{ 
    backgroundColor: 'var(--color-bg-elevated)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)'
  }} 
  style={{
    '--tw-ring-color': 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
  } as React.CSSProperties & { '--tw-ring-color': string }}
/>
```

**Fixed:**
```tsx
<input 
  id="plan-name" 
  type="text" 
  // ... other props
  style={{ 
    backgroundColor: 'var(--color-bg-elevated)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
    '--tw-ring-color': 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
  } as React.CSSProperties & { '--tw-ring-color': string }}
/>
```

### 2. `src/components/AddWorkoutPage.tsx` (Lines ~190-214)

Look for the dropdown button with duplicate `style` attributes and merge them.

### 3. `src/components/EditWorkoutPage.tsx` (Lines ~195-214)

Same pattern - look for elements with two `style` props and merge them.

---

## Validation Steps

1. Run the TypeScript compiler to check for errors:
   ```bash
   npx tsc --noEmit
   ```

2. Visually verify the affected components still render correctly:
   - CreatePlanModal input fields should have proper backgrounds
   - AddWorkoutPage dropdown should have proper styling
   - EditWorkoutPage edit button should have proper styling

3. Test hover states still work on these elements

---

## Notes

- When merging styles, keep the TypeScript type assertion on the combined object if CSS custom properties are used
- The `--tw-ring-color` custom property is for Tailwind's focus ring utility
