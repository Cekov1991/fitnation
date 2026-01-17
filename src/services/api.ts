// Fit Nation API Service Layer
// Base URL configuration

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function for making authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token && {
      Authorization: `Bearer ${token}`
    })
  };

  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred'
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    partner_id?: number;
  }) => {
    return fetchWithAuth('/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  login: async (email: string, password: string) => {
    return fetchWithAuth('/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      })
    });
  },
  logout: async () => {
    return fetchWithAuth('/logout', {
      method: 'POST'
    });
  },
  getCurrentUser: async () => {
    return fetchWithAuth('/user');
  }
};

// ============================================================================
// USER PROFILE
// ============================================================================

export const profileApi = {
  getProfile: async () => {
    return fetchWithAuth('/profile');
  },
  updateProfile: async (data: {
    name?: string;
    email?: string;
    profile_photo?: File;
    fitness_goal?: 'fat_loss' | 'muscle_gain' | 'strength' | 'general_fitness';
    age?: number;
    gender?: 'male' | 'female' | 'other';
    height?: number;
    weight?: number;
    training_experience?: 'beginner' | 'intermediate' | 'advanced';
    training_days_per_week?: number;
    workout_duration_minutes?: number;
  }) => {
    // Use FormData if profile_photo is included
    if (data.profile_photo) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value instanceof File ? value : String(value));
        }
      });
      return fetchWithAuth('/profile', {
        method: 'POST',
        body: formData
      });
    }
    return fetchWithAuth('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteProfilePhoto: async () => {
    return fetchWithAuth('/profile/photo', {
      method: 'DELETE'
    });
  }
};

// ============================================================================
// EXERCISES
// ============================================================================

export const exercisesApi = {
  getExercises: async () => {
    return fetchWithAuth('/exercises');
  },
  getExercise: async (exerciseId: number) => {
    return fetchWithAuth(`/exercises/${exerciseId}`);
  },
  getExerciseHistory: async (
    exerciseId: number,
    params?: {
      limit?: number;
      start_date?: string;
      end_date?: string;
    }
  ) => {
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
    return fetchWithAuth(url);
  },
  createExercise: async (data: {
    name: string;
    description?: string;
    category_id: number;
    image?: string;
    default_rest_sec?: number;
  }) => {
    return fetchWithAuth('/exercises', {
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
  }) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });
    return fetchWithAuth(`/exercises/${exerciseId}`, {
      method: 'POST',
      body: formData
    });
  },
  deleteExercise: async (exerciseId: number) => {
    return fetchWithAuth(`/exercises/${exerciseId}`, {
      method: 'DELETE'
    });
  }
};

// ============================================================================
// MUSCLE GROUPS
// ============================================================================

export const muscleGroupsApi = {
  getMuscleGroups: async (bodyRegion?: 'upper' | 'lower' | 'core') => {
    const query = bodyRegion ? `?body_region=${bodyRegion}` : '';
    return fetchWithAuth(`/muscle-groups${query}`);
  },
  getMuscleGroup: async (muscleGroupId: number) => {
    return fetchWithAuth(`/muscle-groups/${muscleGroupId}`);
  }
};

// ============================================================================
// FITNESS METRICS
// ============================================================================

export const metricsApi = {
  getFitnessMetrics: async () => {
    return fetchWithAuth('/user/fitness-metrics');
  }
};

// ============================================================================
// PLANS
// ============================================================================

