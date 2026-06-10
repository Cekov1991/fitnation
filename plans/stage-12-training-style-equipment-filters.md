# Stage 12 — Training Style & Equipment Filters

Add `training_styles` and `equipment_types` filtering to the AI workout generation and plan regeneration flows.

## Background

The backend API now accepts new optional parameters on three endpoints:
- `POST /api/workout-sessions/generate` — add `training_styles`, full `equipment_types` list (incl. KETTLEBELL, TRX)
- `POST /api/workout-sessions/{id}/regenerate` — add `training_styles`
- `POST /api/plans/regenerate` — add `equipment_types`, `training_styles`, `movement_patterns`, `angles`, `plan_name`

**Not in scope:** `POST /api/onboarding/complete` (deferred).

## UX Design (agreed)

### Equipment + style filter model
- All surfaces show an **equipment multi-select chip row** (all types: BARBELL, BODYWEIGHT, CABLE, DUMBBELL, KETTLEBELL, MACHINE, TRX) fetched live from `GET /api/equipment-types`
- All surfaces also show a **style toggle** below equipment: Bodybuilding (default) | Functional — always visible, independent of equipment selection
- **Always send `training_styles`** with the selected style; send `equipment_types` only when at least one chip is selected
- When both are provided, the API applies **AND logic** (exercises must match equipment and style)
- All selections **reset to defaults** on every open/mount

### GenerateWorkoutPage (`/generate-workout`)
- Add equipment chips + style toggle below the duration row
- Include selections in `generationParams` passed via route state to WorkoutPreviewPage

### WorkoutPreviewPage (`/generate-workout/preview/:sessionId`)
- **No UI changes** — regenerate already re-uses `generationParams` from `location.state` (lines 31-33, 65, 70)
- Just needs `training_styles`/`equipment_types` present in the `GenerateWorkoutInput` type

### ProgramControls (dashboard)
- Replace the existing `ConfirmDialog` (lines 269-281) with a new `RegeneratePlanModal`
- Modal shows: equipment chips + style toggle + optional warning text (when `hasCompletedWorkouts > 0`)
- On confirm, pass selections to `regeneratePlan.mutateAsync()`
- Resets to defaults each open

---

## Phase 0 — Discovery Summary (completed)

### Confirmed file locations

| File | Key lines |
|------|-----------|
| `apps/web/src/types/api.ts` | `GenerateWorkoutInput` L609-615, `RegenerateWorkoutInput` L617-623 |
| `apps/web/src/services/api.ts` | `regeneratePlan` L343-348, `generateDraftSession` L504-508, `regenerateDraftSession` L515-519 |
| `packages/shared/src/hooks/useApi.ts` | `useRegeneratePlan` L200-216 |
| `apps/web/src/components/GenerateWorkoutPage.tsx` | `generationParams` built L64-68, pushed L72 |
| `apps/web/src/components/WorkoutPreviewPage.tsx` | consumed L31-33, reused L65, propagated L70 |
| `apps/web/src/components/dashboard/ProgramControls.tsx` | `ConfirmDialog` L269-281, `showWarning` state, `regeneratePlan.mutateAsync()` |

### Existing type gaps
`GenerateWorkoutInput` and `RegenerateWorkoutInput` are **missing** `equipment_types` and `training_styles`.  
`regeneratePlan` currently sends `{}` — no input type exists yet.  
`useRegeneratePlan` hook takes no parameters.

---

## Phase 1 — Type & API Layer

**Goal:** Add the new fields to all type definitions and wire them through the API service and hook. No UI changes.

### Tasks

#### 1.1 — Update `GenerateWorkoutInput` in `apps/web/src/types/api.ts` (lines 609-615)

```typescript
export interface GenerateWorkoutInput {
  target_regions?: string[];
  equipment_types?: string[];        // ADD
  movement_patterns?: string[];
  angles?: string[];
  training_styles?: string[];        // ADD
  duration_minutes?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
```

#### 1.2 — Update `RegenerateWorkoutInput` in `apps/web/src/types/api.ts` (lines 617-623)

```typescript
export interface RegenerateWorkoutInput {
  target_regions?: string[];
  equipment_types?: string[];        // ADD
  movement_patterns?: string[];
  angles?: string[];
  training_styles?: string[];        // ADD
  duration_minutes?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
```

#### 1.3 — Add `RegeneratePlanInput` to `apps/web/src/types/api.ts` (add after `RegenerateWorkoutInput`)

```typescript
export interface RegeneratePlanInput {
  plan_name?: string;
  equipment_types?: string[];
  movement_patterns?: string[];
  angles?: string[];
  training_styles?: string[];
}
```

