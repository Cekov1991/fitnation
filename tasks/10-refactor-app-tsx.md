# Task: Refactor App.tsx (God Component)

## Priority: 🟢 Later
## Estimated Time: 4-6 hours
## Type: Architecture / Maintainability
## Status: ⏸️ BLOCKED - Waiting on Task 08/12 decision

---

## Prerequisites

This task depends on completing one of:
- **Task 08** (React Router) - Phases 3-6, OR
- **Task 12** (Migrate to Ionic Components) - For full native feel

The approach differs significantly based on which path you choose:
- **With Ionic Components:** App.tsx becomes minimal (~50 lines), routing handled by IonTabs
- **Without Ionic Components:** Use Context-based navigation (see "Without Router" section below)

---

## Problem

`App.tsx` is **531 lines** and handles:
- All navigation state (14+ page types)
- All modal states (4+ modals)
- 20+ handler functions
- Multiple data fetching hooks
- Conditional rendering for all pages

**Issues:**
- Every state change re-renders entire app
- Hard to test individual features
- Difficult to understand data flow
- No separation of concerns

---

## Prerequisites

This task is best done **after** Task 08 (React Router migration). If Router isn't implemented, follow the "Without Router" approach below.

---

## Solution (With React Router)

If React Router is implemented, App.tsx becomes minimal:

```tsx
// src/App.tsx
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { BrandingProvider } from './hooks/useBranding';
import { router } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandingProvider>
          <RouterProvider router={router} />
        </BrandingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

That's it! All page logic moves to route components.

---

## Solution (Without Router)

If keeping manual navigation, use Context for navigation and state management:

### Step 1: Create Navigation Context

Create `src/contexts/NavigationContext.tsx`:

```tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Page = 
  | 'dashboard' 
  | 'plans' 
  | 'profile' 
  | 'create-plan' 
  | 'edit-plan' 
  | 'add-workout' 
  | 'edit-workout' 
  | 'manage-exercises' 
  | 'pick-exercise' 
  | 'exercise-detail' 
  | 'workout-session' 
  | 'workout-session-exercise-detail';

interface NavigationState {
  currentPage: Page;
  editingPlan: { id: number; name: string; description: string; isActive: boolean } | null;
  editingWorkout: { templateId?: number; plan: string; name: string; description: string; daysOfWeek: string[] } | null;
  currentWorkoutForExercises: { templateId: number; name: string; description?: string } | null;
  selectedPlanForWorkout: string | undefined;
  exercisePickerMode: 'add' | 'swap';
  selectedExerciseName: string;
  activeSessionId: number | null;
  activeWorkoutName: string;
}

interface NavigationContextType extends NavigationState {
  // Navigation actions
  goToDashboard: () => void;
  goToPlans: () => void;
  goToProfile: () => void;
  goToCreatePlan: () => void;
  goToEditPlan: (plan: NavigationState['editingPlan']) => void;
  goToAddWorkout: (planName?: string) => void;
  goToEditWorkout: (workout: NavigationState['editingWorkout']) => void;
  goToManageExercises: (workout: NonNullable<NavigationState['currentWorkoutForExercises']>) => void;
  goToExercisePicker: (mode: 'add' | 'swap') => void;
  goToExerciseDetail: (exerciseName: string) => void;
  goToWorkoutSession: (sessionId: number, workoutName: string) => void;
  goToWorkoutSessionExerciseDetail: (exerciseName: string) => void;
  goBack: () => void;
  
  // State setters for complex flows
  clearEditingState: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const initialState: NavigationState = {
  currentPage: 'dashboard',
  editingPlan: null,
  editingWorkout: null,
  currentWorkoutForExercises: null,
  selectedPlanForWorkout: undefined,
  exercisePickerMode: 'add',
  selectedExerciseName: '',
  activeSessionId: null,
  activeWorkoutName: '',
};

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavigationState>(initialState);
  const [history, setHistory] = useState<Page[]>(['dashboard']);

  const navigateTo = useCallback((page: Page, updates: Partial<NavigationState> = {}) => {
    setState(prev => ({ ...prev, currentPage: page, ...updates }));
    setHistory(prev => [...prev, page]);
  }, []);

