// Fit Nation API Service Layer

import { request } from './http'
import type {
  CreatePlanInput,
  UpdatePlanInput,
  UpdateProgramInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  AddTemplateExerciseInput,
  UpdateTemplateExerciseInput,
  SwapTemplateExerciseInput,
  LogSetInput,
  UpdateSetInput,
  AddSessionExerciseInput,
  UpdateSessionExerciseInput,
  SwapSessionExerciseInput,
  UpdateProfileInput,
  GenerateWorkoutInput,
  RegenerateWorkoutInput,
  RegeneratePlanInput,
  AuthResponse,
  MessageResponse,
  UserResource,
  ValidateInvitationResponse,
  ActivePartnersResponse,
  RegisterDeviceInput,
  DeviceResource,
  UpdateNotificationSettingsInput,
  DataResponse,
  ListResponse,
  DataMessageResponse,
  PartnerBrandingResource,
  CompleteOnboardingResponse,
  ExerciseResource,
  ExerciseHistoryResponse,
  MuscleGroupResource,
  CategoryResource,
  EquipmentTypeResource,
  TargetRegionResource,
  MovementPatternResource,
  AngleResource,
  FitnessMetricsResponse,
  CustomPlanResource,
  ProgramResource,
  LibraryProgramResource,
  RoutinePlanResource,
  WorkoutTemplateResource,
  WeeklyPlannerResponse,
  CalendarResponse,
  TodayWorkoutResponse,
  WorkoutSessionResource,
  GeneratedSessionResource,
  SessionDetailResponse,
  CompleteSessionResponse,
  SetLogResource,
  WorkoutSessionExerciseResource,
} from './types/api';

