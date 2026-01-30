// Fit Nation API TypeScript Definitions

// ============================================
// ENUMS AND CONSTANTS
// ============================================

export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'strength' | 'general_fitness';
export type Gender = 'male' | 'female' | 'other';
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';
export type StrengthLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type BalanceLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_IMPROVEMENT';
export type TrendDirection = 'up' | 'down' | 'same';
export type BodyRegion = 'upper' | 'lower' | 'core';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday, 6 = Sunday

// ============================================
// USER RESOURCES
// ============================================

export interface UserResource {
  id: number;
  name: string;
  email: string;
  profile_photo: string;
  profile: UserProfileResource | null;
  partner: UserPartner | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface UserProfileResource {
  fitness_goal: FitnessGoal | null;
  age: number | null;
  gender: Gender | null;
  height: number | null; // cm
  weight: number | null; // kg
  training_experience: TrainingExperience | null;
  training_days_per_week: number | null;
  workout_duration_minutes: number | null;
}
export interface UserPartner {
  id: number;
  name: string;
  slug: string;
  visual_identity: PartnerVisualIdentityResource | null;
}

// ============================================
// INVITATION RESOURCES
// ============================================

export interface InvitationResource {
  token: string;
  email: string;
  expires_at: string; // ISO 8601
  partner: {
    id: number;
    name: string;
    slug: string;
    visual_identity: PartnerVisualIdentityResource | null;
  };
}

export interface ValidateInvitationResponse {
  message: string;
  data: InvitationResource;
}

// ============================================
// PARTNER RESOURCES
// ============================================

export interface PartnerVisualIdentityResource {
  primary_color: string | null;
  secondary_color: string | null;
  logo: string;
  font_family: string | null;
  background_color: string | null;
  card_background_color: string | null;
  text_primary_color: string | null;
  text_secondary_color: string | null;
  text_on_primary_color: string | null;
  success_color: string | null;
  warning_color: string | null;
  danger_color: string | null;
  accent_color: string | null;
  border_color: string | null;
  background_image: string;
  primary_color_dark: string | null;
  secondary_color_dark: string | null;
  background_color_dark: string | null;
  card_background_color_dark: string | null;
  text_primary_color_dark: string | null;
  text_secondary_color_dark: string | null;
  text_on_primary_color_dark: string | null;
  success_color_dark: string | null;
  warning_color_dark: string | null;
  danger_color_dark: string | null;
  accent_color_dark: string | null;
  border_color_dark: string | null;
}

// ============================================
// EXERCISE RESOURCES
// ============================================

export interface ExerciseResource {
  id: number;
  category: CategoryResource | null;
  muscle_groups: MuscleGroupResource[] | null;
  primary_muscle_groups: MuscleGroupResource[] | null;
  secondary_muscle_groups: MuscleGroupResource[] | null;
  name: string;
  description: string | null;
  muscle_group_image: string | null;
  image: string | null;
  video: string | null;
  default_rest_sec: number;
  angle?: AngleResource | null;
  movement_pattern?: MovementPatternResource | null;
  target_region?: TargetRegionResource | null;
  equipment_type?: EquipmentTypeResource | null;
  created_at: string;
  updated_at: string;
}
export interface CategoryResource {
  id: number;
  type: 'workout';
  name: string;
  slug: string;
  display_order: number;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}
export interface MuscleGroupResource {
  id: number;
  name: string;
  body_region: BodyRegion;
  is_primary?: boolean;
  created_at: string;
  updated_at: string;
}

// Exercise History Resources
export interface ExerciseHistoryResource {
  exercise_id: number;
  exercise_name: string;
  stats: ExerciseHistoryStats;
  performance_data: PerformanceDataPoint[];
}

export interface ExerciseHistoryStats {
  current_weight: number;      // Most recent weight used (kg)
  best_weight: number;         // Highest weight ever used (kg)
  progress_percentage: number; // Percentage change from first to most recent (+28 means +28%)
  total_sessions: number;       // Total number of completed sessions with this exercise
  first_session_date: string | null; // ISO date string of first session (YYYY-MM-DD)
  last_session_date: string | null; // ISO date string of most recent session (YYYY-MM-DD)
}

export interface PerformanceDataPoint {
  date: string;                // ISO date string (YYYY-MM-DD)
  session_id: number;          // Workout session ID (for reference)
  weight: number;              // Best/max weight used in that session (kg)
  reps: number;                // Total reps across all sets in that session
  volume: number;              // Total volume = sum of (weight × reps) for all sets
  sets: number;                // Number of sets performed
}

// ============================================
// PLAN RESOURCES
// ============================================

export interface PlanResource {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  workout_templates: WorkoutTemplateResource[] | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// WORKOUT TEMPLATE RESOURCES
// ============================================

export interface WorkoutTemplateResource {
  id: number;
  plan_id: number;
  name: string;
  description: string | null;
  day_of_week: DayOfWeek | null;
  plan: PlanResource | null;
  exercises: TemplateExercise[] | null;
  created_at: string;
  updated_at: string;
}
export interface TemplateExercise {
  id: number;
  name: string;
  image: string | null;
  muscle_group_image: string | null;
  default_rest_sec: number;
  category: CategoryResource | null;
  muscle_groups: MuscleGroupResource[];
  pivot: TemplateExercisePivot;
}
export interface TemplateExercisePivot {
  id: number; // WorkoutTemplateExercise ID
  order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  rest_seconds: number | null;
}

// ============================================
// WORKOUT SESSION RESOURCES
// ============================================

export interface WorkoutSessionResource {
  id: number;
  user_id: number;
  workout_template_id: number | null;
  performed_at: string | null; // null for draft sessions
  completed_at: string | null;
  notes: string | null;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  exercises: WorkoutSessionExerciseResource[];
  set_logs: SetLogResource[];
  created_at: string;
  updated_at: string;
}
export interface WorkoutSessionCalendarResource {
  id: number;
  date: string;
  completed: boolean;
  workout_template_id: number | null;
  workout_name: string | null;
  duration_minutes: number | null;
}
export interface WorkoutSessionExerciseResource {
  id: number;
  workout_session_id: number;
  exercise_id: number;
  exercise: ExerciseResource | null;
  order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  rest_seconds: number | null;
  created_at: string;
  updated_at: string;
}
export interface SetLogResource {
  id: number;
  workout_session_id: number;
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  rest_seconds: number | null;
  created_at: string;
  updated_at: string;
}
export interface SessionExerciseDetail {
  session_exercise: WorkoutSessionExerciseResource;
  logged_sets: SetLogResource[];
  previous_sets: SetLogResource[];
  is_completed: boolean;
}
export interface SessionProgress {
  total_exercises: number;
  completed_exercises: number;
  progress_percent: number;
}

// ============================================
// FITNESS METRICS RESOURCES
// ============================================

export interface FitnessMetrics {
  strength_score: {
    current: number;
    level: StrengthLevel;
    recent_gain: number;
    gain_period: 'last_30_days';
  };
  strength_balance: {
    percentage: number;
    level: BalanceLevel;
    recent_change: number;
    muscle_groups: Record<string, number>;
  };
  weekly_progress: {
    percentage: number;
    trend: TrendDirection;
    current_week_workouts: number;
    previous_week_workouts: number;
  };
}

// ============================================
// PLANNER RESOURCES
// ============================================

export interface DayPlan {
  day_of_week: DayOfWeek;
  day_name: string;
  template: WorkoutTemplateResource | null;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface AuthResponse {
  message: string;
  user: UserResource;
  token: string;
}
export interface MessageResponse {
  message: string;
}
export interface DataResponse<T> {
  data: T;
}
export interface ListResponse<T> {
  data: T[];
}
export interface FitnessMetricsResponse {
  success: true;
  data: FitnessMetrics;
  message: string;
}
export interface WeeklyPlannerResponse {
  data: {
    weekly_plan: DayPlan[];
    available_templates: WorkoutTemplateResource[];
  };
}
export interface TodayWorkoutResponse {
  data: {
    template: WorkoutTemplateResource | null;
    session: WorkoutSessionResource | null;
  };
}
export interface SessionDetailResponse {
  data: {
    id: number;
    user_id: number;
    workout_template_id: number | null;
    performed_at: string | null;      // ISO 8601, null for draft sessions
    completed_at: string | null;
    notes: string | null;
    status?: 'draft' | 'active' | 'completed' | 'cancelled';
    is_auto_generated?: boolean;
    rationale?: string | null;
    exercises: SessionExerciseDetail[];
    progress: SessionProgress;
    created_at: string;
    updated_at: string;
  };
}
export interface CalendarResponse {
  data: {
    sessions: WorkoutSessionCalendarResource[];
    date_range: {
      start: string;
      end: string;
    };
  };
}
export interface ExerciseHistoryResponse {
  data: ExerciseHistoryResource;
}

// ============================================
// INPUT/REQUEST TYPES
// ============================================

// Plan mutations
export interface CreatePlanInput {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdatePlanInput {
  name: string;
  description?: string;
  is_active?: boolean;
}

// Template mutations
export interface CreateTemplateInput {
  plan_id: number;
  name: string;
  description?: string;
  day_of_week?: number; // 0-6 (Mon=0, Sun=6)
}

export interface UpdateTemplateInput {
  plan_id?: number;
  name: string;
  description?: string;
  day_of_week?: number; // 0-6 (Mon=0, Sun=6)
}

// Template exercise mutations
export interface AddTemplateExerciseInput {
  exercise_id: number;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
}

export interface UpdateTemplateExerciseInput {
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
}

// Session mutations
export interface LogSetInput {
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
  rest_seconds?: number;
}

export interface UpdateSetInput {
  weight: number;
  reps: number;
}

// Session exercise mutations
export interface AddSessionExerciseInput {
  exercise_id: number;
  order?: number;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
}

export interface UpdateSessionExerciseInput {
  order?: number;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  rest_seconds?: number;
}

// Profile mutations
export interface UpdateProfileInput {
  name?: string;
  email?: string;
  profile_photo?: File;
  fitness_goal?: FitnessGoal;
  age?: number;
  gender?: Gender;
  height?: number;
  weight?: number;
  training_experience?: TrainingExperience;
  training_days_per_week?: number;
  workout_duration_minutes?: number;
}

// ============================================
// EXERCISE CLASSIFICATION RESOURCES
// ============================================

export interface EquipmentTypeResource {
  id: number;
  code: string;
  name: string;
  display_order: number;
}

export interface TargetRegionResource {
  id: number;
  code: string;
  name: string;
  display_order: number;
}

export interface MovementPatternResource {
  id: number;
  code: string;
  name: string;
  display_order: number;
}

export interface AngleResource {
  id: number;
  code: string;
  name: string;
  display_order: number;
}

// ============================================
// WORKOUT GENERATION TYPES
// ============================================

export interface GenerateWorkoutInput {
  focus_muscle_groups?: string[];
  target_regions?: string[];
  equipment_types?: string[];
  movement_patterns?: string[];
  angles?: string[];
  duration_minutes?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface RegenerateWorkoutInput {
  focus_muscle_groups?: string[];
  target_regions?: string[];
  equipment_types?: string[];
  movement_patterns?: string[];
  angles?: string[];
  duration_minutes?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratedSessionResource extends WorkoutSessionResource {
  is_auto_generated: boolean;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  replaced_session_id: number | null;
  rationale: string | null;
  performed_at: string | null; // null for drafts
}

// ============================================
// ERROR TYPES
// ============================================

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}
export interface ApiError {
  message: string;
}