#### 1.4 — Update `regeneratePlan` in `apps/web/src/services/api.ts` (lines 343-348)

```typescript
regeneratePlan: async (data?: RegeneratePlanInput) => {
  return fetchWithAuth('/plans/regenerate', {
    method: 'POST',
    body: JSON.stringify(data ?? {})
  });
}
```

Import `RegeneratePlanInput` at the top of the file if not already imported from the types barrel.

#### 1.5 — Update `useRegeneratePlan` in `packages/shared/src/hooks/useApi.ts` (lines 200-216)

```typescript
export function useRegeneratePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: RegeneratePlanInput) => plansApi.regeneratePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });
}
```

Ensure `RegeneratePlanInput` is exported from the shared package's type barrel so it's importable in `ProgramControls`.

### Verification
```bash
# TypeScript should compile clean
pnpm --filter @fit-nation/web tsc --noEmit
pnpm --filter @fit-nation/shared tsc --noEmit

# Confirm new fields exist
grep -n "training_styles\|equipment_types" apps/web/src/types/api.ts
grep -n "RegeneratePlanInput" apps/web/src/services/api.ts packages/shared/src/hooks/useApi.ts
```

### Anti-patterns
- Do NOT add `equipment_types` to `UpdateProfileInput` — equipment is a per-generation preference, not a profile field
- Do NOT change the `onSuccess` invalidation keys in `useRegeneratePlan`

---

## Phase 2 — GenerateWorkoutPage UI

**Goal:** Add equipment chip row and style toggle to `GenerateWorkoutPage.tsx`. No changes to WorkoutPreviewPage.

**Read first:** `apps/web/src/components/GenerateWorkoutPage.tsx` in full before editing.  
**Copy pattern from:** `apps/web/src/components/ExercisePickerPage.tsx` — equipment chip row pattern with `useEquipmentTypes`.

### Tasks

#### 2.1 — Add imports to `GenerateWorkoutPage.tsx`

```typescript
import { useEquipmentTypes } from '@fit-nation/shared'; // already exported from shared
```

#### 2.2 — Add state variables (after existing state, ~line 35)

```typescript
const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
const [selectedStyle, setSelectedStyle] = useState<'BODYBUILDING' | 'FUNCTIONAL'>('BODYBUILDING');
```

#### 2.3 — Fetch equipment types

```typescript
const { data: equipmentTypesData } = useEquipmentTypes();
const equipmentTypes = equipmentTypesData?.data ?? [];
```

#### 2.4 — Update `generationParams` build (lines 64-68)

```typescript
const generationParams: GenerateWorkoutInput = {
  target_regions: preset && preset.targetRegions.length > 0 ? preset.targetRegions : undefined,
  duration_minutes: selectedDuration || undefined,
  difficulty: profile?.profile?.training_experience || undefined,
  equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
  training_styles: [selectedStyle],
};
```

#### 2.5 — Equipment chip toggle handler

```typescript
const toggleEquipment = (code: string) => {
  setSelectedEquipment(prev =>
    prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
  );
};
```

#### 2.6 — Add UI below the duration section (before the Generate button)

Insert a new section with:

```tsx
{/* Equipment */}
<div className="...">
  <p className="...">Equipment (optional)</p>
  <div className="flex flex-wrap gap-2">
    {equipmentTypes.map(eq => (
      <button
        key={eq.code}
        onClick={() => toggleEquipment(eq.code)}
        className={selectedEquipment.includes(eq.code) ? 'chip-active' : 'chip'}
      >
        {eq.name}
      </button>
    ))}
  </div>
</div>

{/* Style toggle — always visible */}
<div className="...">
  <p className="...">Training Style</p>
  <div className="flex gap-2">
    {(['BODYBUILDING', 'FUNCTIONAL'] as const).map(style => (
      <button
        key={style}
        onClick={() => setSelectedStyle(style)}
        className={selectedStyle === style ? 'chip-active' : 'chip'}
      >
        {style === 'BODYBUILDING' ? 'Bodybuilding' : 'Functional'}
      </button>
    ))}
  </div>
</div>
```

**Style note:** Match the exact className patterns used by the existing preset buttons and duration buttons in the file — do not invent new class names.

### Verification
- Equipment chips appear below duration row
- Style toggle is always visible below equipment chips
- `generationParams` logged before `history.push` always contains `training_styles` and `equipment_types` when chips are selected
- WorkoutPreviewPage regenerate still works (no change needed there)

### Anti-patterns
- Do NOT hardcode equipment types — always use the live API response from `useEquipmentTypes()`
- Do NOT hide the style toggle when equipment is selected
- Do NOT omit `training_styles` from the request — always send the selected style

---

