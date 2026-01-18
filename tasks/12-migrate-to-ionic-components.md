# Task: Migrate to Native Ionic Components

## Priority: 🟡 Medium (Architectural Decision)
## Estimated Time: 2-4 hours (incremental)
## Type: Architecture / Native UX Improvement

---

## Context

We started migrating to React Router (task 08) but ran into z-index stacking issues because we're mixing:
- **Custom components** (BottomNav with Framer Motion, custom modals)
- **Ionic's navigation system** (IonPage, IonContent, IonRouterOutlet)

The z-index workaround (setting 10000+ on modals) works but is fighting against Ionic's design.

---

## Problem

Ionic's components manage their own z-index stacking internally. When we use custom fixed elements (BottomNav, Framer Motion modals), they don't participate in Ionic's system, causing:
- Content scrolling over fixed elements
- Modals appearing behind other content
- Click events not reaching the nav

---

## Solution: Incremental Migration to Ionic Components

Migrate custom components to Ionic equivalents **one at a time** so we can:
1. See how each change looks/feels
2. Ensure styling matches current design
3. Easily revert if something doesn't work

### Key Principle: Ionic is Highly Customizable

Ionic components use CSS variables that can be overridden. We won't lose our custom styling - we'll just apply it via CSS variables instead of Tailwind classes.

---

## Phase 1: Migrate BottomNav to IonTabs (Start Here)

### Current Implementation
- Custom `<div>` with `position: fixed`
- Framer Motion for indicator animation
- Lucide icons
- Manual z-index management

### Target Implementation
- `IonTabs` + `IonTabBar` + `IonTabButton`
- Native tab switching with proper stacking
- Ionicons (or keep Lucide via custom approach)

### Step 1.1: Add IonTabs Structure

Update `src/routes.tsx`:

```tsx
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import { home, clipboard, barChart, person } from 'ionicons/icons';

// Import page components...

export function AppRoutes() {
  return (
    <IonApp>
      <IonReactRouter>
        {/* Public routes outside tabs */}
        <Route exact path="/login">
          <LoginPage />
        </Route>

        {/* Authenticated routes with tabs */}
        <Route path="/">
          <AuthGuard>
            <IonTabs>
              <IonRouterOutlet>
                <Route exact path="/dashboard" component={Dashboard} />
                <Route exact path="/plans" component={PlansPage} />
                <Route exact path="/progress" component={ProgressPage} />
                <Route exact path="/profile" component={ProfilePage} />
                
                {/* Sub-routes (no tab change) */}
                <Route exact path="/plans/create" component={CreatePlanPage} />
                <Route exact path="/plans/:planId/edit" component={CreatePlanPage} />
                <Route exact path="/workouts/create" component={AddWorkoutPage} />
                {/* ... more sub-routes */}
                
                <Redirect exact from="/" to="/dashboard" />
              </IonRouterOutlet>

              <IonTabBar slot="bottom">
                <IonTabButton tab="dashboard" href="/dashboard">
                  <IonIcon icon={home} />
                  <IonLabel>Dashboard</IonLabel>
                </IonTabButton>
                <IonTabButton tab="plans" href="/plans">
                  <IonIcon icon={clipboard} />
                  <IonLabel>Plans</IonLabel>
                </IonTabButton>
                <IonTabButton tab="progress" href="/progress">
                  <IonIcon icon={barChart} />
                  <IonLabel>Progress</IonLabel>
                </IonTabButton>
                <IonTabButton tab="profile" href="/profile">
                  <IonIcon icon={person} />
                  <IonLabel>Profile</IonLabel>
                </IonTabButton>
              </IonTabBar>
            </IonTabs>
          </AuthGuard>
        </Route>
      </IonReactRouter>
    </IonApp>
  );
}
```

### Step 1.2: Style IonTabBar to Match Current Design

Add to `src/index.css`:

```css
/* ============================================
   Custom IonTabBar Styling
   ============================================ */

/* Tab bar container - match current BottomNav */
ion-tab-bar {
  --background: var(--color-bg-modal);
  --border: none;
  
  /* Custom styling to match current design */
  position: relative;
  margin: 0 1rem 1rem 1rem;
  padding: 0.5rem;
  border-radius: 1rem;
  border: 1px solid var(--color-border);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  
  /* Backdrop blur */
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

/* Tab buttons */
ion-tab-button {
  --color: var(--color-text-muted);
  --color-selected: var(--color-primary);
  --color-focused: var(--color-text-secondary);
  --background: transparent;
  --background-focused: rgba(255, 255, 255, 0.05);
  --ripple-color: transparent;
  --padding-top: 0.75rem;
  --padding-bottom: 0.75rem;
  
  font-size: 10px;
  font-weight: 500;
  border-radius: 0.75rem;
  transition: background-color 0.2s ease;
}

ion-tab-button:hover {
  --background: rgba(255, 255, 255, 0.05);
}

ion-tab-button.tab-selected {
  --background: rgba(255, 255, 255, 0.05);
}

/* Tab icons */
ion-tab-button ion-icon {
  font-size: 24px;
}

/* Tab labels */
ion-tab-button ion-label {
  margin-top: 0.25rem;
  text-transform: none;
  letter-spacing: 0;
}
```