// The choice of authentication is visible at every call site (0025). `authed`
// sends the stored bearer token and treats a rejected one as a sign-out;
// `unauthenticated` sends nothing, so a stale token can never bounce a login.
const authed = <T>(url: string, init: RequestInit = {}) => request<T>(url, { ...init, auth: 'bearer' })
const unauthenticated = <T>(url: string, init: RequestInit = {}) => request<T>(url, { ...init, auth: 'none' })

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const authApi = {
  validateInvitation: async (token: string): Promise<ValidateInvitationResponse> => {
    return unauthenticated<ValidateInvitationResponse>(`/invitations/${token}`);
  },
  register: async (data: {
    email: string;
    password: string;
    partner_id: number;
  }): Promise<AuthResponse> => {
    return unauthenticated<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  resendVerificationEmail: async (): Promise<MessageResponse> => {
    return authed<MessageResponse>('/email/verification-notification', {
      method: 'POST',
    });
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return unauthenticated<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      })
    });
  },
  socialLogin: async (data: {
    provider: 'google' | 'apple';
    token: string;
    name?: string;
    partner_id?: number;
  }): Promise<AuthResponse> => {
    return unauthenticated<AuthResponse>('/auth/social', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  logout: async (): Promise<MessageResponse> => {
    return authed<MessageResponse>('/logout', {
      method: 'POST'
    });
  },
  deleteAccount: async (password?: string): Promise<void> => {
    await authed<unknown>('/user', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  },
  getCurrentUser: async (): Promise<{ user: UserResource }> => {
    return authed<{ user: UserResource }>('/user');
  },
  forgotPassword: async (email: string): Promise<MessageResponse> => {
    return unauthenticated<MessageResponse>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  resetPassword: async (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<MessageResponse> => {
    return unauthenticated<MessageResponse>('/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// PARTNERS
// ============================================================================

export const partnersApi = {
  getActivePartners: async (): Promise<ActivePartnersResponse> => {
    return unauthenticated<ActivePartnersResponse>('/partners');
  },
  getBrandingBySlug: async (slug: string): Promise<DataResponse<PartnerBrandingResource>> => {
    return unauthenticated<DataResponse<PartnerBrandingResource>>(`/partners/${slug}/branding`);
  },
};

// ============================================================================
// USER PROFILE
// ============================================================================

export const profileApi = {
  getProfile: async (): Promise<{ user: UserResource }> => {
    return authed<{ user: UserResource }>('/profile');
  },
  updateProfile: async (data: UpdateProfileInput): Promise<{ user: UserResource }> => {
    // Use FormData if profile_photo is included
    if (data.profile_photo) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value instanceof File ? value : String(value));
        }
      });
      return authed<{ user: UserResource }>('/profile', {
        method: 'POST',
        body: formData
      });
    }
    return authed<{ user: UserResource }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteProfilePhoto: async (): Promise<{ user: UserResource }> => {
    return authed<{ user: UserResource }>('/profile/photo', {
      method: 'DELETE'
    });
  }
};

// ============================================================================
// ONBOARDING
// ============================================================================

export const onboardingApi = {
  completeOnboarding: async (planName?: string): Promise<CompleteOnboardingResponse> => {
    return authed<CompleteOnboardingResponse>('/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(planName ? { plan_name: planName } : {})
    });
  }
};

// ============================================================================
// NOTIFICATIONS — Devices + settings
// ============================================================================

export const devicesApi = {
  // Idempotent for the calling session: the server upserts the Device bound to
  // this bearer token. Requires a bearer token (400 for cookie sessions).
  register: async (data: RegisterDeviceInput): Promise<DataResponse<DeviceResource>> => {
    return unauthenticated<DataResponse<DeviceResource>>('/devices', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

export const notificationSettingsApi = {
  update: async (data: UpdateNotificationSettingsInput): Promise<{ user: UserResource }> => {
    return authed<{ user: UserResource }>('/notification-settings', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
};

// ============================================================================
// EXERCISES
// ============================================================================

export const exercisesApi = {
  getExercises: async (params?: { search?: string }): Promise<ListResponse<ExerciseResource>> => {
    const qs = params?.search ? `?search=${encodeURIComponent(params.search)}` : ''
    return authed<ListResponse<ExerciseResource>>(`/exercises${qs}`);
  },
  getExercise: async (exerciseId: number): Promise<DataResponse<ExerciseResource>> => {
    return authed<DataResponse<ExerciseResource>>(`/exercises/${exerciseId}`);
  },
  getExerciseHistory: async (
    exerciseId: number,
    params?: {
      limit?: number;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<ExerciseHistoryResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    const queryString = queryParams.toString();
    const url = `/exercises/${exerciseId}/history${queryString ? `?${queryString}` : ''}`;
    return authed<ExerciseHistoryResponse>(url);
  },
  createExercise: async (data: {
    name: string;
    description?: string;
    category_id: number;
    image?: string;
    default_rest_sec?: number;
  }): Promise<DataResponse<ExerciseResource>> => {
    return authed<DataResponse<ExerciseResource>>('/exercises', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateExercise: async (exerciseId: number, data: {
    name: string;
    description?: string;
    category_id: number;
    default_rest_sec?: number;
    image?: File;
    video?: File;
  }): Promise<DataResponse<ExerciseResource>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });
    return authed<DataResponse<ExerciseResource>>(`/exercises/${exerciseId}`, {
      method: 'POST',
      body: formData
    });
  },
  deleteExercise: async (exerciseId: number): Promise<void> => {
    await authed<unknown>(`/exercises/${exerciseId}`, {
      method: 'DELETE'
    });
  }
};

// ============================================================================
// MUSCLE GROUPS
// ============================================================================

export const muscleGroupsApi = {
  getMuscleGroups: async (bodyRegion?: 'upper' | 'lower' | 'core'): Promise<ListResponse<MuscleGroupResource>> => {
    const query = bodyRegion ? `?body_region=${bodyRegion}` : '';
    return authed<ListResponse<MuscleGroupResource>>(`/muscle-groups${query}`);
  },
  getMuscleGroup: async (muscleGroupId: number): Promise<DataResponse<MuscleGroupResource>> => {
    return authed<DataResponse<MuscleGroupResource>>(`/muscle-groups/${muscleGroupId}`);
  }
};

// ============================================================================
// CATEGORIES
// ============================================================================

export const categoriesApi = {
  getCategories: async (type?: 'workout'): Promise<ListResponse<CategoryResource>> => {
    const query = type ? `?type=${type}` : '';
    return authed<ListResponse<CategoryResource>>(`/categories${query}`);
  },
  getCategory: async (categoryId: number): Promise<DataResponse<CategoryResource>> => {
    return authed<DataResponse<CategoryResource>>(`/categories/${categoryId}`);
  }
};

// ============================================================================
// EXERCISE CLASSIFICATIONS
// ============================================================================

export const classificationsApi = {
  getEquipmentTypes: async (): Promise<ListResponse<EquipmentTypeResource>> => {
    return authed<ListResponse<EquipmentTypeResource>>('/equipment-types');
  },
  getTargetRegions: async (): Promise<ListResponse<TargetRegionResource>> => {
    return authed<ListResponse<TargetRegionResource>>('/target-regions');
  },
  getMovementPatterns: async (): Promise<ListResponse<MovementPatternResource>> => {
    return authed<ListResponse<MovementPatternResource>>('/movement-patterns');
  },
  getAngles: async (): Promise<ListResponse<AngleResource>> => {
    return authed<ListResponse<AngleResource>>('/angles');
  }
};

// ============================================================================
// FITNESS METRICS
// ============================================================================

export const metricsApi = {
  getFitnessMetrics: async (): Promise<FitnessMetricsResponse> => {
    return authed<FitnessMetricsResponse>('/user/fitness-metrics');
  }
};

// ============================================================================
// CUSTOM PLANS
// ============================================================================

export const plansApi = {
  getPlans: async (): Promise<ListResponse<CustomPlanResource>> => {
    return authed<ListResponse<CustomPlanResource>>('/custom-plans');
  },
  getPlan: async (planId: number): Promise<DataResponse<CustomPlanResource>> => {
    return authed<DataResponse<CustomPlanResource>>(`/custom-plans/${planId}`);
  },
  createPlan: async (data: CreatePlanInput): Promise<DataResponse<CustomPlanResource>> => {
    return authed<DataResponse<CustomPlanResource>>('/custom-plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updatePlan: async (planId: number, data: UpdatePlanInput): Promise<DataResponse<CustomPlanResource>> => {
    return authed<DataResponse<CustomPlanResource>>(`/custom-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deletePlan: async (planId: number): Promise<void> => {
    await authed<unknown>(`/custom-plans/${planId}`, {
      method: 'DELETE'
    });
  },
  regeneratePlan: async (data?: RegeneratePlanInput): Promise<DataResponse<ProgramResource>> => {
    return authed<DataResponse<ProgramResource>>('/plans/regenerate', {
      method: 'POST',
      body: JSON.stringify(data ?? {})
    });
  }
};

// ============================================================================
// PROGRAMS
// ============================================================================

export const programsApi = {
  // One-element list: the server wraps the active program in an array.
  getActiveProgram: async (): Promise<ListResponse<ProgramResource>> => {
    return authed<ListResponse<ProgramResource>>('/programs/active');
  },
  getPrograms: async (): Promise<ListResponse<ProgramResource>> => {
    return authed<ListResponse<ProgramResource>>('/programs');
  },
  getProgramLibrary: async (): Promise<ListResponse<LibraryProgramResource>> => {
    return authed<ListResponse<LibraryProgramResource>>('/programs/library');
  },
  getProgram: async (programId: number): Promise<DataResponse<ProgramResource>> => {
    return authed<DataResponse<ProgramResource>>(`/programs/${programId}`);
  },
  cloneProgram: async (programId: number): Promise<DataResponse<ProgramResource>> => {
    return authed<DataResponse<ProgramResource>>(`/programs/${programId}/clone`, {
      method: 'POST'
    });
  },
  updateProgram: async (programId: number, data: UpdateProgramInput): Promise<DataResponse<ProgramResource>> => {
    return authed<DataResponse<ProgramResource>>(`/programs/${programId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  deleteProgram: async (programId: number): Promise<void> => {
    await authed<unknown>(`/programs/${programId}`, {
      method: 'DELETE'
    });
  },
  getNextWorkout: async (programId: number): Promise<DataResponse<WorkoutTemplateResource | null>> => {
    return authed<DataResponse<WorkoutTemplateResource | null>>(`/programs/${programId}/next-workout`);
  }
};

// ============================================================================
// BROWSABLE ROUTINES
// ============================================================================

export const routinesApi = {
  getRoutines: async (): Promise<ListResponse<RoutinePlanResource>> => {
    return authed<ListResponse<RoutinePlanResource>>('/routines');
  },
  getRoutine: async (routineId: number): Promise<DataResponse<RoutinePlanResource>> => {
    return authed<DataResponse<RoutinePlanResource>>(`/routines/${routineId}`);
  }
};

// ============================================================================
// WORKOUT TEMPLATES
// ============================================================================

export const templatesApi = {
  getTemplates: async (): Promise<ListResponse<WorkoutTemplateResource>> => {
    return authed<ListResponse<WorkoutTemplateResource>>('/workout-templates');
  },
  getTemplate: async (templateId: number): Promise<DataResponse<WorkoutTemplateResource>> => {
    return authed<DataResponse<WorkoutTemplateResource>>(`/workout-templates/${templateId}`);
  },
  createTemplate: async (data: CreateTemplateInput): Promise<DataResponse<WorkoutTemplateResource>> => {
    return authed<DataResponse<WorkoutTemplateResource>>('/workout-templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateTemplate: async (templateId: number, data: UpdateTemplateInput): Promise<DataResponse<WorkoutTemplateResource>> => {
    return authed<DataResponse<WorkoutTemplateResource>>(`/workout-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteTemplate: async (templateId: number): Promise<void> => {
    await authed<unknown>(`/workout-templates/${templateId}`, {
      method: 'DELETE'
    });
  },
  // Template Exercise Management
  addExercise: async (templateId: number, data: AddTemplateExerciseInput): Promise<DataResponse<WorkoutTemplateResource>> => {
    return authed<DataResponse<WorkoutTemplateResource>>(`/workout-templates/${templateId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateExercise: async (templateId: number, pivotId: number, data: UpdateTemplateExerciseInput): Promise<DataResponse<WorkoutTemplateResource>> => {
    return authed<DataResponse<WorkoutTemplateResource>>(`/workout-templates/${templateId}/exercises/${pivotId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  swapExercise: async (templateId: number, pivotId: number, data: SwapTemplateExerciseInput): Promise<DataResponse<WorkoutTemplateResource>> => {
    return authed<DataResponse<WorkoutTemplateResource>>(`/workout-templates/${templateId}/exercises/${pivotId}/swap`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  removeExercise: async (templateId: number, pivotId: number): Promise<void> => {
    await authed<unknown>(`/workout-templates/${templateId}/exercises/${pivotId}`, {
      method: 'DELETE'
    });
  },
  reorderExercises: async (templateId: number, order: number[]): Promise<DataResponse<WorkoutTemplateResource>> => {
    return authed<DataResponse<WorkoutTemplateResource>>(`/workout-templates/${templateId}/order`, {
      method: 'POST',
      body: JSON.stringify({
        order
      })
    });
  }
};

// ============================================================================
// WORKOUT PLANNER
// ============================================================================

export const plannerApi = {
  getWeeklyPlanner: async (): Promise<WeeklyPlannerResponse> => {
    return authed<WeeklyPlannerResponse>('/planner/weekly');
  },
  assignTemplate: async (templateId: number, dayOfWeek: number): Promise<MessageResponse> => {
    return authed<MessageResponse>('/planner/assign', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        day_of_week: dayOfWeek
      })
    });
  },
  unassignTemplate: async (templateId: number): Promise<MessageResponse> => {
    return authed<MessageResponse>('/planner/unassign', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId
      })
    });
  }
};

// ============================================================================
// WORKOUT SESSIONS
// ============================================================================

export const sessionsApi = {
  getCalendar: async (startDate: string, endDate: string): Promise<CalendarResponse> => {
    return authed<CalendarResponse>(`/workout-sessions/calendar?start_date=${startDate}&end_date=${endDate}`);
  },
  getTodayWorkout: async (): Promise<TodayWorkoutResponse> => {
    return authed<TodayWorkoutResponse>('/workout-sessions/today');
  },
  startSession: async (templateId?: number): Promise<DataResponse<WorkoutSessionResource>> => {
    return authed<DataResponse<WorkoutSessionResource>>('/workout-sessions/start', {
      method: 'POST',
      body: JSON.stringify(templateId ? {
        template_id: templateId
      } : {})
    });
  },
  generateDraftSession: async (data: GenerateWorkoutInput): Promise<DataResponse<GeneratedSessionResource>> => {
    return authed<DataResponse<GeneratedSessionResource>>('/workout-sessions/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  confirmDraftSession: async (sessionId: number): Promise<DataResponse<WorkoutSessionResource>> => {
    return authed<DataResponse<WorkoutSessionResource>>(`/workout-sessions/${sessionId}/confirm`, {
      method: 'POST'
    });
  },
  regenerateDraftSession: async (sessionId: number, data: RegenerateWorkoutInput): Promise<DataResponse<GeneratedSessionResource>> => {
    return authed<DataResponse<GeneratedSessionResource>>(`/workout-sessions/${sessionId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  getSession: async (sessionId: number): Promise<SessionDetailResponse> => {
    return authed<SessionDetailResponse>(`/workout-sessions/${sessionId}`);
  },
  completeSession: async (sessionId: number, notes?: string): Promise<CompleteSessionResponse> => {
    return authed<CompleteSessionResponse>(`/workout-sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(notes ? {
        notes
      } : {})
    });
  },
  cancelSession: async (sessionId: number): Promise<void> => {
    await authed<unknown>(`/workout-sessions/${sessionId}/cancel`, {
      method: 'DELETE'
    });
  },
  // Set Logging
  logSet: async (sessionId: number, data: LogSetInput): Promise<DataMessageResponse<SetLogResource>> => {
    return authed<DataMessageResponse<SetLogResource>>(`/workout-sessions/${sessionId}/sets`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateSet: async (sessionId: number, setLogId: number, data: UpdateSetInput): Promise<DataMessageResponse<SetLogResource>> => {
    return authed<DataMessageResponse<SetLogResource>>(`/workout-sessions/${sessionId}/sets/${setLogId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteSet: async (sessionId: number, setLogId: number): Promise<void> => {
    await authed<unknown>(`/workout-sessions/${sessionId}/sets/${setLogId}`, {
      method: 'DELETE'
    });
  },
  // Session Exercise Management
  addExercise: async (sessionId: number, data: AddSessionExerciseInput): Promise<DataResponse<WorkoutSessionExerciseResource>> => {
    return authed<DataResponse<WorkoutSessionExerciseResource>>(`/workout-sessions/${sessionId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateSessionExercise: async (sessionId: number, exerciseId: number, data: UpdateSessionExerciseInput): Promise<DataResponse<WorkoutSessionExerciseResource>> => {
    return authed<DataResponse<WorkoutSessionExerciseResource>>(`/workout-sessions/${sessionId}/exercises/${exerciseId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  swapSessionExercise: async (sessionId: number, exerciseId: number, data: SwapSessionExerciseInput): Promise<DataResponse<WorkoutSessionExerciseResource>> => {
    return authed<DataResponse<WorkoutSessionExerciseResource>>(`/workout-sessions/${sessionId}/exercises/${exerciseId}/swap`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  removeSessionExercise: async (sessionId: number, exerciseId: number): Promise<void> => {
    await authed<unknown>(`/workout-sessions/${sessionId}/exercises/${exerciseId}`, {
      method: 'DELETE'
    });
  },
  reorderSessionExercises: async (sessionId: number, exerciseIds: number[]): Promise<DataResponse<WorkoutSessionResource>> => {
    return authed<DataResponse<WorkoutSessionResource>>(`/workout-sessions/${sessionId}/exercises/reorder`, {
      method: 'POST',
      body: JSON.stringify({
        exercise_ids: exerciseIds
      })
    });
  }
};

export const api = {
  auth: authApi,
  partners: partnersApi,
  profile: profileApi,
  onboarding: onboardingApi,
  devices: devicesApi,
  notificationSettings: notificationSettingsApi,
  exercises: exercisesApi,
  muscleGroups: muscleGroupsApi,
  categories: categoriesApi,
  classifications: classificationsApi,
  metrics: metricsApi,
  plans: plansApi,
  programs: programsApi,
  routines: routinesApi,
  templates: templatesApi,
  planner: plannerApi,
  sessions: sessionsApi,
}
