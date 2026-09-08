import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, profileApi, onboardingApi, devicesApi, notificationSettingsApi, plansApi, programsApi, routinesApi, templatesApi, exercisesApi, sessionsApi, metricsApi, plannerApi, muscleGroupsApi, categoriesApi, classificationsApi, partnersApi } from '../api';
import { getAuthStorage, AUTH_TOKEN_KEY } from '../auth';
import type {
  CreatePlanInput,
  UpdatePlanInput,
  UpdateProgramInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  AddTemplateExerciseInput,
  UpdateTemplateExerciseInput,
  SwapTemplateExerciseInput,
  AddSessionExerciseInput,
  SwapSessionExerciseInput,
  UpdateProfileInput,
  RegisterDeviceInput,
  UpdateNotificationSettingsInput,
  GenerateWorkoutInput,
  RegenerateWorkoutInput,
  RegeneratePlanInput,
  CompleteSessionResponse,
  PartnerBrandingResource,
} from '../types/api';
import { logSetMutationOptions, updateSetMutationOptions, deleteSetMutationOptions } from './setLogMutations';
import { updateSessionExerciseMutationOptions, removeSessionExerciseMutationOptions } from './sessionExerciseMutations';
import { queryKeys, type ExerciseHistoryParams } from '../queryKeys';

// ============================================================================
// AUTHENTICATION HELPER
// ============================================================================

function isAuthenticated(): boolean {
  try {
    const storage = getAuthStorage()
    const result = storage.getItem(AUTH_TOKEN_KEY)
    // Async storage (e.g. SecureStore on mobile): token presence is managed
    // by navigation guards in AuthContext; assume authenticated if storage is set.
    if (result instanceof Promise) return true
    return !!result
  } catch {
    return false
  }
}

// ============================================================================
// PROFILE HOOKS
// ============================================================================

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all(),
    queryFn: async () => {
      const response = await profileApi.getProfile();
      return response.user;
    },
    enabled: isAuthenticated()
  });
}
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => profileApi.updateProfile(data),
    onSuccess: response => {
      queryClient.setQueryData(queryKeys.profile.all(), response.user);
    }
  });
}
export function useDeleteProfilePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.deleteProfilePhoto,
    onSuccess: response => {
      queryClient.setQueryData(queryKeys.profile.all(), response.user);
    }
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (password?: string) => authApi.deleteAccount(password),
    onSuccess: async () => {
      await getAuthStorage().removeItem(AUTH_TOKEN_KEY);
      queryClient.clear();
    },
  });
}

// ============================================================================
// ONBOARDING HOOKS
// ============================================================================

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planName?: string) => onboardingApi.completeOnboarding(planName),
    onSuccess: () => {
      // Invalidate plans and planner queries to refresh data after plan creation
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.planner.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.all()
      });
    }
  });
}

// ============================================================================
// NOTIFICATION HOOKS — Devices + settings
// ============================================================================

// Best-effort heartbeat; the caller decides when to fire it and swallows
// failures. Nothing in the cache describes Devices, so no side effects.
// `meta.silent` lets an app-level MutationCache.onError skip its error toast.
export function useRegisterDevice() {
  return useMutation({
    mutationFn: (data: RegisterDeviceInput) => devicesApi.register(data),
    meta: { silent: true },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateNotificationSettingsInput) => notificationSettingsApi.update(data),
    onSuccess: response => {
      queryClient.setQueryData(queryKeys.profile.all(), response.user);
    }
  });
}

// ============================================================================
// FITNESS METRICS HOOKS
// ============================================================================

export function useFitnessMetrics() {
  return useQuery({
    queryKey: queryKeys.fitnessMetrics.all(),
    queryFn: async () => {
      const response = await metricsApi.getFitnessMetrics();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

// ============================================================================
// CUSTOM PLANS HOOKS
// ============================================================================

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans.all(),
    queryFn: async () => {
      const response = await plansApi.getPlans();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}
export function usePlan(planId: number) {
  return useQuery({
    queryKey: queryKeys.plans.detail(planId),
    queryFn: async () => {
      const response = await plansApi.getPlan(planId);
      return response.data;
    },
    enabled: isAuthenticated() && !!planId
  });
}
export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlanInput) => plansApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
    }
  });
}
export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      data
    }: {
      planId: number;
      data: UpdatePlanInput;
    }) => plansApi.updatePlan(planId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.detail(variables.planId)
      });
    }
  });
}
export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.planner.all()
      });
    }
  });
}

