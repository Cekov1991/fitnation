# Stage 13 — Mobile: Training Style & Equipment Filters

Mobile companion to Stage 12. Brings the equipment-first filter UI to the React Native app.

## Prerequisites

**Stage 12 Phase 1 must be complete first.** The shared package type/API changes (`GenerateWorkoutInput`, `RegenerateWorkoutInput`, `RegeneratePlanInput`, `useRegeneratePlan` accepting params) are done there and are not repeated here.

## Surfaces

| Screen | Change |
|--------|--------|
| `GenerateWorkoutScreen.tsx` | Add equipment chips + style toggle |
| `WorkoutPreviewScreen.tsx` | **No changes** — generationParams already threads through route params |
| `DashboardScreen.tsx` | Replace/extend ConfirmDialog with a new `RegeneratePlanModal` |

## UX Design (same model as web)

- Equipment multi-select chip row (all types: BARBELL, BODYWEIGHT, CABLE, DUMBBELL, KETTLEBELL, MACHINE, TRX) — fetched from `GET /api/equipment-types` via `useEquipmentTypes()`
- Style toggle always visible below equipment: **Bodybuilding** (default) | **Functional** — independent of equipment selection
- **Always send `training_styles`** with the selected style; send `equipment_types` only when at least one chip is selected
- When both are provided, the API applies **AND logic**
- All selections reset to defaults on every mount/open

## Key Confirmed Facts

| Item | Detail |
|------|--------|
| Chip pattern | `flex-row`, `flex-wrap`, `gap-3`, `TouchableOpacity` — matches existing preset/duration rows |
| Confirmation pattern | `ConfirmDialog` component from `../../components/ui/ConfirmDialog` |
| Modal pattern | React Native `Modal` with `transparent`, `animationType="fade"` — matches edit modal in WorkoutPreviewScreen |
| regeneratePlan call site | `DashboardScreen.tsx` line 251: `regeneratePlan.mutateAsync()` (no args today) |
| generateDraft call site | `GenerateWorkoutScreen.tsx` line 52 |
| generationParams navigation | `navigation.navigate('WorkoutPreview', { sessionId, generationParams })` at line 58 |
| WorkoutPreview route type | `apps/mobile/src/navigation/types.ts` line 32: `{ sessionId: string; generationParams?: RegenerateWorkoutInput }` |
| PlanGeneratingOverlay | Full-screen overlay shown during regeneration — keep as-is |

---

## Phase 1 — GenerateWorkoutScreen UI

**Goal:** Add equipment chip row and style toggle to `GenerateWorkoutScreen.tsx`.

**Read first:** `apps/mobile/src/screens/placeholders/GenerateWorkoutScreen.tsx` in full before editing.  
**Copy pattern from:** existing preset chip row (lines 106-132) and duration button row (lines 145-168) for styling.

### Tasks

#### 1.1 — Add imports

```typescript
import { useEquipmentTypes } from '@fit-nation/shared';
import { ScrollView } from 'react-native'; // if not already imported
```

#### 1.2 — Add state variables (after `selectedDuration` state)

```typescript
const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
const [selectedStyle, setSelectedStyle] = useState<'BODYBUILDING' | 'FUNCTIONAL'>('BODYBUILDING');
```

#### 1.3 — Fetch equipment types

```typescript
const { data: equipmentTypesData } = useEquipmentTypes();
const equipmentTypes = equipmentTypesData?.data ?? [];
```

#### 1.4 — Equipment toggle handler

```typescript
const toggleEquipment = (code: string) => {
  setSelectedEquipment(prev =>
    prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
  );
};
```

#### 1.5 — Update `handleGenerate` (lines 49-69)

Update both the `mutateAsync` call and the `generationParams` passed to navigation:

```typescript
const generationParams = {
  target_regions: preset && preset.targetRegions.length > 0 ? preset.targetRegions : undefined,
  duration_minutes: selectedDuration ?? undefined,
  difficulty: profile?.profile?.training_experience ?? undefined,
  equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
  training_styles: [selectedStyle],
};

const response = await generateDraft.mutateAsync(generationParams);
const sessionId = response.data.id;
navigation.navigate('WorkoutPreview', {
  sessionId: sessionId.toString(),
  generationParams,
});
```

#### 1.6 — Add UI below the duration row (before the generate button)

Add a horizontally scrollable equipment chip row:

```tsx
{/* Equipment */}
<View style={{ marginTop: 16 }}>
  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
    Equipment (optional)
  </Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20 }}>
      {equipmentTypes.map(eq => {
        const isSelected = selectedEquipment.includes(eq.code);
        return (
          <TouchableOpacity
            key={eq.code}
            onPress={() => toggleEquipment(eq.code)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {eq.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </ScrollView>
</View>

{/* Style toggle — always visible */}
<View style={{ marginTop: 16 }}>
  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
    Training Style
  </Text>
  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
    {(['BODYBUILDING', 'FUNCTIONAL'] as const).map(style => {
      const isSelected = selectedStyle === style;
      return (
        <TouchableOpacity
          key={style}
          onPress={() => setSelectedStyle(style)}
          style={[styles.chip, isSelected && styles.chipSelected]}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
            {style === 'BODYBUILDING' ? 'Bodybuilding' : 'Functional'}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
</View>
```

**Style note:** `styles.chip`, `styles.chipSelected`, `styles.chipText`, `styles.chipTextSelected` should match or extend the existing preset/duration chip styles in the file — do not invent new style names, reuse what's already there.

### Verification
- Equipment chips appear below duration row
- Style toggle is always visible below equipment chips
- `generationParams` logged before navigation always contains `training_styles` and `equipment_types` when chips are selected
- WorkoutPreviewScreen regenerate re-uses those params unchanged

