import React, { Suspense } from 'react';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { OnboardingFlow } from './components/onboarding';
import { AuthGuard } from './components/AuthGuard';
import { RouteSuspenseFallback } from './components/ui/RouteSuspenseFallback';
import { AuthenticatedLayout } from './route-wrappers/AuthenticatedLayout';

// Eagerly imported skeletons — tiny pure-UI components, no need to lazy-load them.
// These are used as Suspense fallbacks so they must be available before the route
// chunk downloads.
import { ProgramDashboardSkeleton } from './components/dashboard/ProgramDashboardSkeleton';
import { ProfilePageSkeleton } from './components/ProfilePageSkeleton';
import { ProgressCalendarSkeleton } from './components/ProgressPageSkeleton';
import { SessionDetailPageSkeleton } from './components/SessionDetailPageSkeleton';
import { ProgramDetailPageSkeleton } from './components/plans/ProgramDetailPageSkeleton';
import { ProgramLibraryPageSkeleton } from './components/plans/ProgramLibraryPageSkeleton';
import { BrowsableRoutineDetailPageSkeleton } from './components/plans/BrowsableRoutineDetailPageSkeleton';
import { RoutineWorkoutDetailPageSkeleton } from './components/plans/RoutineWorkoutDetailPageSkeleton';
import { EditWorkoutPageSkeleton } from './components/EditWorkoutPageSkeleton';
import { WorkoutPreviewPageSkeleton } from './components/WorkoutPreviewPageSkeleton';
import { ExercisePickerPageSkeleton } from './components/ExercisePickerPageSkeleton';

// Lazy load all route wrappers for code-splitting
const ProfilePageWrapper = React.lazy(() => import('./route-wrappers/ProfilePageWrapper'));
const ProgressPageWrapper = React.lazy(() => import('./route-wrappers/ProgressPageWrapper'));
const DashboardPageWrapper = React.lazy(() => import('./route-wrappers/DashboardPageWrapper'));
const GenerateWorkoutPageWrapper = React.lazy(() => import('./route-wrappers/GenerateWorkoutPageWrapper'));
const WorkoutPreviewPageWrapper = React.lazy(() => import('./route-wrappers/WorkoutPreviewPageWrapper'));
const WorkoutPreviewExercisePickerWrapper = React.lazy(() => import('./route-wrappers/WorkoutPreviewExercisePickerWrapper'));
const ProgramLibraryPageWrapper = React.lazy(() => import('./route-wrappers/ProgramLibraryPageWrapper'));
const ProgramDetailPageWrapper = React.lazy(() => import('./route-wrappers/ProgramDetailPageWrapper'));
const BrowsableRoutineDetailPageWrapper = React.lazy(() => import('./route-wrappers/BrowsableRoutineDetailPageWrapper'));
const RoutineWorkoutDetailPageWrapper = React.lazy(() => import('./route-wrappers/RoutineWorkoutDetailPageWrapper'));
const ExerciseDetailPageWrapper = React.lazy(() => import('./route-wrappers/ExerciseDetailPageWrapper'));
const ExerciseCatalogPageWrapper = React.lazy(() => import('./route-wrappers/ExerciseCatalogPageWrapper'));
const ExercisePickerPageWrapper = React.lazy(() => import('./route-wrappers/ExercisePickerPageWrapper'));
const PlansPageWrapper = React.lazy(() => import('./route-wrappers/PlansPageWrapper'));
const CreatePlanPageWrapper = React.lazy(() => import('./route-wrappers/CreatePlanPageWrapper'));
const EditPlanPageWrapper = React.lazy(() => import('./route-wrappers/EditPlanPageWrapper'));
const CreateWorkoutPageWrapper = React.lazy(() => import('./route-wrappers/CreateWorkoutPageWrapper'));
const EditWorkoutPageWrapper = React.lazy(() => import('./route-wrappers/EditWorkoutPageWrapper'));
const ManageExercisesPageWrapper = React.lazy(() => import('./route-wrappers/ManageExercisesPageWrapper'));
const WorkoutSessionPageWrapper = React.lazy(() => import('./route-wrappers/WorkoutSessionPageWrapper'));
const WorkoutSessionExerciseDetailPageWrapper = React.lazy(() => import('./route-wrappers/WorkoutSessionExerciseDetailPageWrapper'));
const SessionDetailPageWrapper = React.lazy(() => import('./route-wrappers/SessionDetailPageWrapper'));

/** Wraps a lazy page in its own Suspense with a page-specific fallback skeleton.
 *  The outer global Suspense (below) is a safety net for anything not covered here. */