  const goBack = useCallback(() => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const previousPage = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setState(prev => ({ ...prev, currentPage: previousPage }));
  }, [history]);

  const value: NavigationContextType = {
    ...state,
    goToDashboard: () => navigateTo('dashboard'),
    goToPlans: () => navigateTo('plans'),
    goToProfile: () => navigateTo('profile'),
    goToCreatePlan: () => navigateTo('create-plan'),
    goToEditPlan: (plan) => navigateTo('edit-plan', { editingPlan: plan }),
    goToAddWorkout: (planName) => navigateTo('add-workout', { selectedPlanForWorkout: planName }),
    goToEditWorkout: (workout) => navigateTo('edit-workout', { editingWorkout: workout }),
    goToManageExercises: (workout) => navigateTo('manage-exercises', { currentWorkoutForExercises: workout }),
    goToExercisePicker: (mode) => navigateTo('pick-exercise', { exercisePickerMode: mode }),
    goToExerciseDetail: (name) => navigateTo('exercise-detail', { selectedExerciseName: name }),
    goToWorkoutSession: (sessionId, workoutName) => navigateTo('workout-session', { activeSessionId: sessionId, activeWorkoutName: workoutName }),
    goToWorkoutSessionExerciseDetail: (name) => navigateTo('workout-session-exercise-detail', { selectedExerciseName: name }),
    goBack,
    clearEditingState: () => setState(prev => ({
      ...prev,
      editingPlan: null,
      editingWorkout: null,
      currentWorkoutForExercises: null,
      selectedPlanForWorkout: undefined,
    })),
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
```

### Step 2: Create Modals Context

Create `src/contexts/ModalsContext.tsx`:

```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalsState {
  isStrengthModalOpen: boolean;
  isBalanceModalOpen: boolean;
  isProgressModalOpen: boolean;
  isWorkoutSelectionOpen: boolean;
}

interface ModalsContextType extends ModalsState {
  openStrengthModal: () => void;
  closeStrengthModal: () => void;
  openBalanceModal: () => void;
  closeBalanceModal: () => void;
  openProgressModal: () => void;
  closeProgressModal: () => void;
  openWorkoutSelection: () => void;
  closeWorkoutSelection: () => void;
}

const ModalsContext = createContext<ModalsContextType | undefined>(undefined);

export function ModalsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalsState>({
    isStrengthModalOpen: false,
    isBalanceModalOpen: false,
    isProgressModalOpen: false,
    isWorkoutSelectionOpen: false,
  });

  const value: ModalsContextType = {
    ...state,
    openStrengthModal: () => setState(s => ({ ...s, isStrengthModalOpen: true })),
    closeStrengthModal: () => setState(s => ({ ...s, isStrengthModalOpen: false })),
    openBalanceModal: () => setState(s => ({ ...s, isBalanceModalOpen: true })),
    closeBalanceModal: () => setState(s => ({ ...s, isBalanceModalOpen: false })),
    openProgressModal: () => setState(s => ({ ...s, isProgressModalOpen: true })),
    closeProgressModal: () => setState(s => ({ ...s, isProgressModalOpen: false })),
    openWorkoutSelection: () => setState(s => ({ ...s, isWorkoutSelectionOpen: true })),
    closeWorkoutSelection: () => setState(s => ({ ...s, isWorkoutSelectionOpen: false })),
  };

  return (
    <ModalsContext.Provider value={value}>
      {children}
    </ModalsContext.Provider>
  );
}

export function useModals() {
  const context = useContext(ModalsContext);
  if (!context) {
    throw new Error('useModals must be used within ModalsProvider');
  }
  return context;
}
```

### Step 3: Create Page Router Component

Create `src/components/PageRouter.tsx`:

```tsx
import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { Dashboard } from '../pages/Dashboard';
import { PlansPage } from '../pages/PlansPage';
import { ProfilePage } from '../pages/ProfilePage';
import { CreatePlanPage } from '../pages/CreatePlanPage';
// ... other imports

