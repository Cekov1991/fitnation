# Task: Fix WeeklyCalendar Date Recreation

## Priority: 🔴 High
## Estimated Time: 5 minutes
## Type: Performance Fix

---

## Problem

In `src/components/WeeklyCalendar.tsx`, a new `Date` object is created on every render:

```tsx
export function WeeklyCalendar() {
  const today = new Date(); // ❌ New object every render!
  const weekStart = useMemo(() => getWeekStart(today), [today]); // useMemo is useless here
```

Since `today` is a new object reference on every render, the `useMemo` dependency `[today]` always triggers recalculation, defeating the purpose of memoization.

---

## Solution

**File:** `src/components/WeeklyCalendar.tsx`

### Option A: Simple Fix (Recommended)

Calculate `today` once on component mount:

```tsx
export function WeeklyCalendar() {
  // Calculate today only once when component mounts
  const today = useMemo(() => new Date(), []);
  
  const weekStart = useMemo(() => getWeekStart(today), [today]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);
  
  // ... rest of component
}
```

### Option B: More Robust (if calendar needs to update at midnight)

```tsx
export function WeeklyCalendar() {
  // Get today's date as a stable string to use in dependencies
  const todayString = useMemo(() => {
    const now = new Date();
    return formatDate(now); // Returns "YYYY-MM-DD"
  }, []);
  
  const today = useMemo(() => new Date(todayString), [todayString]);
  
  const weekStart = useMemo(() => getWeekStart(today), [today]);
  // ... rest
}
```

---

## Additional Cleanup

While you're in this file, also check the `weekData` useMemo:

```tsx
const weekData = useMemo<DayStatus[]>(() => {
  return Array.from({
    length: 7
  }).map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const formatted = formatDate(date);
    const session = sessionsByDate.get(formatted);
    const progress = session ? session.completed ? 100 : 50 : 0;
    return {
      day: WEEKDAY_LABELS[index],
      date: date.getDate(),
      progress,
      isToday: formatDate(date) === formatDate(today) // This comparison is fine
    };
  });
}, [sessionsByDate, today, weekStart]); // ✅ These will now be stable
```

After fixing `today`, the `weekData` memoization will work correctly.

---

## Validation Steps

1. Run the app and navigate to the dashboard
2. Open React DevTools Profiler
3. Interact with other parts of the dashboard
4. Verify `WeeklyCalendar` doesn't re-render unnecessarily
5. Verify the calendar still shows correct dates and progress

---

## Testing Edge Cases

- Verify the calendar still shows correct "isToday" highlighting
- If the app stays open past midnight, the calendar should still work (though it won't update automatically with Option A - which is acceptable)