function S({ fallback, children }: { fallback: React.ReactNode; children: React.ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * Phase 2: Individual page routes
 *
 * Using Switch instead of IonRouterOutlet to avoid z-index stacking context issues
 * with fixed elements like BottomNav and modals.
 *
 * Once all pages are migrated, we can switch back to IonRouterOutlet for
 * native page transitions.
 */
export function AppRoutes() {
  return (
    <BrowserRouter>
      {/* Outer Suspense is a safety net for any unhandled lazy boundary */}
      <Suspense fallback={<RouteSuspenseFallback />}>
        <Switch>
          {/* ── Public routes (not lazy, no Suspense needed) ── */}

          <Route exact path="/login">
            <LoginPage />
          </Route>

          <Route exact path="/register">
            <RegisterPage />
          </Route>

          <Route exact path="/forgot-password">
            <ForgotPasswordPage />
          </Route>

          <Route exact path="/reset-password">
            <ResetPasswordPage />
          </Route>
          <Route exact path="/reset-password/:token">
            <ResetPasswordPage />
          </Route>

          <Route exact path="/onboarding">
            <AuthGuard>
              <OnboardingFlow />
            </AuthGuard>
          </Route>

          {/* ── Authenticated routes — each wrapped with its own Suspense ── */}

          <Route exact path="/profile">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<ProfilePageSkeleton />}>
                  <ProfilePageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/progress">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<ProgressCalendarSkeleton />}>
                  <ProgressPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/plans">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<RouteSuspenseFallback />}>
                  <PlansPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/plans/create">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<RouteSuspenseFallback />}>
                  <CreatePlanPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/plans/:planId/edit">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<RouteSuspenseFallback />}>
                  <EditPlanPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/programs/library">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<ProgramLibraryPageSkeleton />}>
                  <ProgramLibraryPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/programs/:programId">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<ProgramDetailPageSkeleton />}>
                  <ProgramDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/routines/:routineId">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<BrowsableRoutineDetailPageSkeleton />}>
                  <BrowsableRoutineDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/routines/:routineId/workouts/:workoutId">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<RoutineWorkoutDetailPageSkeleton />}>
                  <RoutineWorkoutDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/create">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<RouteSuspenseFallback />}>
                  <CreateWorkoutPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/:templateId/edit">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<EditWorkoutPageSkeleton />}>
                  <EditWorkoutPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/:templateId/exercises">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<EditWorkoutPageSkeleton />}>
                  <ManageExercisesPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/exercises">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<ExercisePickerPageSkeleton isBrowse />}>
                  <ExerciseCatalogPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/exercises/pick">
            <AuthGuard>
              <S fallback={<ExercisePickerPageSkeleton />}>
                <ExercisePickerPageWrapper />
              </S>
            </AuthGuard>
          </Route>

          <Route exact path="/exercises/:exerciseName">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<RouteSuspenseFallback />}>
                  <ExerciseDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/generate-workout">
            <AuthGuard>
              <S fallback={<RouteSuspenseFallback />}>
                <GenerateWorkoutPageWrapper />
              </S>
            </AuthGuard>
          </Route>

          {/* Workout preview picker (must be before preview so /pick matches) */}
          <Route exact path="/generate-workout/preview/:sessionId/pick">
            <AuthGuard>
              <S fallback={<ExercisePickerPageSkeleton />}>
                <WorkoutPreviewExercisePickerWrapper />
              </S>
            </AuthGuard>
          </Route>

          <Route exact path="/generate-workout/preview/:sessionId">
            <AuthGuard>
              <S fallback={<WorkoutPreviewPageSkeleton />}>
                <WorkoutPreviewPageWrapper />
              </S>
            </AuthGuard>
          </Route>

          {/* Dashboard — default tab is Programs */}
          <Route exact path="/">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<ProgramDashboardSkeleton />}>
                  <DashboardPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/dashboard">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<ProgramDashboardSkeleton />}>
                  <DashboardPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          {/* Past session summary (must not use /session/:id — that is the live workout) */}
          <Route exact path="/sessions/:sessionId">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={<SessionDetailPageSkeleton />}>
                  <SessionDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/session/:sessionId">
            <AuthGuard>
              <S fallback={<RouteSuspenseFallback />}>
                <WorkoutSessionPageWrapper />
              </S>
            </AuthGuard>
          </Route>

          <Route exact path="/session/:sessionId/exercise/:exerciseName">
            <AuthGuard>
              <S fallback={<RouteSuspenseFallback />}>
                <WorkoutSessionExerciseDetailPageWrapper />
              </S>
            </AuthGuard>
          </Route>
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}