### Step 1.3: Install Ionicons

```bash
npm install ionicons
```

### Step 1.4: Remove Old BottomNav

Once IonTabBar is working:
1. Delete `src/components/BottomNav.tsx`
2. Remove BottomNav imports from `App.tsx` and `routes.tsx`
3. Remove the z-index workaround CSS

### Step 1.5: Test and Validate

- [ ] Tab bar appears at bottom
- [ ] Styling matches current design (blur, rounded corners, colors)
- [ ] Tab switching works
- [ ] Active tab is highlighted
- [ ] No z-index issues with page content
- [ ] Modals appear correctly above tab bar

### Revert Plan

If IonTabBar doesn't work out:
1. Restore `src/components/BottomNav.tsx` from git
2. Restore previous `routes.tsx`
3. Keep the z-index workaround

---

## Phase 2: Migrate One Modal to IonModal

### Target: WorkoutSelectionModal

This is a good test case because:
- It's a bottom sheet style modal
- Has complex content (list of workouts)
- Currently uses Framer Motion

### Implementation

```tsx
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem } from '@ionic/react';

function WorkoutSelectionModal({ isOpen, onClose, onSelectTemplate }) {
  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose}
      initialBreakpoint={0.85}
      breakpoints={[0, 0.5, 0.85]}
      className="workout-selection-modal"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Choose Workout</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Modal content */}
      </IonContent>
    </IonModal>
  );
}
```

### Custom Styling for IonModal

```css
/* Workout selection modal */
.workout-selection-modal {
  --background: var(--color-bg-modal);
  --border-radius: 1.5rem 1.5rem 0 0;
}

.workout-selection-modal ion-toolbar {
  --background: var(--color-bg-modal);
  --color: var(--color-text-primary);
  --border-color: var(--color-border);
}

.workout-selection-modal ion-content {
  --background: var(--color-bg-modal);
}
```

---

## Phase 3: Enable IonRouterOutlet Page Transitions

Once TabBar and modals work, enable native page transitions:

```tsx
<IonRouterOutlet animated={true}>
  {/* Routes */}
</IonRouterOutlet>
```

This gives you:
- iOS-style slide transitions
- Android-style fade transitions
- Swipe-to-go-back gesture on iOS
- Proper view stacking (previous page stays in DOM)

---

## Phase 4: Migrate Remaining Modals

Convert one at a time:
1. `StrengthScoreModal` → `IonModal`
2. `BalanceModal` → `IonModal`
3. `WeeklyProgressModal` → `IonModal`
4. `PlanMenu` → `IonActionSheet` (better for menu-style)
5. `WorkoutMenu` → `IonActionSheet`
6. `ExerciseEditMenu` → `IonActionSheet`
7. `EditSetsRepsModal` → `IonModal`

---

## Phase 5: Cleanup

1. Remove z-index workarounds from `index.css`
2. Remove Framer Motion AnimatePresence from modals
3. Remove custom fixed positioning CSS
4. Final testing on all flows

---

## Alternative: Keep Current Approach

If after Phase 1 you decide Ionic components don't fit your vision:

1. Keep current custom components
2. Keep z-index workarounds
3. Accept no native page transitions
4. Continue with React Router `Switch` (not `IonRouterOutlet`)

This is a valid choice if:
- You prioritize custom animations over native feel
- You don't plan to ship as a native app
- The z-index workaround is acceptable

---

## Decision Points

After each phase, evaluate:

| Question | If Yes | If No |
|----------|--------|-------|
| Does it look as good as before? | Continue | Revert & stop |
| Is the code cleaner? | Continue | Consider alternatives |
| Do gestures/transitions feel native? | Continue | May not need native feel |
| Is it worth the migration effort? | Continue | Stop here |

---

## Files to Modify

### Phase 1
- `src/routes.tsx` - Add IonTabs structure
- `src/index.css` - Add IonTabBar styles
- `src/components/BottomNav.tsx` - Delete after migration
- `src/App.tsx` - Remove BottomNav usage

### Phase 2+
- Individual modal components
- `src/index.css` - Modal styles

---

## Resources

- [Ionic Tab Bar Docs](https://ionicframework.com/docs/api/tab-bar)
- [Ionic Modal Docs](https://ionicframework.com/docs/api/modal)
- [Ionic CSS Variables](https://ionicframework.com/docs/theming/css-variables)
- [Ionic Action Sheet](https://ionicframework.com/docs/api/action-sheet)
