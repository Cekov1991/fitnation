import React, { Suspense } from 'react';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { EmailVerificationPage } from './components/EmailVerificationPage';
import { OnboardingFlow } from './components/onboarding';
import { AuthGuard } from './components/AuthGuard';
import { AuthenticatedLayout } from './route-wrappers/AuthenticatedLayout';
import { ProgramDashboardSkeleton } from './components/dashboard/ProgramDashboardSkeleton';

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

/** Per-route lazy boundary. Dashboard keeps a skeleton while the chunk loads; all other routes use null to avoid double-skeleton with in-page data loading. */
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
      <Suspense fallback={null}>
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

          <Route exact path="/verify-email">
            <AuthGuard>
              <EmailVerificationPage />
            </AuthGuard>
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
                <S fallback={null}>
                  <ProfilePageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/progress">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <ProgressPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/plans">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <PlansPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/plans/create">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <CreatePlanPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/plans/:planId/edit">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <EditPlanPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/programs/library">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <ProgramLibraryPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/programs/:programId">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <ProgramDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/routines/:routineId">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <BrowsableRoutineDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/routines/:routineId/workouts/:workoutId">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <RoutineWorkoutDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/create">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <CreateWorkoutPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/:templateId/edit">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <EditWorkoutPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/:templateId/exercises">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <ManageExercisesPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/exercises">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <ExerciseCatalogPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/exercises/pick">
            <AuthGuard>
              <S fallback={null}>
                <ExercisePickerPageWrapper />
              </S>
            </AuthGuard>
          </Route>

          <Route exact path="/exercises/:exerciseName">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <ExerciseDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/generate-workout">
            <AuthGuard>
              <S fallback={null}>
                <GenerateWorkoutPageWrapper />
              </S>
            </AuthGuard>
          </Route>

          {/* Workout preview picker (must be before preview so /pick matches) */}
          <Route exact path="/generate-workout/preview/:sessionId/pick">
            <AuthGuard>
              <S fallback={null}>
                <WorkoutPreviewExercisePickerWrapper />
              </S>
            </AuthGuard>
          </Route>

          <Route exact path="/generate-workout/preview/:sessionId">
            <AuthGuard>
              <S fallback={null}>
                <WorkoutPreviewPageWrapper />
              </S>
            </AuthGuard>
          </Route>

          {/* Dashboard — only route that shows a chunk-load skeleton */}
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

          <Route exact path="/sessions/:sessionId">
            <AuthGuard>
              <AuthenticatedLayout>
                <S fallback={null}>
                  <SessionDetailPageWrapper />
                </S>
              </AuthenticatedLayout>
            </AuthGuard>
          </Route>

          <Route exact path="/session/:sessionId">
            <AuthGuard>
              <S fallback={null}>
                <WorkoutSessionPageWrapper />
              </S>
            </AuthGuard>
          </Route>

          <Route exact path="/session/:sessionId/exercise/:exerciseName">
            <AuthGuard>
              <S fallback={null}>
                <WorkoutSessionExerciseDetailPageWrapper />
              </S>
            </AuthGuard>
          </Route>
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}