export function useRegeneratePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: RegeneratePlanInput) => plansApi.regeneratePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all() });
    }
  });
}

// ============================================================================
// PROGRAMS HOOKS
// ============================================================================

export function usePrograms() {
  return useQuery({
    queryKey: queryKeys.programs.all(),
    queryFn: async () => {
      const response = await programsApi.getActiveProgram();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

export function useProgram(programId: number) {
  return useQuery({
    queryKey: queryKeys.programs.detail(programId),
    queryFn: async () => {
      const response = await programsApi.getProgram(programId);
      return response.data;
    },
    enabled: isAuthenticated() && !!programId
  });
}

export function useProgramLibrary() {
  return useQuery({
    queryKey: queryKeys.programs.library(),
    queryFn: async () => {
      const response = await programsApi.getProgramLibrary();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

export function useCloneProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programId: number) => programsApi.cloneProgram(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.all()
      });
    }
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      programId,
      data
    }: {
      programId: number;
      data: UpdateProgramInput;
    }) => programsApi.updateProgram(programId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.detail(variables.programId)
      });
    }
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: programsApi.deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.all()
      });
    }
  });
}

export function useNextWorkout(programId: number) {
  return useQuery({
    queryKey: queryKeys.programs.nextWorkout(programId),
    queryFn: async () => {
      const response = await programsApi.getNextWorkout(programId);
      return response.data;
    },
    enabled: isAuthenticated() && !!programId
  });
}

// ============================================================================
// BROWSABLE ROUTINES HOOKS
// ============================================================================

export function useBrowsableRoutines() {
  return useQuery({
    queryKey: queryKeys.routines.all(),
    queryFn: async () => {
      const response = await routinesApi.getRoutines();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

export function useBrowsableRoutine(routineId: number) {
  return useQuery({
    queryKey: queryKeys.routines.detail(routineId),
    queryFn: async () => {
      const response = await routinesApi.getRoutine(routineId);
      return response.data;
    },
    enabled: isAuthenticated() && !!routineId
  });
}

// ============================================================================
// WORKOUT TEMPLATES HOOKS
// ============================================================================

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates.all(),
    queryFn: async () => {
      const response = await templatesApi.getTemplates();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}
export function useTemplate(templateId: number) {
  return useQuery({
    queryKey: queryKeys.templates.detail(templateId),
    queryFn: async () => {
      const response = await templatesApi.getTemplate(templateId);
      return response.data;
    },
    enabled: isAuthenticated() && !!templateId
  });
}
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplateInput) => templatesApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.planner.all()
      });
    }
  });
}
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      data
    }: {
      templateId: number;
      data: UpdateTemplateInput;
    }) => templatesApi.updateTemplate(templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.detail(variables.templateId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.planner.all()
      });
    }
  });
}
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: templatesApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.planner.all()
      });
    }
  });
}

// Template Exercise Management
export function useAddTemplateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      data
    }: {
      templateId: number;
      data: AddTemplateExerciseInput;
    }) => templatesApi.addExercise(templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.detail(variables.templateId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.all()
      });
    }
  });
}
export function useUpdateTemplateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      pivotId,
      data
    }: {
      templateId: number;
      pivotId: number;
      data: UpdateTemplateExerciseInput;
    }) => templatesApi.updateExercise(templateId, pivotId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.detail(variables.templateId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.all()
      });
    }
  });
}
export function useSwapTemplateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      pivotId,
      data
    }: {
      templateId: number;
      pivotId: number;
      data: SwapTemplateExerciseInput;
    }) => templatesApi.swapExercise(templateId, pivotId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.all() });
    }
  });
}
export function useRemoveTemplateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      pivotId
    }: {
      templateId: number;
      pivotId: number;
    }) => templatesApi.removeExercise(templateId, pivotId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.detail(variables.templateId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.all()
      });
    }
  });
}
export function useReorderTemplateExercises() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      order
    }: {
      templateId: number;
      order: number[];
    }) => templatesApi.reorderExercises(templateId, order),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.detail(variables.templateId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.all()
      });
    }
  });
}

