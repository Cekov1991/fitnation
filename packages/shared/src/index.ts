// Config
export { initApi, getConfig } from './config'
export { initAuth, getAuthStorage, setOnUnauthorized, AUTH_TOKEN_KEY, PARTNER_SLUG_KEY } from './auth'
export type { AuthStorage } from './auth'

// API
export { api, authApi, partnersApi, profileApi, onboardingApi, devicesApi, notificationSettingsApi, exercisesApi, muscleGroupsApi, categoriesApi, classificationsApi, metricsApi, plansApi, programsApi, routinesApi, templatesApi, plannerApi, sessionsApi } from './api'

// Types
export type * from './types/api'

// Schemas
export * from './schemas/login'
export * from './schemas/register'
export * from './schemas/profile'
export * from './schemas/workout'
export * from './schemas/plan'
export * from './schemas/onboarding'
export * from './schemas/passwordReset'
export * from './schemas/setsReps'

// Hooks
export * from './hooks/useApi'
export { isProvisionalSetLogId } from './hooks/setLogMutations'
export * from './hooks/useUnits'

// Constants
export * from './constants/trainingStyles'

// Utils
export * from './utils/workoutHelpers'
export * from './utils/repRange'
export * from './utils/calendarWeek'

// Query keys — every React Query key is built here (0028)
export { queryKeys, type QueryKeys, type ExerciseHistoryParams, type BodyRegion } from './queryKeys'

// Units — the single owner of everything that follows from a Unit System
export * from './units'
