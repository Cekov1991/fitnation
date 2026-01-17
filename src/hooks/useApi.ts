import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, plansApi, templatesApi, exercisesApi, sessionsApi, metricsApi, plannerApi, muscleGroupsApi } from '../services/api';

// ============================================================================
// AUTHENTICATION HELPER
// ============================================================================

function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}

// ============================================================================
// PROFILE HOOKS
// ============================================================================

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
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
    mutationFn: profileApi.updateProfile,
    onSuccess: response => {
      queryClient.setQueryData(['profile'], response.user);
      queryClient.invalidateQueries({
        queryKey: ['user']
      });
    }
  });
}
export function useDeleteProfilePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.deleteProfilePhoto,
    onSuccess: response => {
      queryClient.setQueryData(['profile'], response.user);
    }
  });
}

// ============================================================================
// FITNESS METRICS HOOKS
// ============================================================================

export function useFitnessMetrics() {
  return useQuery({
    queryKey: ['fitness-metrics'],
    queryFn: async () => {
      const response = await metricsApi.getFitnessMetrics();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

// ============================================================================
// PLANS HOOKS
// ============================================================================

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await plansApi.getPlans();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}
export function usePlan(planId: number) {
  return useQuery({
    queryKey: ['plans', planId],
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
    mutationFn: plansApi.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['plans']
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
      data: any;
    }) => plansApi.updatePlan(planId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['plans']
      });
      queryClient.invalidateQueries({
        queryKey: ['plans', variables.planId]
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
        queryKey: ['plans']
      });
      queryClient.invalidateQueries({
        queryKey: ['planner']
      });
    }
  });
}

// ============================================================================
// WORKOUT TEMPLATES HOOKS
// ============================================================================

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await templatesApi.getTemplates();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}
export function useTemplate(templateId: number) {
  return useQuery({
    queryKey: ['templates', templateId],
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
    mutationFn: templatesApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['templates']
      });
      queryClient.invalidateQueries({
        queryKey: ['plans']
      });
      queryClient.invalidateQueries({
        queryKey: ['planner']
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
      data: any;
    }) => templatesApi.updateTemplate(templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['templates']
      });
      queryClient.invalidateQueries({
        queryKey: ['templates', variables.templateId]
      });
      queryClient.invalidateQueries({
        queryKey: ['plans']
      });
      queryClient.invalidateQueries({
        queryKey: ['planner']
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
        queryKey: ['templates']
      });
      queryClient.invalidateQueries({
        queryKey: ['plans']
      });
      queryClient.invalidateQueries({
        queryKey: ['planner']
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
      data: any;
    }) => templatesApi.addExercise(templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['templates', variables.templateId]
      });
      queryClient.invalidateQueries({
        queryKey: ['plans']
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
      data: any;
    }) => templatesApi.updateExercise(templateId, pivotId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['templates', variables.templateId]
      });
      queryClient.invalidateQueries({
        queryKey: ['plans']
      });
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
        queryKey: ['templates', variables.templateId]
      });
      queryClient.invalidateQueries({
        queryKey: ['plans']
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
        queryKey: ['templates', variables.templateId]
      });
    }
  });
}

// ============================================================================
// EXERCISES HOOKS
// ============================================================================

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const response = await exercisesApi.getExercises();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}
export function useExercise(exerciseId: number) {
  return useQuery({
    queryKey: ['exercises', exerciseId],
    queryFn: async () => {
      const response = await exercisesApi.getExercise(exerciseId);
      return response.data;
    },
    enabled: isAuthenticated() && !!exerciseId
  });
}
export function useExerciseHistory(
  exerciseId: number,
  params?: {
    limit?: number;
    start_date?: string;
    end_date?: string;
  },
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: ['exercises', exerciseId, 'history', params],
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
    queryKey: ['muscle-groups', bodyRegion],
    queryFn: async () => {
      const response = await muscleGroupsApi.getMuscleGroups(bodyRegion);
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
    queryKey: ['planner', 'weekly'],
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
        queryKey: ['planner']
      });
      queryClient.invalidateQueries({
        queryKey: ['templates']
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
        queryKey: ['planner']
      });
      queryClient.invalidateQueries({
        queryKey: ['templates']
      });
    }
  });
}

// ============================================================================
// WORKOUT SESSIONS HOOKS
// ============================================================================

export function useCalendar(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['sessions', 'calendar', startDate, endDate],
    queryFn: async () => {
      const response = await sessionsApi.getCalendar(startDate, endDate);
      return response.data;
    },
    enabled: isAuthenticated() && !!startDate && !!endDate
  });
}
export function useTodayWorkout() {
  return useQuery({
    queryKey: ['sessions', 'today'],
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
        queryKey: ['sessions']
      });
    }
  });
}
export function useSession(sessionId: number) {
  return useQuery({
    queryKey: ['sessions', sessionId],
    queryFn: async () => {
      const response = await sessionsApi.getSession(sessionId);
      return response.data;
    },
    enabled: isAuthenticated() && !!sessionId
  });
}
export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      notes
    }: {
      sessionId: number;
      notes?: string;
    }) => sessionsApi.completeSession(sessionId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sessions']
      });
      queryClient.invalidateQueries({
        queryKey: ['fitness-metrics']
      });
    }
  });
}
export function useCancelSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sessionsApi.cancelSession,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sessions']
      });
    }
  });
}

// Set Logging
export function useLogSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      data
    }: {
      sessionId: number;
      data: any;
    }) => sessionsApi.logSet(sessionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
    }
  });
}
export function useUpdateSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      setLogId,
      data
    }: {
      sessionId: number;
      setLogId: number;
      data: any;
    }) => sessionsApi.updateSet(sessionId, setLogId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
    }
  });
}
export function useDeleteSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      setLogId
    }: {
      sessionId: number;
      setLogId: number;
    }) => sessionsApi.deleteSet(sessionId, setLogId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
    }
  });
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
      data: any;
    }) => sessionsApi.addExercise(sessionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
    }
  });
}
export function useUpdateSessionExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      exerciseId,
      data
    }: {
      sessionId: number;
      exerciseId: number;
      data: any;
    }) => sessionsApi.updateSessionExercise(sessionId, exerciseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
    }
  });
}
export function useRemoveSessionExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      exerciseId
    }: {
      sessionId: number;
      exerciseId: number;
    }) => sessionsApi.removeSessionExercise(sessionId, exerciseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
    }
  });
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
        queryKey: ['sessions', variables.sessionId]
      });
    }
  });
}