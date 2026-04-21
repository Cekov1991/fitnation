import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

// Auth stack
export type AuthStackParamList = {
  Login: undefined
  Register: { invitationToken?: string }
  ForgotPassword: undefined
  ResetPassword: { token?: string; email?: string }
}

// Bottom tabs
export type TabParamList = {
  Dashboard: undefined
  Plans: undefined
  Progress: undefined
  Exercises: undefined
  Profile: undefined
}

// Main app stack (full-screen screens, no bottom tabs)
export type AppStackParamList = {
  Tabs: undefined
  Onboarding: undefined
  WorkoutSession: { sessionId: string }
  WorkoutSessionExerciseDetail: { sessionId: string; exerciseName: string }
  GenerateWorkout: undefined
  WorkoutPreview: { sessionId: string }
  WorkoutPreviewExercisePicker: { sessionId: string; swapExerciseId?: number }
  ExercisePicker: { templateId?: number } | undefined
  ExerciseDetail: { exerciseName: string }
  ExerciseCatalog: undefined
  CreatePlan: undefined
  EditPlan: { planId: number }
  CreateWorkout: undefined
  EditWorkout: { templateId: number }
  ManageExercises: { templateId: number }
  ProgramLibrary: undefined
  ProgramDetail: { programId: number }
  RoutineDetail: { routineId: number }
  RoutineWorkoutDetail: { routineId: number; workoutId: number }
  SessionDetail: { sessionId: string }
}

// Screen prop helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>
