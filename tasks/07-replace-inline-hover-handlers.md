# Task: Replace Inline Hover Handlers with CSS

## Priority: 🟡 Medium
## Estimated Time: 2-3 hours
## Type: Performance / Code Quality

---

## Problem

There are **50+ instances** of this pattern throughout the codebase:

```tsx
<button
  style={{ backgroundColor: 'var(--color-border-subtle)' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-border)';
    e.currentTarget.style.color = 'var(--color-text-primary)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
    e.currentTarget.style.color = 'var(--color-text-secondary)';
  }}
>
```

**Issues:**
- Unnecessary JavaScript execution on every hover
- More verbose code
- Potential for bugs (forgetting to reset styles)
- Harder to maintain

---

## Solution

### Approach 1: CSS Classes with CSS Variables (Recommended)

#### Step 1: Add CSS Classes to `src/index.css`

```css
/* ============================================
   INTERACTIVE ELEMENT STYLES
   ============================================ */

/* Base interactive button */
.btn-interactive {
  transition: all 0.2s ease;
}

/* Surface background with hover */
.bg-surface-hover {
  background-color: var(--color-bg-surface);
  transition: background-color 0.2s ease;
}
.bg-surface-hover:hover {
  background-color: var(--color-bg-elevated);
}

/* Elevated background with hover */
.bg-elevated-hover {
  background-color: var(--color-bg-elevated);
  transition: background-color 0.2s ease;
}
.bg-elevated-hover:hover {
  background-color: var(--color-bg-surface);
}

/* Border subtle with hover */
.bg-border-subtle-hover {
  background-color: var(--color-border-subtle);
  transition: background-color 0.2s ease;
}
.bg-border-subtle-hover:hover {
  background-color: var(--color-border);
}

/* Text secondary to primary on hover */
.text-hover-primary {
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}
.text-hover-primary:hover {
  color: var(--color-text-primary);
}

/* Primary color hover effect */
.bg-primary-hover {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  transition: background-color 0.2s ease;
}
.bg-primary-hover:hover {
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

/* Icon button (round) */
.btn-icon {
  padding: 0.5rem;
  border-radius: 9999px;
  background-color: var(--color-border-subtle);
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}
.btn-icon:hover {
  background-color: var(--color-border);
  color: var(--color-text-primary);
}

/* Card hover effect */
.card-hover {
  background-color: var(--color-bg-surface);
  border-color: var(--color-border-subtle);
  transition: all 0.2s ease;
}
.card-hover:hover {
  background-color: var(--color-bg-elevated);
}
```

#### Step 2: Replace Inline Handlers

**Before:**
```tsx
<button 
  className="p-2 rounded-full transition-colors"
  style={{ backgroundColor: 'var(--color-border-subtle)' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-border)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
  }}
>
  <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
</button>
```

**After:**
```tsx
<button className="btn-icon">
  <ArrowLeft className="w-6 h-6" />
</button>
```

---

### Files to Update

Search and replace in the following files:

1. **`src/components/WeeklyCalendar.tsx`** (~2 instances)
2. **`src/components/PlansPage.tsx`** (~8 instances)
3. **`src/components/ProfilePage.tsx`** (~10 instances)
4. **`src/components/AddWorkoutPage.tsx`** (~6 instances)
5. **`src/components/EditWorkoutPage.tsx`** (~4 instances)
6. **`src/components/WorkoutSessionPage.tsx`** (~15 instances)
7. **`src/components/ExerciseDetailPage.tsx`** (~3 instances)
8. **`src/components/CreatePlanModal.tsx`** (~3 instances)

---

### Common Patterns to Replace

#### Pattern 1: Icon Buttons

**Before:**
```tsx
<button 
  onClick={onBack} 
  className="p-2 rounded-full transition-colors"
  style={{ backgroundColor: 'var(--color-border-subtle)' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-border)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
  }}
>
  <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
</button>
```

**After:**
```tsx
<button onClick={onBack} className="btn-icon">
  <ArrowLeft className="w-6 h-6" />
</button>
```

#### Pattern 2: Card/List Items

**Before:**
```tsx
<div
  className="p-4 rounded-xl transition-colors border"
  style={{ 
    backgroundColor: 'var(--color-bg-surface)',
    borderColor: 'var(--color-border-subtle)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
  }}
>
```

**After:**
```tsx
<div className="card-hover p-4 rounded-xl border">
```

#### Pattern 3: Text with Hover

**Before:**
```tsx
<span 
  style={{ color: 'var(--color-text-secondary)' }}
  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
>
```

**After:**
```tsx
<span className="text-hover-primary">
```

---

### Approach 2: Tailwind Plugin (Alternative)

If you prefer keeping styles in JSX, you can extend Tailwind config:

**`tailwind.config.js`:**
```javascript
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--color-bg-base)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'border-subtle': 'var(--color-border-subtle)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
      },
    },
  },
}
```

Then use:
```tsx
<button className="bg-border-subtle hover:bg-border text-secondary hover:text-primary transition-colors">
```

---

## Validation Steps

1. Run the app and check all interactive elements:
   - Buttons highlight on hover
   - Cards change background on hover
   - Text changes color on hover

2. Test on touch devices (hover states shouldn't cause issues)

3. Run performance profiler - JavaScript execution should decrease on hover interactions

4. Visual regression check on all pages

---

## Notes

- Keep `motion` animations from Framer Motion separate (scale, tap effects)
- Focus states should still work (`:focus-visible`)
- This task can be done incrementally - start with the most repeated pattern
