# Task: Migrate to React Router

## Priority: 🟢 Later (Architectural)
## Estimated Time: 4-6 hours
## Type: Architecture / UX Improvement

---

## Problem

The app currently uses manual navigation state:

```tsx
const [currentPage, setCurrentPage] = useState<Page>('dashboard');
```

**Issues:**
- Browser back/forward buttons don't work
- No deep linking (users can't bookmark or share specific pages)
- URL doesn't change when navigating
- No code splitting (all pages load upfront)
- Testing is harder without URL-based routing

---

## Solution

### Step 1: Install React Router

```bash
npm install react-router-dom
```

### Step 2: Create Route Configuration

Create `src/routes.tsx`:

```tsx
import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { AuthGuard } from './components/AuthGuard';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CreatePlanPage = lazy(() => import('./pages/CreatePlanPage'));
const EditPlanPage = lazy(() => import('./pages/EditPlanPage'));
const AddWorkoutPage = lazy(() => import('./pages/AddWorkoutPage'));
const EditWorkoutPage = lazy(() => import('./pages/EditWorkoutPage'));
const ManageExercisesPage = lazy(() => import('./pages/ManageExercisesPage'));
const ExercisePickerPage = lazy(() => import('./pages/ExercisePickerPage'));
const ExerciseDetailPage = lazy(() => import('./pages/ExerciseDetailPage'));
const WorkoutSessionPage = lazy(() => import('./pages/WorkoutSessionPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
      Loading...
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'plans',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <PlansPage />
              </Suspense>
            ),
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CreatePlanPage />
              </Suspense>
            ),
          },
          {
            path: ':planId/edit',
            element: (
              <Suspense fallback={<PageLoader />}>
                <EditPlanPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'workouts',
        children: [
          {
            path: 'create',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AddWorkoutPage />
              </Suspense>
            ),
          },
          {
            path: ':templateId/edit',
            element: (
              <Suspense fallback={<PageLoader />}>
                <EditWorkoutPage />
              </Suspense>
            ),
          },
          {
            path: ':templateId/exercises',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ManageExercisesPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'exercises',
        children: [
          {
            path: 'pick',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ExercisePickerPage />
              </Suspense>
            ),
          },
          {
            path: ':exerciseId',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ExerciseDetailPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'session/:sessionId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkoutSessionPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

### Step 3: Create AppLayout Component

Create `src/components/AppLayout.tsx`:

```tsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { IonApp } from '@ionic/react';
import { BottomNav } from './BottomNav';
import { BackgroundGradients } from './BackgroundGradients';
import { useBranding } from '../hooks/useBranding';

export function AppLayout() {
  const location = useLocation();
  
  // Determine current page for bottom nav
  const getCurrentPage = () => {
    if (location.pathname === '/') return 'dashboard';
    if (location.pathname.startsWith('/plans')) return 'plans';
    if (location.pathname.startsWith('/profile')) return 'profile';
    if (location.pathname.startsWith('/session')) return 'plans';
    return 'dashboard';
  };

  return (
    <IonApp>
      <div 
        className="min-h-screen w-full"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          color: 'var(--color-text-primary)',
        }}
      >
        <BackgroundGradients />
        <Outlet />
        <BottomNav currentPage={getCurrentPage()} />
      </div>
    </IonApp>
  );
}
```

### Step 4: Create AuthGuard Component

Create `src/components/AuthGuard.tsx`:

```tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### Step 5: Update App Entry Point

**`src/index.tsx`:**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { router } from './routes';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Step 6: Update BottomNav

**`src/components/BottomNav.tsx`:**

```tsx
import { useNavigate, useLocation } from 'react-router-dom';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentPage = (() => {
    if (location.pathname === '/') return 'dashboard';
    if (location.pathname.startsWith('/plans')) return 'plans';
    if (location.pathname.startsWith('/profile')) return 'profile';
    return 'dashboard';
  })();

  const handlePageChange = (page: string) => {
    switch (page) {
      case 'dashboard':
        navigate('/');
        break;
      case 'plans':
        navigate('/plans');
        break;
      case 'profile':
        navigate('/profile');
        break;
    }
  };

  // ... rest of component using currentPage and handlePageChange
}
```

### Step 7: Update Navigation in Components

Replace `onNavigate` callbacks with `useNavigate`:

**Example - PlansPage:**

```tsx
import { useNavigate } from 'react-router-dom';

export function PlansPage() {
  const navigate = useNavigate();
  
  // Replace callbacks with navigation
  const handleCreatePlan = () => navigate('/plans/create');
  const handleEditPlan = (planId: number) => navigate(`/plans/${planId}/edit`);
  const handleAddWorkout = (planId?: number) => {
    navigate('/workouts/create', { state: { planId } });
  };
  const handleManageExercises = (templateId: number) => {
    navigate(`/workouts/${templateId}/exercises`);
  };
  
  // ... rest of component
}
```

### Step 8: Move Pages to Pages Directory

Restructure:
```
src/
├── components/          # Reusable components
│   ├── AppLayout.tsx
│   ├── AuthGuard.tsx
│   ├── BackgroundGradients.tsx
│   ├── BottomNav.tsx
│   └── ...
├── pages/               # Route pages
│   ├── Dashboard.tsx
│   ├── PlansPage.tsx
│   ├── ProfilePage.tsx
│   ├── CreatePlanPage.tsx
│   └── ...
├── routes.tsx
└── index.tsx
```

---

## URL Structure

| Page | URL |
|------|-----|
| Dashboard | `/` |
| Plans | `/plans` |
| Create Plan | `/plans/create` |
| Edit Plan | `/plans/:planId/edit` |
| Create Workout | `/workouts/create?planId=X` |
| Edit Workout | `/workouts/:templateId/edit` |
| Manage Exercises | `/workouts/:templateId/exercises` |
| Exercise Picker | `/exercises/pick?mode=add` |
| Exercise Detail | `/exercises/:exerciseId` |
| Workout Session | `/session/:sessionId` |
| Profile | `/profile` |
| Login | `/login` |

---

## Validation Steps

1. Browser back/forward buttons work correctly
2. Refreshing the page stays on the same route
3. Deep links work (e.g., `/plans/1/edit` opens edit page)
4. Login redirect works (unauthenticated users go to /login)
5. After login, users are redirected to original destination
6. Code splitting works (check Network tab for lazy-loaded chunks)
7. Bottom nav highlights correct page
8. All navigation flows still work

---

## Migration Strategy

1. **Phase 1:** Set up router infrastructure alongside existing navigation
2. **Phase 2:** Migrate one page at a time, starting with simpler ones (Profile, Plans)
3. **Phase 3:** Migrate complex pages (WorkoutSession, Dashboard)
4. **Phase 4:** Remove old navigation state from App.tsx
5. **Phase 5:** Clean up and test