export const plansApi = {
  getPlans: async () => {
    return fetchWithAuth('/plans');
  },
  getPlan: async (planId: number) => {
    return fetchWithAuth(`/plans/${planId}`);
  },
  createPlan: async (data: {
    name: string;
    description?: string;
    is_active?: boolean;
  }) => {
    return fetchWithAuth('/plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updatePlan: async (planId: number, data: {
    name: string;
    description?: string;
    is_active?: boolean;
  }) => {
    return fetchWithAuth(`/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deletePlan: async (planId: number) => {
    return fetchWithAuth(`/plans/${planId}`, {
      method: 'DELETE'
    });
  }
};

// ============================================================================
// WORKOUT TEMPLATES
// ============================================================================

export const templatesApi = {
  getTemplates: async () => {
    return fetchWithAuth('/workout-templates');
  },
  getTemplate: async (templateId: number) => {
    return fetchWithAuth(`/workout-templates/${templateId}`);
  },
  createTemplate: async (data: {
    plan_id: number;
    name: string;
    description?: string;
    day_of_week?: number; // 0-6 (Mon-Sun)
  }) => {
    return fetchWithAuth('/workout-templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateTemplate: async (templateId: number, data: {
    plan_id?: number;
    name: string;
    description?: string;
    day_of_week?: number;
  }) => {
    return fetchWithAuth(`/workout-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteTemplate: async (templateId: number) => {
    return fetchWithAuth(`/workout-templates/${templateId}`, {
      method: 'DELETE'
    });
  },
  // Template Exercise Management
  addExercise: async (templateId: number, data: {
    exercise_id: number;
    target_sets?: number;
    target_reps?: number;
    target_weight?: number;
    rest_seconds?: number;
  }) => {
    return fetchWithAuth(`/workout-templates/${templateId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateExercise: async (templateId: number, pivotId: number, data: {
    target_sets?: number;
    target_reps?: number;
    target_weight?: number;
    rest_seconds?: number;
  }) => {
    return fetchWithAuth(`/workout-templates/${templateId}/exercises/${pivotId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  removeExercise: async (templateId: number, pivotId: number) => {
    return fetchWithAuth(`/workout-templates/${templateId}/exercises/${pivotId}`, {
      method: 'DELETE'
    });
  },
  reorderExercises: async (templateId: number, order: number[]) => {
    return fetchWithAuth(`/workout-templates/${templateId}/order`, {
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
  getWeeklyPlanner: async () => {
    return fetchWithAuth('/planner/weekly');
  },
  assignTemplate: async (templateId: number, dayOfWeek: number) => {
    return fetchWithAuth('/planner/assign', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        day_of_week: dayOfWeek
      })
    });
  },
  unassignTemplate: async (templateId: number) => {
    return fetchWithAuth('/planner/unassign', {
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
  getCalendar: async (startDate: string, endDate: string) => {
    return fetchWithAuth(`/workout-sessions/calendar?start_date=${startDate}&end_date=${endDate}`);
  },
  getTodayWorkout: async () => {
    return fetchWithAuth('/workout-sessions/today');
  },
  startSession: async (templateId?: number) => {
    return fetchWithAuth('/workout-sessions/start', {
      method: 'POST',
      body: JSON.stringify(templateId ? {
        template_id: templateId
      } : {})
    });
  },
  getSession: async (sessionId: number) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}`);
  },
  completeSession: async (sessionId: number, notes?: string) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(notes ? {
        notes
      } : {})
    });
  },
  cancelSession: async (sessionId: number) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}/cancel`, {
      method: 'DELETE'
    });
  },
  // Set Logging
  logSet: async (sessionId: number, data: {
    exercise_id: number;
    set_number: number;
    weight: number;
    reps: number;
    rest_seconds?: number;
  }) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}/sets`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateSet: async (sessionId: number, setLogId: number, data: {
    weight: number;
    reps: number;
  }) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}/sets/${setLogId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteSet: async (sessionId: number, setLogId: number) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}/sets/${setLogId}`, {
      method: 'DELETE'
    });
  },
  // Session Exercise Management
  addExercise: async (sessionId: number, data: {
    exercise_id: number;
    order?: number;
    target_sets?: number;
    target_reps?: number;
    target_weight?: number;
    rest_seconds?: number;
  }) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateSessionExercise: async (sessionId: number, exerciseId: number, data: {
    order?: number;
    target_sets?: number;
    target_reps?: number;
    target_weight?: number;
    rest_seconds?: number;
  }) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}/exercises/${exerciseId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  removeSessionExercise: async (sessionId: number, exerciseId: number) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}/exercises/${exerciseId}`, {
      method: 'DELETE'
    });
  },
  reorderSessionExercises: async (sessionId: number, exerciseIds: number[]) => {
    return fetchWithAuth(`/workout-sessions/${sessionId}/exercises/reorder`, {
      method: 'POST',
      body: JSON.stringify({
        exercise_ids: exerciseIds
      })
    });
  }
};