---

## Phase 2 — DashboardScreen: RegeneratePlanModal

**Goal:** Replace the direct `ConfirmDialog` / direct-execute pattern with a new `RegeneratePlanModal` component that shows equipment/style preferences, with an optional warning for plans with completed workouts.

**Read first:** `apps/mobile/src/screens/placeholders/DashboardScreen.tsx` — focus on lines 92-93 (state), 118 (`useRegeneratePlan`), 248-270 (`executeRegenerate` + `handleRefreshClick`), 1010-1018 (`ConfirmDialog`), 1020-1023 (`PlanGeneratingOverlay`).

**Pattern reference for Modal:** `WorkoutPreviewScreen.tsx` edit modal (lines ~448-532) — React Native `Modal` with transparent backdrop and centered card.

### Tasks

#### 2.1 — Create `apps/mobile/src/components/ui/RegeneratePlanModal.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useEquipmentTypes } from '@fit-nation/shared';
import { RegeneratePlanInput } from '@fit-nation/shared';

interface RegeneratePlanModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (params: RegeneratePlanInput) => void;
  showWarning: boolean;
  isLoading: boolean;
}
```

Internal state with reset on open:
```typescript
const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
const [selectedStyle, setSelectedStyle] = useState<'BODYBUILDING' | 'FUNCTIONAL'>('BODYBUILDING');

useEffect(() => {
  if (visible) {
    setSelectedEquipment([]);
    setSelectedStyle('BODYBUILDING');
  }
}, [visible]);
```

On confirm:
```typescript
onConfirm({
  equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
  training_styles: [selectedStyle],
});
```

Modal structure (same pattern as WorkoutPreviewScreen edit modal):
- `Modal` with `visible`, `transparent`, `animationType="fade"`, `statusBarTranslucent`
- TouchableOpacity backdrop (dismiss on tap outside)
- Centered card with:
  - Title: "Refresh Personalized Plan?"
  - Equipment chip row (horizontal ScrollView, same pattern as Phase 1)
  - Style toggle (always visible)
  - Warning text block (when `showWarning` is true):
    ```tsx
    {showWarning && (
      <Text style={{ color: theme.warning, ... }}>
        Your current plan has completed workouts. Refreshing will create a new plan and you will start from scratch.
      </Text>
    )}
    ```
  - Cancel / Confirm button row (match ConfirmDialog button styles)

#### 2.2 — Update `DashboardScreen.tsx`

**State changes:**
- Rename `refreshDialogVisible` → `regenerateModalVisible` (or add new state)
- Remove `showWarning` intermediary — the modal handles this internally via `showWarning` prop

**Update `executeRegenerate` to accept params (lines 248-257):**
```typescript
async function executeRegenerate(params: RegeneratePlanInput) {
  setIsRegenerating(true);
  try {
    await regeneratePlan.mutateAsync(params);
  } catch (e) {
    console.error('Failed to regenerate plan', e);
  } finally {
    setIsRegenerating(false);
    setRegenerateModalVisible(false);
  }
}
```

**Update `handleRefreshClick` (lines 263-270):**
```typescript
function handleRefreshClick() {
  setRegenerateModalVisible(true); // always open modal
}
```
- Remove the `hasCompletedWorkouts` branch — the modal now shows warning text conditionally.
- Any call site that previously called `executeRegenerate()` directly (no-workouts case, "no active program" card, "plan complete" card — lines 266, 472, 537-561) should now call `setRegenerateModalVisible(true)` instead, so preferences are always collected.

**Replace `ConfirmDialog` (lines 1010-1018) with:**
```tsx
<RegeneratePlanModal
  visible={regenerateModalVisible}
  onClose={() => setRegenerateModalVisible(false)}
  onConfirm={executeRegenerate}
  showWarning={hasCompletedWorkouts > 0}
  isLoading={isRegenerating || regeneratePlan.isPending}
/>
```

Keep `PlanGeneratingOverlay` unchanged (lines 1020-1023).

### Verification
- All three "Refresh" entry points (no program card, plan complete card, refresh button) open the modal
- Warning text appears when plan has completed workouts
- Style toggle remains visible regardless of equipment selection
- Confirming calls `regeneratePlan.mutateAsync` with `training_styles` always and `equipment_types` when chips are selected
- `PlanGeneratingOverlay` still appears during regeneration
- Modal resets to defaults on every open

---

## Phase 3 — Final Verification

```bash
# TypeScript clean on mobile
pnpm --filter @fit-nation/mobile tsc --noEmit

# Confirm training_styles wired in mobile
grep -rn "training_styles\|equipment_types" apps/mobile/src/

# Confirm regeneratePlan.mutateAsync now receives params everywhere
grep -n "mutateAsync" apps/mobile/src/screens/placeholders/DashboardScreen.tsx

# WorkoutPreviewScreen unchanged
git diff apps/mobile/src/screens/placeholders/WorkoutPreviewScreen.tsx
```

Manual test checklist:
- [ ] GenerateWorkoutScreen: equipment chips appear below duration row
- [ ] GenerateWorkoutScreen: equipment chips and style toggle both always visible
- [ ] GenerateWorkoutScreen: Functional style generates without error
- [ ] GenerateWorkoutScreen: TRX + Dumbbell generates without error
- [ ] WorkoutPreviewScreen: REGENERATE re-uses original equipment/style
- [ ] DashboardScreen: all three refresh entry points open the modal
- [ ] DashboardScreen modal: warning text shown when plan has completed workouts
- [ ] DashboardScreen modal: confirm regenerates with correct params
- [ ] PlanGeneratingOverlay still appears during regeneration