// ============================================================================
// EXERCISES HOOKS
// ============================================================================

export function useExercises(search?: string) {
  return useQuery({
    queryKey: queryKeys.exercises.list(search),
    queryFn: async () => {
      const response = await exercisesApi.getExercises(search ? { search } : undefined);
      return response.data;
    },
    enabled: isAuthenticated()
  });
}
export function useExercise(exerciseId: number) {
  return useQuery({
    queryKey: queryKeys.exercises.detail(exerciseId),
    queryFn: async () => {
      const response = await exercisesApi.getExercise(exerciseId);
      return response.data;
    },
    enabled: isAuthenticated() && !!exerciseId
  });
}
export function useExerciseHistory(
  exerciseId: number,
  params?: ExerciseHistoryParams,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: queryKeys.exercises.history(exerciseId, params),
    queryFn: async () => {
      const response = await exercisesApi.getExerciseHistory(exerciseId, params);
      return response.data;
    },
    enabled: (options?.enabled ?? true) && isAuthenticated() && !!exerciseId
  });
}

// ============================================================================
// MUSCLE GROUPS HOOKS
// ============================================================================

export function useMuscleGroups(bodyRegion?: 'upper' | 'lower' | 'core') {
  return useQuery({
    queryKey: queryKeys.taxonomy.muscleGroups(bodyRegion),
    queryFn: async () => {
      const response = await muscleGroupsApi.getMuscleGroups(bodyRegion);
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

// ============================================================================
// CATEGORIES HOOKS
// ============================================================================

export function useCategories(type?: 'workout') {
  return useQuery({
    queryKey: queryKeys.taxonomy.categories(type),
    queryFn: async () => {
      const response = await categoriesApi.getCategories(type);
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

// ============================================================================
// EXERCISE CLASSIFICATIONS HOOKS
// ============================================================================

export function useEquipmentTypes() {
  return useQuery({
    queryKey: queryKeys.taxonomy.equipmentTypes(),
    queryFn: async () => {
      const response = await classificationsApi.getEquipmentTypes();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

export function useTargetRegions() {
  return useQuery({
    queryKey: queryKeys.taxonomy.targetRegions(),
    queryFn: async () => {
      const response = await classificationsApi.getTargetRegions();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

export function useMovementPatterns() {
  return useQuery({
    queryKey: queryKeys.taxonomy.movementPatterns(),
    queryFn: async () => {
      const response = await classificationsApi.getMovementPatterns();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

export function useAngles() {
  return useQuery({
    queryKey: queryKeys.taxonomy.angles(),
    queryFn: async () => {
      const response = await classificationsApi.getAngles();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

// ============================================================================
// PLANNER HOOKS
// ============================================================================

export function useWeeklyPlanner() {
  return useQuery({
    queryKey: queryKeys.planner.weekly(),
    queryFn: async () => {
      const response = await plannerApi.getWeeklyPlanner();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}
export function useAssignTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      dayOfWeek
    }: {
      templateId: number;
      dayOfWeek: number;
    }) => plannerApi.assignTemplate(templateId, dayOfWeek),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.planner.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.all()
      });
    }
  });
}
export function useUnassignTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plannerApi.unassignTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.planner.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.all()
      });
    }
  });
}

// ============================================================================
// WORKOUT SESSIONS HOOKS
// ============================================================================

export function useCalendar(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.sessions.calendar(startDate, endDate),
    queryFn: async () => {
      const response = await sessionsApi.getCalendar(startDate, endDate);
      return response.data;
    },
    enabled: isAuthenticated() && !!startDate && !!endDate
  });
}
export function useTodayWorkout() {
  return useQuery({
    queryKey: queryKeys.sessions.today(),
    queryFn: async () => {
      const response = await sessionsApi.getTodayWorkout();
      return response.data;
    },
    enabled: isAuthenticated(),
    refetchOnMount: true,
    staleTime: 0 // Always consider stale to ensure fresh data when navigating back
  });
}
export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId?: number) => sessionsApi.startSession(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.all()
      });
    }
  });
}
export function useSession(sessionId: number) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: async () => {
      const response = await sessionsApi.getSession(sessionId);
      return response.data;
    },
    enabled: isAuthenticated() && !!sessionId
  });
}
export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation<CompleteSessionResponse, Error, { sessionId: number; notes?: string }>({
    mutationFn: ({
      sessionId,
      notes
    }) => sessionsApi.completeSession(sessionId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fitnessMetrics.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.exercises.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.all()
      });
    }
  });
}
export function useCancelSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.cancelSession,
    onSuccess: () => {
      // sessions.all() covers today's workout and every calendar range.
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.all()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.programs.all()
      });
    }
  });
}

