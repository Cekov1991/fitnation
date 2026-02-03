import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, plansApi, templatesApi, exercisesApi, sessionsApi, metricsApi, plannerApi, muscleGroupsApi, categoriesApi, classificationsApi } from '../services/api';
import type {
  CreatePlanInput,
  UpdatePlanInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  AddTemplateExerciseInput,
  UpdateTemplateExerciseInput,
  LogSetInput,
  UpdateSetInput,
  AddSessionExerciseInput,
  UpdateSessionExerciseInput,
  UpdateProfileInput,
  GenerateWorkoutInput,
  RegenerateWorkoutInput,
} from '../types/api';

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
    mutationFn: (data: UpdateProfileInput) => profileApi.updateProfile(data),
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
    mutationFn: (data: CreatePlanInput) => plansApi.createPlan(data),
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
      data: UpdatePlanInput;
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
    mutationFn: (data: CreateTemplateInput) => templatesApi.createTemplate(data),
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
      data: UpdateTemplateInput;
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
      data: AddTemplateExerciseInput;
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
      data: UpdateTemplateExerciseInput;
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
// CATEGORIES HOOKS
// ============================================================================

export function useCategories(type?: 'workout') {
  return useQuery({
    queryKey: ['categories', type],
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
    queryKey: ['equipment-types'],
    queryFn: async () => {
      const response = await classificationsApi.getEquipmentTypes();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

export function useTargetRegions() {
  return useQuery({
    queryKey: ['target-regions'],
    queryFn: async () => {
      const response = await classificationsApi.getTargetRegions();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

export function useMovementPatterns() {
  return useQuery({
    queryKey: ['movement-patterns'],
    queryFn: async () => {
      const response = await classificationsApi.getMovementPatterns();
      return response.data;
    },
    enabled: isAuthenticated()
  });
}

export function useAngles() {
  return useQuery({
    queryKey: ['angles'],
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
      queryClient.invalidateQueries({
        queryKey: ['exercises']
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
      data: LogSetInput;
    }) => sessionsApi.logSet(sessionId, data),
    onMutate: async (variables) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['sessions', variables.sessionId]
      });

      // Snapshot previous data for rollback
      const previousData = queryClient.getQueryData(['sessions', variables.sessionId]);

      // Optimistically update cache
      // Note: useSession returns response.data directly, so cache stores data without wrapper
      queryClient.setQueryData(['sessions', variables.sessionId], (old: any) => {
        if (!old?.exercises) return old;

        // Find the exercise matching the exercise_id
        const updatedExercises = old.exercises.map((exDetail: any) => {
          if (exDetail.session_exercise.exercise_id === variables.data.exercise_id) {
            // Create optimistic SetLogResource
            const optimisticSetLog = {
              id: -Date.now(), // Temporary negative ID (will be replaced by server)
              workout_session_id: variables.sessionId,
              exercise_id: variables.data.exercise_id,
              set_number: variables.data.set_number,
              weight: variables.data.weight,
              reps: variables.data.reps,
              rest_seconds: variables.data.rest_seconds || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            // Add to logged_sets array
            return {
              ...exDetail,
              logged_sets: [...(exDetail.logged_sets || []), optimisticSetLog]
            };
          }
          return exDetail;
        });

        return {
          ...old,
          exercises: updatedExercises
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['sessions', variables.sessionId], context.previousData);
      }
      console.error('Failed to log set:', error);
    },
    onSuccess: (_, variables) => {
      // Refetch to sync with server (ensures accuracy)
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
      // Invalidate exercise history for the logged exercise
      queryClient.invalidateQueries({
        queryKey: ['exercises', variables.data.exercise_id, 'history']
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
      data: UpdateSetInput;
    }) => sessionsApi.updateSet(sessionId, setLogId, data),
    onMutate: async (variables) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['sessions', variables.sessionId]
      });

      // Snapshot previous data for rollback
      const previousData = queryClient.getQueryData(['sessions', variables.sessionId]);

      // Optimistically update cache
      // Note: useSession returns response.data directly, so cache stores data without wrapper
      queryClient.setQueryData(['sessions', variables.sessionId], (old: any) => {
        if (!old?.exercises) return old;

        // Find and update the specific set log
        const updatedExercises = old.exercises.map((exDetail: any) => {
          if (exDetail.logged_sets?.length > 0) {
            const updatedLoggedSets = exDetail.logged_sets.map((setLog: any) => {
              if (setLog.id === variables.setLogId) {
                // Update weight, reps, and updated_at
                return {
                  ...setLog,
                  weight: variables.data.weight,
                  reps: variables.data.reps,
                  updated_at: new Date().toISOString()
                };
              }
              return setLog;
            });

            return {
              ...exDetail,
              logged_sets: updatedLoggedSets
            };
          }
          return exDetail;
        });

        return {
          ...old,
          exercises: updatedExercises
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['sessions', variables.sessionId], context.previousData);
      }
      console.error('Failed to update set:', error);
    },
    onSuccess: (_, variables) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
      // Get exercise_id from the cached session data
      const sessionData = queryClient.getQueryData<{ data: any }>(['sessions', variables.sessionId]);
      if (sessionData?.data) {
        // Find the set log in the session to get its exercise_id
        const allSetLogs = sessionData.data.exercises?.flatMap((ex: any) => ex.logged_sets || []) || [];
        const setLog = allSetLogs.find((log: any) => log.id === variables.setLogId);
        if (setLog?.exercise_id) {
          queryClient.invalidateQueries({
            queryKey: ['exercises', setLog.exercise_id, 'history']
          });
        }
      } else {
        // Fallback: invalidate all exercise histories if we can't find the specific one
        queryClient.invalidateQueries({
          queryKey: ['exercises']
        });
      }
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
    onMutate: async (variables) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['sessions', variables.sessionId]
      });

      // Snapshot previous data for rollback
      const previousData = queryClient.getQueryData(['sessions', variables.sessionId]);

      // Find exercise_id before we modify the cache (needed for history invalidation)
      let exerciseId: number | null = null;
      const cachedData = previousData as any;
      if (cachedData?.exercises) {
        for (const ex of cachedData.exercises) {
          const setLog = ex.logged_sets?.find((log: any) => log.id === variables.setLogId);
          if (setLog) {
            exerciseId = setLog.exercise_id;
            break;
          }
        }
      }

      // Optimistically update cache - remove the set log AND decrease target_sets
      queryClient.setQueryData(['sessions', variables.sessionId], (old: any) => {
        if (!old?.exercises) return old;

        const updatedExercises = old.exercises.map((exDetail: any) => {
          const hasSetLog = exDetail.logged_sets?.some(
            (setLog: any) => setLog.id === variables.setLogId
          );

          if (hasSetLog) {
            const updatedLoggedSets = exDetail.logged_sets.filter(
              (setLog: any) => setLog.id !== variables.setLogId
            );

            // Also decrease target_sets so the set is fully removed
            return {
              ...exDetail,
              logged_sets: updatedLoggedSets,
              session_exercise: {
                ...exDetail.session_exercise,
                target_sets: Math.max(1, (exDetail.session_exercise.target_sets || 1) - 1)
              }
            };
          }
          return exDetail;
        });

        return {
          ...old,
          exercises: updatedExercises
        };
      });

      return { previousData, exerciseId };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['sessions', variables.sessionId], context.previousData);
      }
      console.error('Failed to delete set:', error);
    },
    onSuccess: (_, variables, context) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({
        queryKey: ['sessions', variables.sessionId]
      });
      // Invalidate exercise history if we found the exercise_id
      if (context?.exerciseId) {
        queryClient.invalidateQueries({
          queryKey: ['exercises', context.exerciseId, 'history']
        });
      }
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
      data: AddSessionExerciseInput;
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
      data: UpdateSessionExerciseInput;
    }) => sessionsApi.updateSessionExercise(sessionId, exerciseId, data),
    onMutate: async (variables) => {
      // Cancel ongoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['sessions', variables.sessionId]
      });

      // Snapshot previous data for rollback
      const previousData = queryClient.getQueryData(['sessions', variables.sessionId]);

      // Optimistically update cache
      queryClient.setQueryData(['sessions', variables.sessionId], (old: any) => {
        if (!old?.exercises) return old;

        // Find and update the specific exercise
        const updatedExercises = old.exercises.map((exDetail: any) => {
          if (exDetail.session_exercise.id === variables.exerciseId) {
            return {
              ...exDetail,
              session_exercise: {
                ...exDetail.session_exercise,
                ...variables.data, // Apply all updates (target_sets, target_reps, etc.)
                updated_at: new Date().toISOString()
              }
            };
          }
          return exDetail;
        });

        return {
          ...old,
          exercises: updatedExercises
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['sessions', variables.sessionId], context.previousData);
      }
      console.error('Failed to update session exercise:', error);
    },
    onSuccess: (_, variables) => {
      // Refetch to sync with server
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

// Workout Draft Generation
export function useGenerateDraftSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateWorkoutInput) => sessionsApi.generateDraftSession(data),
    onSuccess: (response) => {
      // Cache the draft session data (not the full response with message)
      queryClient.setQueryData(['sessions', response.data.id], response.data);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });
}

export function useConfirmDraftSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => sessionsApi.confirmDraftSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'today'] });
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
      queryClient.setQueryData(['sessions', response.data.id], response.data);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });
}