## Phase 3 — ProgramControls Regenerate Modal

**Goal:** Replace the existing `ConfirmDialog` in `ProgramControls.tsx` with a new `RegeneratePlanModal` that includes equipment/style selection.

**Read first:** `apps/web/src/components/dashboard/ProgramControls.tsx` in full.  
**Pattern reference:** Phase 2 UI pattern for equipment chips + style toggle.

### Tasks

#### 3.1 — Create `apps/web/src/components/dashboard/RegeneratePlanModal.tsx`

New component with props:
```typescript
interface RegeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: { equipment_types?: string[]; training_styles?: string[] }) => void;
  showWarning: boolean;  // true when plan has completed workouts
  isLoading: boolean;
}
```

Internal state (resets each open via `useEffect` on `isOpen`):
```typescript
const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
const [selectedStyle, setSelectedStyle] = useState<'BODYBUILDING' | 'FUNCTIONAL'>('BODYBUILDING');
```

Reset on open:
```typescript
useEffect(() => {
  if (isOpen) {
    setSelectedEquipment([]);
    setSelectedStyle('BODYBUILDING');
  }
}, [isOpen]);
```

On confirm, call:
```typescript
onConfirm({
  equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
  training_styles: [selectedStyle],
});
```

Modal body: same equipment chip row + style toggle from Phase 2, plus optional warning text block when `showWarning` is true:
```tsx
{showWarning && (
  <p className="text-warning ...">
    Your current personalized plan has completed workouts. Refreshing will create a new plan and you will start from scratch.
  </p>
)}
```

#### 3.2 — Update `ProgramControls.tsx`

- Replace `ConfirmDialog` import + JSX (lines 269-281) with `RegeneratePlanModal`
- Replace `showWarning` boolean with `isRegenerateModalOpen` (rename for clarity)
- Update `withWarningIfNeeded()` to always open the modal (not just when `hasCompletedWorkouts > 0`) — the modal shows warning text conditionally
- Update `executeRegenerate()` to accept params:

```typescript
const executeRegenerate = async (params: { equipment_types?: string[]; training_styles?: string[] }) => {
  setIsRegenerating(true);
  const delay = new Promise(resolve => setTimeout(resolve, MIN_LOADING_DELAY_MS));
  try {
    await regeneratePlan.mutateAsync(params);
    await queryClient.refetchQueries({ queryKey: ['programs'] });
  } finally {
    await delay;
    setIsRegenerating(false);
    setIsRegenerateModalOpen(false);
  }
};
```

- Render `RegeneratePlanModal`:
```tsx
<RegeneratePlanModal
  isOpen={isRegenerateModalOpen}
  onClose={() => setIsRegenerateModalOpen(false)}
  onConfirm={executeRegenerate}
  showWarning={hasCompletedWorkouts > 0}
  isLoading={isRegenerating}
/>
```

### Verification
- Clicking "Refresh Program" opens the modal
- Warning text appears when plan has completed workouts, absent when not
- Style toggle remains visible regardless of equipment selection
- Confirming calls `regeneratePlan.mutateAsync` with `training_styles` always and `equipment_types` when chips are selected
- Modal closes and resets after confirm
- TypeScript compiles clean

### Anti-patterns
- Do NOT keep the old `ConfirmDialog` for the warning case alongside the new modal — one modal handles both
- Do NOT persist equipment/style selections between modal opens

---

## Phase 4 — Final Verification

```bash
# TypeScript clean across all packages
pnpm tsc --noEmit

# Confirm training_styles is wired everywhere it should be
grep -rn "training_styles" apps/web/src/ packages/shared/src/

# Confirm both equipment_types and training_styles are wired in generation flows
grep -n "equipment_types\|training_styles" apps/web/src/components/GenerateWorkoutPage.tsx

# Confirm regeneratePlan accepts params
grep -n "regeneratePlan" apps/web/src/services/api.ts packages/shared/src/hooks/useApi.ts apps/web/src/components/dashboard/ProgramControls.tsx

# Confirm WorkoutPreviewPage unchanged (no new UI)
git diff apps/web/src/components/WorkoutPreviewPage.tsx
```

Manual test checklist:
- [ ] Generate Workout: equipment chips and style toggle both always visible
- [ ] Generate Workout: Functional style generates a workout without error
- [ ] Generate Workout: TRX + Dumbbell equipment combo generates without error
- [ ] WorkoutPreviewPage: REGENERATE button re-uses original equipment/style selections
- [ ] Dashboard: "Refresh Program" opens modal with chips and style toggle
- [ ] Dashboard modal: warning text visible when plan has completed workouts
- [ ] Dashboard modal: confirm regenerates plan with selected equipment/style
