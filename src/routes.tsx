import React, { Suspense } from 'react';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { OnboardingFlow } from './components/onboarding';
import { AuthGuard } from './components/AuthGuard';

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

// Simple loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
    </div>
  );
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
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          {/* Login route - public */}
          <Route exact path="/login">
            <LoginPage />
          </Route>

          {/* Register route - public */}
          <Route exact path="/register">
            <RegisterPage />
          </Route>

          {/* Forgot password - public */}
          <Route exact path="/forgot-password">
            <ForgotPasswordPage />
          </Route>

          {/* Reset password - public (token/email from state, query, or path: /reset-password/:token?email=...) */}
          <Route exact path="/reset-password">
            <ResetPasswordPage />
          </Route>
          <Route exact path="/reset-password/:token">
            <ResetPasswordPage />
          </Route>

          {/* Onboarding route - protected */}
          <Route exact path="/onboarding">
            <AuthGuard>
              <OnboardingFlow />
            </AuthGuard>
          </Route>

          {/* Profile page - migrated to router */}
          <Route exact path="/profile">
            <AuthGuard>
              <ProfilePageWrapper />
            </AuthGuard>
          </Route>

          {/* Progress page - migrated to router */}
          <Route exact path="/progress">
            <AuthGuard>
              <ProgressPageWrapper />
            </AuthGuard>
          </Route>

          {/* Plans routes - migrated to router */}
          <Route exact path="/plans">
            <AuthGuard>
              <PlansPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/plans/create">
            <AuthGuard>
              <CreatePlanPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/plans/:planId/edit">
            <AuthGuard>
              <EditPlanPageWrapper />
            </AuthGuard>
          </Route>

          {/* Program routes */}
          <Route exact path="/programs/library">
            <AuthGuard>
              <ProgramLibraryPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/programs/:programId">
            <AuthGuard>
              <ProgramDetailPageWrapper />
            </AuthGuard>
          </Route>

          {/* Browsable Routines routes */}
          <Route exact path="/routines/:routineId">
            <AuthGuard>
              <BrowsableRoutineDetailPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/routines/:routineId/workouts/:workoutId">
            <AuthGuard>
              <RoutineWorkoutDetailPageWrapper />
            </AuthGuard>
          </Route>

          {/* Workout routes - migrated to router */}
          <Route exact path="/workouts/create">
            <AuthGuard>
              <CreateWorkoutPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/:templateId/edit">
            <AuthGuard>
              <EditWorkoutPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/workouts/:templateId/exercises">
            <AuthGuard>
              <ManageExercisesPageWrapper />
            </AuthGuard>
          </Route>

          {/* Exercise routes - migrated to router */}
          <Route exact path="/exercises">
            <AuthGuard>
              <ExerciseCatalogPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/exercises/pick">
            <AuthGuard>
              <ExercisePickerPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/exercises/:exerciseName">
            <AuthGuard>
              <ExerciseDetailPageWrapper />
            </AuthGuard>
          </Route>

          {/* Generate workout route */}
          <Route exact path="/generate-workout">
            <AuthGuard>
              <GenerateWorkoutPageWrapper />
            </AuthGuard>
          </Route>

          {/* Workout preview picker (must be before preview so /pick matches) */}
          <Route exact path="/generate-workout/preview/:sessionId/pick">
            <AuthGuard>
              <WorkoutPreviewExercisePickerWrapper />
            </AuthGuard>
          </Route>

          {/* Workout preview route */}
          <Route exact path="/generate-workout/preview/:sessionId">
            <AuthGuard>
              <WorkoutPreviewPageWrapper />
            </AuthGuard>
          </Route>

          {/* Dashboard route - migrated to router */}
          <Route exact path="/">
            <AuthGuard>
              <DashboardPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/dashboard">
            <AuthGuard>
              <DashboardPageWrapper />
            </AuthGuard>
          </Route>

          {/* Past session summary (must not use /session/:id — that is the live workout) */}
          <Route exact path="/sessions/:sessionId">
            <AuthGuard>
              <SessionDetailPageWrapper />
            </AuthGuard>
          </Route>

          {/* Workout session routes - migrated to router */}
          <Route exact path="/session/:sessionId">
            <AuthGuard>
              <WorkoutSessionPageWrapper />
            </AuthGuard>
          </Route>

          <Route exact path="/session/:sessionId/exercise/:exerciseName">
            <AuthGuard>
              <WorkoutSessionExerciseDetailPageWrapper />
            </AuthGuard>
          </Route>
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
}