// Set Logging
/**
 * Optimistic like its `useUpdateSet` / `useDeleteSet` siblings: the set lands
 * in the cache on `onMutate` and rolls back on error. The options live in
 * `setLogMutations.ts` so the append and the rollback are testable without
 * React — see `setLogMutations.test.ts`.
 */
export function useLogSet() {
  const queryClient = useQueryClient();
  return useMutation(logSetMutationOptions(queryClient));
}
export function useUpdateSet() {
  const queryClient = useQueryClient();
  return useMutation(updateSetMutationOptions(queryClient));
}
export function useDeleteSet() {
  const queryClient = useQueryClient();
  return useMutation(deleteSetMutationOptions(queryClient));
}

// Session Exercise Management
export function useAddSessionExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      data
    }: {
      sessionId: number;
      data: AddSessionExerciseInput;
    }) => sessionsApi.addExercise(sessionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId)
      });
    }
  });
}
export function useUpdateSessionExercise() {
  const queryClient = useQueryClient();
  return useMutation(updateSessionExerciseMutationOptions(queryClient));
}
export function useSwapSessionExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      exerciseId,
      data
    }: {
      sessionId: number;
      exerciseId: number;
      data: SwapSessionExerciseInput;
    }) => sessionsApi.swapSessionExercise(sessionId, exerciseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(variables.sessionId) });
    }
  });
}
export function useRemoveSessionExercise() {
  const queryClient = useQueryClient();
  return useMutation(removeSessionExerciseMutationOptions(queryClient));
}
export function useReorderSessionExercises() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      exerciseIds
    }: {
      sessionId: number;
      exerciseIds: number[];
    }) => sessionsApi.reorderSessionExercises(sessionId, exerciseIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId)
      });
    }
  });
}

// Workout Draft Generation
export function useGenerateDraftSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateWorkoutInput) => sessionsApi.generateDraftSession(data),
    onSuccess: (response) => {
      // Cache the draft session data (not the full response with message)
      queryClient.setQueryData(queryKeys.sessions.detail(response.data.id), response.data);
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all() });
    }
  });
}

export function useConfirmDraftSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => sessionsApi.confirmDraftSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.today() });
    }
  });
}

export function useRegenerateDraftSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: number; data: RegenerateWorkoutInput }) => 
      sessionsApi.regenerateDraftSession(sessionId, data),
    onSuccess: (response) => {
      // Cache new draft data and invalidate old one
      queryClient.setQueryData(queryKeys.sessions.detail(response.data.id), response.data);
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all() });
    }
  });
}

// ============================================================================
// PARTNER BRANDING — public, keyed by the slug a host name resolves to
// ============================================================================

/**
 * The branding for the Partner a white-label host name names, for signed-out
 * screens. A public endpoint, so unlike every other query here it is gated on
 * having a slug, not on being authenticated. Cached for the session: a host
 * name does not change its Partner while a tab is open.
 */
export function usePartnerBranding(slug: string | null) {
  return useQuery({
    queryKey: queryKeys.partners.branding(slug ?? ''),
    queryFn: async (): Promise<PartnerBrandingResource> => {
      const response = await partnersApi.getBrandingBySlug(slug as string);
      return response.data;
    },
    enabled: !!slug,
    staleTime: Infinity,
  });
}