export function PageRouter() {
  const { currentPage, ...navState } = useNavigation();

  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'plans':
      return <PlansPage />;
    case 'profile':
      return <ProfilePage />;
    case 'create-plan':
      return <CreatePlanPage />;
    case 'edit-plan':
      return navState.editingPlan ? <EditPlanPage plan={navState.editingPlan} /> : null;
    case 'add-workout':
      return <AddWorkoutPage planName={navState.selectedPlanForWorkout} />;
    case 'edit-workout':
      return navState.editingWorkout ? <EditWorkoutPage workout={navState.editingWorkout} /> : null;
    case 'manage-exercises':
      return navState.currentWorkoutForExercises ? (
        <ManageExercisesPage workout={navState.currentWorkoutForExercises} />
      ) : null;
    case 'pick-exercise':
      return <ExercisePickerPage mode={navState.exercisePickerMode} />;
    case 'exercise-detail':
    case 'workout-session-exercise-detail':
      return <ExerciseDetailPage exerciseName={navState.selectedExerciseName} />;
    case 'workout-session':
      return navState.activeSessionId ? (
        <WorkoutSessionPage 
          sessionId={navState.activeSessionId} 
          workoutName={navState.activeWorkoutName} 
        />
      ) : null;
    default:
      return <Dashboard />;
  }
}
```

### Step 4: Simplify App.tsx

```tsx
import React from 'react';
import { IonApp } from '@ionic/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { BrandingProvider } from './hooks/useBranding';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { ModalsProvider, useModals } from './contexts/ModalsContext';
import { PageRouter } from './components/PageRouter';
import { BottomNav } from './components/BottomNav';
import { BackgroundGradients } from './components/BackgroundGradients';
import { GlobalModals } from './components/GlobalModals';
import { LoginPage } from './pages/LoginPage';

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();
  const { currentPage } = useNavigation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const getBottomNavPage = () => {
    const hiddenNavPages = ['create-plan', 'edit-plan', 'add-workout', 'edit-workout', 'manage-exercises', 'pick-exercise', 'exercise-detail', 'workout-session', 'workout-session-exercise-detail'];
    if (hiddenNavPages.includes(currentPage)) return 'plans';
    return currentPage;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <PageRouter />
      <BottomNav currentPage={getBottomNavPage()} />
      <GlobalModals />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandingProvider>
          <NavigationProvider>
            <ModalsProvider>
              <IonApp>
                <AppContent />
              </IonApp>
            </ModalsProvider>
          </NavigationProvider>
        </BrandingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## Step 5: Update Page Components

Each page component now uses hooks instead of props:

**Before (PlansPage.tsx):**
```tsx
export function PlansPage({
  onNavigateToCreate,
  onNavigateToEdit,
  onNavigateToAddWorkout,
  // ... 5 more callbacks
}: PlansPageProps) {
```

**After:**
```tsx
import { useNavigation } from '../contexts/NavigationContext';

export function PlansPage() {
  const { 
    goToCreatePlan, 
    goToEditPlan, 
    goToAddWorkout,
    goToEditWorkout,
    goToManageExercises 
  } = useNavigation();
  
  // ... use these directly
}
```

---

## Final Structure

```
src/
├── App.tsx                    # ~50 lines - Provider composition
├── contexts/
│   ├── NavigationContext.tsx  # Navigation state & actions
│   └── ModalsContext.tsx      # Modal state & actions
├── components/
│   ├── PageRouter.tsx         # Page rendering switch
│   ├── BottomNav.tsx
│   ├── GlobalModals.tsx       # All modal components
│   └── ...
├── pages/
│   ├── Dashboard.tsx
│   ├── PlansPage.tsx
│   └── ...
└── hooks/
    ├── useAuth.tsx
    └── useBranding.tsx
```

---

## Validation Steps

1. All navigation still works
2. Modals open/close correctly
3. Back navigation works
4. State persists when navigating between pages
5. No unnecessary re-renders (check with React DevTools Profiler)
6. Login/logout flow works
7. All CRUD operations still function
