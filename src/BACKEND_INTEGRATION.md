# Fit Nation API Documentation

This documentation provides complete information about all API resources and endpoints for React TypeScript frontend integration.

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [User Profile](#user-profile)
5. [Exercises](#exercises)
6. [Muscle Groups](#muscle-groups)
7. [Categories](#categories)
8. [Fitness Metrics](#fitness-metrics)
9. [Plans](#plans)
10. [Workout Templates](#workout-templates)
11. [Workout Planner](#workout-planner)
12. [Workout Sessions](#workout-sessions)
13. [Complete TypeScript Definitions](#complete-typescript-definitions)
14. [Error Responses](#error-responses)

---

## Base Configuration

### Base URL
```
/api
```

### Required Headers
```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

### Authentication Method
All protected endpoints require Laravel Sanctum Bearer token authentication.

---

## Authentication

### Register User
```
POST /api/register
```

**Request Body:**
```typescript
interface RegisterRequest {
  name: string;                // required, max 255 chars
  email: string;               // required, unique, lowercase email
  password: string;            // required, min 8 chars
  password_confirmation: string; // required, must match password
  partner_id?: number;         // optional, existing partner ID
}
```

**Response (201 Created):**
```typescript
interface RegisterResponse {
  message: "User registered successfully";
  user: UserResource;
  token: string;
}
```

---

### Login
```
POST /api/login
```

**Request Body:**
```typescript
interface LoginRequest {
  email: string;    // required
  password: string; // required
}
```

**Response (200 OK):**
```typescript
interface LoginResponse {
  message: "Login successful";
  user: UserResource;
  token: string;
}
```

**Error Response (422):**
```typescript
interface LoginError {
  message: "The given data was invalid.";
  errors: {
    email: ["The provided credentials are incorrect."];
  };
}
```

---

### Logout
```
POST /api/logout
```
*Requires authentication*

**Response (200 OK):**
```typescript
interface LogoutResponse {
  message: "Logged out successfully";
}
```

---

## User Management

### Get Current User
```
GET /api/user
```
*Requires authentication*

**Response:**
```typescript
interface GetUserResponse {
  user: UserResource;
}
```

---

## User Profile

### Get Profile
```
GET /api/profile
```
*Requires authentication*

**Response:**
```typescript
interface GetProfileResponse {
  user: UserResource;
}
```

---

### Update Profile
```
PUT /api/profile
PATCH /api/profile
```
*Requires authentication*

**Request Body (all fields optional):**
```typescript
interface ProfileUpdateRequest {
  // User fields
  name?: string;                    // max 255 chars
  email?: string;                   // unique, lowercase email
  profile_photo?: File;             // image: jpeg, png, jpg, gif, max 2MB

  // Profile fields
  fitness_goal?: FitnessGoal;       // enum value
  age?: number;                     // 1-150
  gender?: Gender;                  // enum value
  height?: number;                  // 50-300 (cm)
  weight?: number;                  // 1-500 (kg)
  training_experience?: TrainingExperience; // enum value
  training_days_per_week?: number;  // 1-7
  workout_duration_minutes?: number; // 1-600
}

type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'strength' | 'general_fitness';
type Gender = 'male' | 'female' | 'other';
type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';
```

**Response:**
```typescript
interface ProfileUpdateResponse {
  message: "Profile updated successfully";
  user: UserResource;
}
```

---

### Delete Profile Photo
```
DELETE /api/profile/photo
```
*Requires authentication*

**Response:**
```typescript
interface DeletePhotoResponse {
  message: "Profile photo deleted successfully";
  user: UserResource;
}
```

---

## Exercises

### List All Exercises
```
GET /api/exercises
```
*Requires authentication*

**Response:**
```typescript
interface ExerciseListResponse {
  data: ExerciseResource[];
}
```

---

### Get Single Exercise
```
GET /api/exercises/{id}
```
*Requires authentication*

**Response:**
```typescript
interface ExerciseShowResponse {
  data: ExerciseResource;
}
```

---

### Create Exercise
```
POST /api/exercises
```
*Requires authentication + admin role*

**Request Body:**
```typescript
interface CreateExerciseRequest {
  name: string;              // required, max 255 chars
  description?: string;      // optional, max 5000 chars
  category_id: number;       // required, must be workout category
  image?: string;            // optional, storage path, max 255 chars
  default_rest_sec?: number; // optional, min 0, defaults to 90
}
```

**Response (201 Created):**
```typescript
interface CreateExerciseResponse {
  message: "Exercise created successfully";
  data: ExerciseResource;
}
```

---

### Update Exercise
```
PUT /api/exercises/{id}
PATCH /api/exercises/{id}
```
*Requires authentication + admin role*

**Request Body:**
```typescript
interface UpdateExerciseRequest {
  name: string;              // required, max 255 chars
  description?: string;      // optional, max 5000 chars
  category_id: number;       // required, must be workout category
  default_rest_sec?: number; // optional, min 0
  image?: File;              // optional, image file max 5MB
  video?: File;              // optional, video file max 50MB
}
```

**Response:**
```typescript
interface UpdateExerciseResponse {
  message: "Exercise updated successfully";
  data: ExerciseResource;
}
```

---

### Delete Exercise
```
DELETE /api/exercises/{id}
```
*Requires authentication + admin role*

**Response:**
```typescript
interface DeleteExerciseResponse {
  message: "Exercise deleted successfully";
}
```

---

### Get Exercise Performance History
```
GET /api/exercises/{id}/history
```
*Requires authentication (owner only - user's own data)*

**Query Parameters (optional):**
```typescript
interface ExerciseHistoryQueryParams {
  limit?: number;        // Optional: Limit number of data points (default: all)
  start_date?: string;   // Optional: Filter from date (YYYY-MM-DD)
  end_date?: string;     // Optional: Filter to date (YYYY-MM-DD)
}
```

**Response:**
```typescript
interface ExerciseHistoryResponse {
  data: ExerciseHistoryResource;
}

interface ExerciseHistoryResource {
  exercise_id: number;
  exercise_name: string;
  stats: ExerciseHistoryStats;
  performance_data: PerformanceDataPoint[];
}

interface ExerciseHistoryStats {
  current_weight: number;      // Most recent weight used (kg)
  best_weight: number;         // Highest weight ever used (kg)
  progress_percentage: number; // Percentage change from first to most recent (+28 means +28%)
  total_sessions: number;       // Total number of completed sessions with this exercise
  first_session_date: string | null; // ISO date string of first session (YYYY-MM-DD)
  last_session_date: string | null; // ISO date string of most recent session (YYYY-MM-DD)
}

interface PerformanceDataPoint {
  date: string;                // ISO date string (YYYY-MM-DD)
  session_id: number;          // Workout session ID (for reference)
  weight: number;              // Best/max weight used in that session (kg)
  reps: number;                // Total reps across all sets in that session
  volume: number;              // Total volume = sum of (weight × reps) for all sets
  sets: number;                // Number of sets performed
}
```

**Example Response:**
```json
{
  "data": {
    "exercise_id": 42,
    "exercise_name": "Leg Press",
    "stats": {
      "current_weight": 32,
      "best_weight": 32,
      "progress_percentage": 28,
      "total_sessions": 5,
      "first_session_date": "2024-01-01",
      "last_session_date": "2024-01-15"
    },
    "performance_data": [
      {
        "date": "2024-01-01",
        "session_id": 101,
        "weight": 25,
        "reps": 30,
        "volume": 750,
        "sets": 3
      },
      {
        "date": "2024-01-15",
        "session_id": 120,
        "weight": 32,
        "reps": 30,
        "volume": 960,
        "sets": 3
      }
    ]
  }
}
```

**Notes:**
- Only returns data from completed workout sessions (`completed_at IS NOT NULL`)
- Performance data is ordered chronologically (oldest first)
- Weight represents the maximum weight used in that session
- Volume is calculated as the sum of (weight × reps) for each set
- If no history exists, returns empty `performance_data` array with stats set to 0/null

---

## Muscle Groups

### List All Muscle Groups
```
GET /api/muscle-groups
```
*Requires authentication*

**Query Parameters:**
```typescript
interface MuscleGroupQueryParams {
  body_region?: 'upper' | 'lower' | 'core'; // optional filter
}
```

**Response:**
```typescript
interface MuscleGroupListResponse {
  data: MuscleGroupResource[];
}
```

---

### Get Single Muscle Group
```
GET /api/muscle-groups/{id}
```
*Requires authentication*

**Response:**
Returns muscle group with associated exercises loaded.
```typescript
// MuscleGroupResource with exercises relationship
```

---

## Categories

Categories represent exercise equipment types used to classify exercises.

### List All Categories
```
GET /api/categories
```
*Requires authentication*

**Query Parameters:**
```typescript
interface CategoryQueryParams {
  type?: 'workout'; // optional filter by category type
}
```

**Response:**
```typescript
interface CategoryListResponse {
  data: CategoryResource[];
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "workout",
      "name": "Bodyweight",
      "slug": "bodyweight",
      "display_order": 1,
      "icon": "🤸",
      "color": "#ef4444",
      "created_at": "2024-01-01T00:00:00.000000Z",
      "updated_at": "2024-01-01T00:00:00.000000Z"
    },
    {
      "id": 2,
      "type": "workout",
      "name": "Dumbbell",
      "slug": "dumbbell",
      "display_order": 2,
      "icon": "🏋️",
      "color": "#3b82f6",
      "created_at": "2024-01-01T00:00:00.000000Z",
      "updated_at": "2024-01-01T00:00:00.000000Z"
    }
  ]
}
```

---

### Get Single Category
```
GET /api/categories/{id}
```
*Requires authentication*

**Response:**
Returns category with associated exercises loaded.
```typescript
interface CategoryShowResponse {
  data: CategoryResource;
}

// CategoryResource includes exercises relationship when loaded
```

**Available Category Types:**
- `bodyweight` - Bodyweight exercises (e.g., Push-ups, Pull-ups, Dips)
- `dumbbell` - Dumbbell exercises (e.g., Dumbbell Bench Press, Dumbbell Curl)
- `barbell` - Barbell exercises (e.g., Barbell Bench Press, Deadlift, Squat)
- `machine-plate-loaded` - Plate-loaded machine exercises (e.g., Plate-Loaded Chest Press, Leg Press)
- `machine-cable` - Cable-based machine exercises (e.g., Lat Pulldown, Machine Row, Leg Extensions)
- `cable` - Free cable exercises (e.g., Cable Fly, Cable Curl, Cable Row)
- `bands` - Resistance band exercises
- `trx` - TRX suspension training exercises

---

## Fitness Metrics

### Get Fitness Metrics
```
GET /api/user/fitness-metrics
```
*Requires authentication*

**Response:**
```typescript
interface FitnessMetricsResponse {
  success: true;
  data: {
    strength_score: StrengthScore;
    strength_balance: StrengthBalance;
    weekly_progress: WeeklyProgress;
  };
  message: "Fitness metrics retrieved successfully";
}

interface StrengthScore {
  current: number;           // Relative strength score
  level: StrengthLevel;      // Based on demographics
  recent_gain: number;       // Change in last 30 days
  gain_period: "last_30_days";
  percentile?: number;        // 0-100, percentile ranking compared to similar users in same partner
  muscle_groups?: Record<string, number>; // Strength scores by muscle group (chest, back, shoulders, arms, legs, core)
}

type StrengthLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface StrengthBalance {
  percentage: number;        // 0-100, how balanced training is
  level: BalanceLevel;
  recent_change: number;     // Change from previous period
  muscle_groups: Record<MuscleGroupName, number>; // % distribution
  percentile?: number;       // 0-100, percentile ranking compared to similar users in same partner (optional)
}

type BalanceLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_IMPROVEMENT';

type MuscleGroupName = 
  | 'chest' | 'lats' | 'upper back' | 'lower back'
  | 'front delts' | 'side delts' | 'rear delts' | 'traps'
  | 'biceps' | 'triceps' | 'forearms'
  | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves'
  | 'abs' | 'obliques';

interface WeeklyProgress {
  percentage: number;        // Absolute change %
  trend: 'up' | 'down' | 'same';
  current_week_workouts: number;
  previous_week_workouts: number;
  current_week_volume?: number;          // Total volume in lbs for current week (converted from KG stored in DB) (optional)
  current_week_time_minutes?: number;   // Total time in minutes for current week (optional)
  previous_week_volume?: number;        // Total volume in lbs for previous week (converted from KG stored in DB) (optional)
  volume_difference?: number;           // Difference in volume between weeks (optional)
  volume_difference_percent?: number;   // Percentage difference in volume (optional)
  daily_breakdown?: Array<{              // Daily data for the current week (optional)
    day_of_week: number;                // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    date: string;                       // ISO date string (e.g., "2024-01-15")
    volume: number;                     // Volume in lbs for that day (converted from KG stored in DB)
    workouts: number;                   // Number of workouts
    time_minutes: number;                // Time spent in minutes
  }>;
  historical_weeks?: Array<{ week: string, workouts: number }>; // Historical weekly workout counts for last 8 weeks (optional)
}
```

---

## Plans

Plans are top-level containers for organizing workout templates.

### List All Plans
```
GET /api/plans
```
*Requires authentication*

**Response:**
```typescript
interface PlanListResponse {
  data: PlanResource[];
}
```

---

### Get Single Plan
```
GET /api/plans/{id}
```
*Requires authentication (owner only)*

**Response:**
```typescript
interface PlanShowResponse {
  data: PlanResource;
}
```

---

### Create Plan
```
POST /api/plans
```
*Requires authentication*

**Request Body:**
```typescript
interface CreatePlanRequest {
  name: string;          // required, max 255 chars
  description?: string;  // optional
  is_active?: boolean;   // optional, defaults to false
}
```

**Response (201 Created):**
```typescript
interface CreatePlanResponse {
  message: "Plan created successfully";
  data: PlanResource;
}
```

---

### Update Plan
```
PUT /api/plans/{id}
PATCH /api/plans/{id}
```
*Requires authentication (owner only)*

**Request Body:**
```typescript
interface UpdatePlanRequest {
  name: string;          // required, max 255 chars
  description?: string;  // optional
  is_active?: boolean;   // optional
}
```

**Response:**
```typescript
interface UpdatePlanResponse {
  message: "Plan updated successfully";
  data: PlanResource;
}
```

---

### Delete Plan
```
DELETE /api/plans/{id}
```
*Requires authentication (owner only)*

**Response:**
```typescript
interface DeletePlanResponse {
  message: "Plan deleted successfully";
}
```

---

## Workout Templates

Workout templates define reusable workout structures with exercises and targets.

### List All Workout Templates
```
GET /api/workout-templates
```
*Requires authentication*

**Response:**
```typescript
interface WorkoutTemplateListResponse {
  data: WorkoutTemplateResource[];
}
```

---

### Get Single Workout Template
```
GET /api/workout-templates/{id}
```
*Requires authentication (owner only)*

**Response:**
```typescript
interface WorkoutTemplateShowResponse {
  data: WorkoutTemplateResource;
}
```

---

### Create Workout Template
```
POST /api/workout-templates
```
*Requires authentication*

**Request Body:**
```typescript
interface CreateWorkoutTemplateRequest {
  plan_id: number;       // required, must belong to user
  name: string;          // required, max 255 chars
  description?: string;  // optional
  day_of_week?: number;  // optional, 0-6 (Mon=0, Sun=6)
}
```

**Response (201 Created):**
```typescript
interface CreateWorkoutTemplateResponse {
  message: "Workout template created successfully";
  data: WorkoutTemplateResource;
}
```

---

### Update Workout Template
```
PUT /api/workout-templates/{id}
PATCH /api/workout-templates/{id}
```
*Requires authentication (owner only)*

**Request Body:**
```typescript
interface UpdateWorkoutTemplateRequest {
  plan_id?: number;      // optional, must belong to user
  name: string;          // required, max 255 chars
  description?: string;  // optional
  day_of_week?: number;  // optional, 0-6
}
```

**Response:**
```typescript
interface UpdateWorkoutTemplateResponse {
  message: "Workout template updated successfully";
  data: WorkoutTemplateResource;
}
```

---

### Delete Workout Template
```
DELETE /api/workout-templates/{id}
```
*Requires authentication (owner only)*

**Response:**
```typescript
interface DeleteWorkoutTemplateResponse {
  message: "Workout template deleted successfully";
}
```

---

### Add Exercise to Template
```
POST /api/workout-templates/{workoutTemplate}/exercises
```
*Requires authentication (owner only)*

**Request Body:**
```typescript
interface AddTemplateExerciseRequest {
  exercise_id: number;       // required, must exist
  target_sets?: number;      // optional, min 1
  target_reps?: number;      // optional, min 1
  target_weight?: number;    // optional, min 0
  rest_seconds?: number;     // optional, min 0
}
```

**Response (201 Created):**
```typescript
interface AddTemplateExerciseResponse {
  message: "Exercise added successfully";
  data: WorkoutTemplateResource;
}
```

---

### Update Exercise in Template
```
PUT /api/workout-templates/{workoutTemplate}/exercises/{exercise}
```
*Requires authentication (owner only)*

**Note:** `{exercise}` is the `WorkoutTemplateExercise` pivot ID, not the exercise ID.

**Request Body:**
```typescript
interface UpdateTemplateExerciseRequest {
  target_sets?: number;      // optional, min 1
  target_reps?: number;      // optional, min 1
  target_weight?: number;    // optional, min 0
  rest_seconds?: number;     // optional, min 0
}
```

**Response:**
```typescript
interface UpdateTemplateExerciseResponse {
  message: "Exercise updated successfully";
  data: WorkoutTemplateResource;
}
```

---

### Remove Exercise from Template
```
DELETE /api/workout-templates/{workoutTemplate}/exercises/{exercise}
```
*Requires authentication (owner only)*

**Note:** `{exercise}` is the `WorkoutTemplateExercise` pivot ID.

**Response:**
```typescript
interface RemoveTemplateExerciseResponse {
  message: "Exercise removed successfully";
  data: WorkoutTemplateResource;
}
```

---

### Reorder Exercises in Template
```
POST /api/workout-templates/{workoutTemplate}/order
```
*Requires authentication (owner only)*

**Request Body:**
```typescript
interface ReorderTemplateExercisesRequest {
  order: number[];  // Array of WorkoutTemplateExercise IDs in desired order
}
```

**Response:**
```typescript
interface ReorderTemplateExercisesResponse {
  message: "Order updated successfully";
  data: WorkoutTemplateResource;
}
```

---

## Workout Planner

The planner provides a weekly view of scheduled workouts.

### Get Weekly Planner
```
GET /api/planner/weekly
```
*Requires authentication*

**Response:**
```typescript
interface WeeklyPlannerResponse {
  data: {
    weekly_plan: DayPlan[];
    available_templates: WorkoutTemplateResource[];
  };
}

interface DayPlan {
  day_of_week: number;                    // 0-6 (Mon=0, Sun=6)
  day_name: string;                       // "Monday", "Tuesday", etc.
  template: WorkoutTemplateResource | null;
}
```

---

### Assign Template to Day
```
POST /api/planner/assign
```
*Requires authentication*

**Request Body:**
```typescript
interface AssignTemplateRequest {
  template_id: number;   // required, must belong to user
  day_of_week: number;   // required, 0-6
}
```

**Response:**
```typescript
interface AssignTemplateResponse {
  message: "Workout assigned successfully";
  data: WorkoutTemplateResource;
}
```

---

### Unassign Template from Day
```
POST /api/planner/unassign
```
*Requires authentication*

**Request Body:**
```typescript
interface UnassignTemplateRequest {
  template_id: number;   // required, must belong to user
}
```

**Response:**
```typescript
interface UnassignTemplateResponse {
  message: "Workout unassigned successfully";
  data: WorkoutTemplateResource;
}
```

---

## Workout Sessions

Workout sessions track actual performed workouts with logged sets.

### Get Calendar View
```
GET /api/workout-sessions/calendar
```
*Requires authentication*

**Query Parameters:**
```typescript
interface CalendarQueryParams {
  start_date: string;  // required, format: YYYY-MM-DD
  end_date: string;    // required, format: YYYY-MM-DD
}
```

**Response:**
```typescript
interface CalendarResponse {
  data: {
    sessions: WorkoutSessionCalendarResource[];
    date_range: {
      start: string;
      end: string;
    };
  };
}
```

---

### Get Today's Workout
```
GET /api/workout-sessions/today
```
*Requires authentication*

**Response:**
```typescript
interface TodayWorkoutResponse {
  data: {
    template: WorkoutTemplate | null;  // Scheduled template for today
    session: WorkoutSessionResource | null;  // Active session if exists
  };
}
```

---

### Start Workout Session
```
POST /api/workout-sessions/start
```
*Requires authentication*

**Request Body:**
```typescript
interface StartSessionRequest {
  template_id?: number;  // optional, creates blank session if not provided
}
```

**Response (201 Created):**
```typescript
interface StartSessionResponse {
  data: WorkoutSessionResource;
  message: "Workout session started successfully";
}
```

**Note:** If a session already exists for today, returns the existing session.

---

### Get Session Details
```
GET /api/workout-sessions/{session}
```
*Requires authentication (owner only)*

**Response:**
```typescript
interface SessionDetailResponse {
  data: {
    id: number;
    user_id: number;
    workout_template_id: number | null;
    performed_at: string;      // ISO 8601
    completed_at: string | null;
    notes: string | null;
    exercises: SessionExerciseDetail[];
    progress: SessionProgress;
    created_at: string;
    updated_at: string;
  };
}

interface SessionExerciseDetail {
  session_exercise: WorkoutSessionExerciseResource;
  logged_sets: SetLogResource[];
  previous_sets: SetLogResource[];  // From last completed session
  is_completed: boolean;
}

interface SessionProgress {
  total_exercises: number;
  completed_exercises: number;
  progress_percent: number;  // 0-100
}
```

---

### Complete Workout Session
```
POST /api/workout-sessions/{session}/complete
```
*Requires authentication (owner only)*

**Request Body:**
```typescript
interface CompleteSessionRequest {
  notes?: string;  // optional, max 1000 chars
}
```

**Response:**
```typescript
interface CompleteSessionResponse {
  data: WorkoutSessionResource;
  message: "Workout completed! Great job! 💪";
}
```

---

### Cancel Workout Session
```
DELETE /api/workout-sessions/{session}/cancel
```
*Requires authentication (owner only)*

**Response:**
```typescript
interface CancelSessionResponse {
  message: "Workout cancelled successfully";
}
```

**Note:** This deletes all set logs and the session itself.

---

### Log a Set
```
POST /api/workout-sessions/{session}/sets
```
*Requires authentication (owner only)*

**Request Body:**
```typescript
interface LogSetRequest {
  exercise_id: number;    // required, must exist
  set_number: number;     // required, min 1
  weight: number;         // required, min 0
  reps: number;           // required, min 0
  rest_seconds?: number;  // optional, min 0
}
```

**Response (201 Created):**
```typescript
interface LogSetResponse {
  data: SetLogResource;
  message: "Set logged successfully";
}
```

---

### Update a Set
```
PUT /api/workout-sessions/{session}/sets/{setLog}
```
*Requires authentication (owner only)*

**Request Body:**
```typescript
interface UpdateSetRequest {
  weight: number;  // required, min 0
  reps: number;    // required, min 0
}
```

**Response:**
```typescript
interface UpdateSetResponse {
  data: SetLogResource;
  message: "Set updated successfully";
}
```

---

### Delete a Set
```
DELETE /api/workout-sessions/{session}/sets/{setLog}
```
*Requires authentication (owner only)*

**Response:**
```typescript
interface DeleteSetResponse {
  message: "Set deleted successfully";
}
```

**Note:** Only the last set for an exercise can be deleted.

---

### Add Exercise to Session
```
POST /api/workout-sessions/{session}/exercises
```
*Requires authentication (owner only)*

**Request Body:**
```typescript
interface AddSessionExerciseRequest {
  exercise_id: number;       // required, must exist
  order?: number;            // optional, min 0, defaults to end
  target_sets?: number;      // optional, min 1, defaults to 3
  target_reps?: number;      // optional, min 1, defaults to 10
  target_weight?: number;    // optional, min 0, defaults to 0
  rest_seconds?: number;     // optional, min 0, uses exercise default
}
```

**Response (201 Created):**
```typescript
interface AddSessionExerciseResponse {
  data: WorkoutSessionExerciseResource;
  message: "Exercise added to session successfully";
}
```

---

### Update Session Exercise
```
PUT /api/workout-sessions/{session}/exercises/{exercise}
```
*Requires authentication (owner only)*

**Note:** `{exercise}` is the `WorkoutSessionExercise` ID.

**Request Body:**
```typescript
interface UpdateSessionExerciseRequest {
  order?: number;            // optional, min 0
  target_sets?: number;      // optional, min 1
  target_reps?: number;      // optional, min 1
  target_weight?: number;    // optional, min 0
  rest_seconds?: number;     // optional, min 0
}
```

**Response:**
```typescript
interface UpdateSessionExerciseResponse {
  data: WorkoutSessionExerciseResource;
  message: "Exercise updated successfully";
}
```

---

### Remove Exercise from Session
```
DELETE /api/workout-sessions/{session}/exercises/{exercise}
```
*Requires authentication (owner only)*

**Note:** Also deletes all associated set logs for this exercise.

**Response:**
```typescript
interface RemoveSessionExerciseResponse {
  message: "Exercise removed from session successfully";
}
```

---

### Reorder Session Exercises
```
POST /api/workout-sessions/{session}/exercises/reorder
```
*Requires authentication (owner only)*

**Request Body:**
```typescript
interface ReorderSessionExercisesRequest {
  exercise_ids: number[];  // Array of WorkoutSessionExercise IDs in desired order
}
```

**Response:**
```typescript
interface ReorderSessionExercisesResponse {
  data: WorkoutSessionExerciseResource[];
  message: "Exercises reordered successfully";
}
```

---

## Complete TypeScript Definitions

### Enums and Constants

```typescript
// Fitness Goal
type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'strength' | 'general_fitness';

// Gender
type Gender = 'male' | 'female' | 'other';

// Training Experience
type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';

// Strength Level
type StrengthLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Balance Level
type BalanceLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_IMPROVEMENT';

// Trend Direction
type TrendDirection = 'up' | 'down' | 'same';

// Body Region
type BodyRegion = 'upper' | 'lower' | 'core';

// Day of Week (for planner)
// 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
```

### Resource Interfaces

```typescript
// ============================================
// USER RESOURCES
// ============================================

interface UserResource {
  id: number;
  name: string;
  email: string;
  profile_photo: string;  // Full URL
  profile: UserProfileResource | null;
  partner: UserPartner | null;
  email_verified_at: string | null;  // ISO 8601
  created_at: string;                 // ISO 8601
  updated_at: string;                 // ISO 8601
}

interface UserProfileResource {
  fitness_goal: FitnessGoal | null;
  age: number | null;
  gender: Gender | null;
  height: number | null;              // in cm
  weight: number | null;              // in kg
  training_experience: TrainingExperience | null;
  training_days_per_week: number | null;  // 1-7
  workout_duration_minutes: number | null;
}

interface UserPartner {
  id: number;
  name: string;
  slug: string;
  visual_identity: PartnerVisualIdentityResource | null;
}

// ============================================
// PARTNER RESOURCES
// ============================================

interface PartnerVisualIdentityResource {
  // Core branding
  primary_color: string | null;
  secondary_color: string | null;
  logo: string;  // Full URL
  font_family: string | null;
  
  // Essential colors
  background_color: string | null;
  card_background_color: string | null;
  text_primary_color: string | null;
  text_secondary_color: string | null;
  text_on_primary_color: string | null;
  
  // Semantic colors
  success_color: string | null;
  warning_color: string | null;
  danger_color: string | null;
  
  // Optional styling
  accent_color: string | null;
  border_color: string | null;
  background_image: string;  // Full URL
  
  // Dark mode colors
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

interface ExerciseResource {
  id: number;
  category: CategoryResource | null;
  muscle_groups: MuscleGroupResource[] | null;
  primary_muscle_groups: MuscleGroupResource[] | null;
  secondary_muscle_groups: MuscleGroupResource[] | null;
  name: string;
  description: string | null;
  muscle_group_image: string | null;  // Full URL
  image: string | null;               // Full URL
  video: string | null;               // Full URL
  default_rest_sec: number;
  created_at: string;
  updated_at: string;
}

interface ExerciseHistoryResource {
  exercise_id: number;
  exercise_name: string;
  stats: ExerciseHistoryStats;
  performance_data: PerformanceDataPoint[];
}

interface ExerciseHistoryStats {
  current_weight: number;      // Most recent weight used (kg)
  best_weight: number;         // Highest weight ever used (kg)
  progress_percentage: number; // Percentage change from first to most recent
  total_sessions: number;      // Total number of completed sessions
  first_session_date: string | null; // ISO date string (YYYY-MM-DD)
  last_session_date: string | null; // ISO date string (YYYY-MM-DD)
}

interface PerformanceDataPoint {
  date: string;                // ISO date string (YYYY-MM-DD)
  session_id: number;          // Workout session ID
  weight: number;              // Best/max weight used in that session (kg)
  reps: number;                // Total reps across all sets
  volume: number;              // Total volume = sum of (weight × reps)
  sets: number;                // Number of sets performed
}

interface CategoryResource {
  id: number;
  type: 'workout';
  name: string;  // Equipment type name (e.g., "Bodyweight", "Dumbbell", "Barbell")
  slug: string;  // Equipment type slug (e.g., "bodyweight", "dumbbell", "barbell")
  display_order: number;
  icon: string | null;  // Emoji icon
  color: string | null;  // Hex color
  created_at: string;
  updated_at: string;
  exercises?: ExerciseResource[];  // Only present when loaded via relationship
}

// Available category slugs:
type CategorySlug = 
  | 'bodyweight'
  | 'dumbbell'
  | 'barbell'
  | 'machine-plate-loaded'
  | 'machine-cable'
  | 'cable'
  | 'bands'
  | 'trx';

interface MuscleGroupResource {
  id: number;
  name: string;  // e.g., "Chest", "Biceps", "Quadriceps"
  body_region: BodyRegion;
  is_primary?: boolean;  // Only present when loaded via exercise relationship
  created_at: string;
  updated_at: string;
}

// Available muscle groups (17 total):
// Upper: Chest, Lats, Upper Back, Lower Back, Front Delts, Side Delts, 
//        Rear Delts, Traps, Biceps, Triceps, Forearms
// Lower: Quadriceps, Hamstrings, Glutes, Calves
// Core:  Abs, Obliques

// ============================================
// PLAN RESOURCES
// ============================================

interface PlanResource {
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

interface WorkoutTemplateResource {
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

interface TemplateExercise {
  id: number;  // Exercise ID
  name: string;
  description: string;
  image: string | null;  // Full URL
  video: string | null;  // Full URL
  muscle_group_image: string | null;  // Full URL
  default_rest_sec: number;
  category: CategoryResource | null;
  muscle_groups: MuscleGroupResource[];
  pivot: TemplateExercisePivot;
}

interface TemplateExercisePivot {
  id: number;              // WorkoutTemplateExercise ID (pivot record)
  order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  rest_seconds: number | null;
}

// ============================================
// WORKOUT SESSION RESOURCES
// ============================================

interface WorkoutSessionResource {
  id: number;
  user_id: number;
  workout_template_id: number | null;
  performed_at: string;      // ISO 8601
  completed_at: string | null;
  notes: string | null;
  exercises: WorkoutSessionExerciseResource[];
  set_logs: SetLogResource[];
  created_at: string;
  updated_at: string;
}

interface WorkoutSessionCalendarResource {
  id: number;
  date: string;                       // YYYY-MM-DD
  completed: boolean;
  workout_template_id: number | null;
  workout_name: string | null;
  duration_minutes: number | null;
}

interface WorkoutSessionExerciseResource {
  id: number;  // WorkoutSessionExercise ID
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

interface SetLogResource {
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

// ============================================
// FITNESS METRICS RESOURCES
// ============================================

interface FitnessMetrics {
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
    muscle_groups: Record<string, number>;  // Muscle name -> percentage
  };
  weekly_progress: {
    percentage: number;
    trend: TrendDirection;
    current_week_workouts: number;
    previous_week_workouts: number;
  };
}
```

---

## Error Responses

### 401 Unauthorized
```typescript
interface UnauthorizedError {
  message: "Unauthenticated.";
}
```

### 403 Forbidden
```typescript
interface ForbiddenError {
  message: "Unauthorized";
}
// or
interface ForbiddenError {
  message: "Only system administrators can update exercises.";
}
// or
interface ForbiddenError {
  message: "Exercise does not belong to this session.";
}
```

### 404 Not Found
```typescript
interface NotFoundError {
  message: string;  // e.g., "No query results for model [App\\Models\\Exercise] 123"
}
```

### 422 Validation Error
```typescript
interface ValidationError {
  message: "The given data was invalid.";
  errors: Record<string, string[]>;
}

// Example:
{
  message: "The given data was invalid.",
  errors: {
    name: ["The name field is required."],
    email: ["The email has already been taken."],
    category_id: ["The selected category must be a workout category."]
  }
}
```

---

## API Quick Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login user |
| POST | `/api/logout` | Logout user |

### User & Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | Get current user |
| GET | `/api/profile` | Get user profile |
| PUT/PATCH | `/api/profile` | Update profile |
| DELETE | `/api/profile/photo` | Delete profile photo |
| GET | `/api/user/fitness-metrics` | Get fitness metrics |

### Exercises
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exercises` | List all exercises |
| GET | `/api/exercises/{id}` | Get single exercise |
| GET | `/api/exercises/{id}/history` | Get exercise performance history |
| POST | `/api/exercises` | Create exercise (admin) |
| PUT/PATCH | `/api/exercises/{id}` | Update exercise (admin) |
| DELETE | `/api/exercises/{id}` | Delete exercise (admin) |

### Muscle Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/muscle-groups` | List muscle groups |
| GET | `/api/muscle-groups/{id}` | Get muscle group |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/{id}` | Get single category |

### Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | List user's plans |
| GET | `/api/plans/{id}` | Get single plan |
| POST | `/api/plans` | Create plan |
| PUT/PATCH | `/api/plans/{id}` | Update plan |
| DELETE | `/api/plans/{id}` | Delete plan |

### Workout Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workout-templates` | List templates |
| GET | `/api/workout-templates/{id}` | Get template |
| POST | `/api/workout-templates` | Create template |
| PUT/PATCH | `/api/workout-templates/{id}` | Update template |
| DELETE | `/api/workout-templates/{id}` | Delete template |
| POST | `/api/workout-templates/{id}/exercises` | Add exercise |
| PUT | `/api/workout-templates/{id}/exercises/{exerciseId}` | Update exercise |
| DELETE | `/api/workout-templates/{id}/exercises/{exerciseId}` | Remove exercise |
| POST | `/api/workout-templates/{id}/order` | Reorder exercises |

### Workout Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planner/weekly` | Get weekly planner |
| POST | `/api/planner/assign` | Assign template to day |
| POST | `/api/planner/unassign` | Unassign template |

### Workout Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workout-sessions/calendar?start_date=&end_date=` | Get calendar view |
| GET | `/api/workout-sessions/today` | Get today's workout |
| POST | `/api/workout-sessions/start` | Start session |
| GET | `/api/workout-sessions/{id}` | Get session details |
| POST | `/api/workout-sessions/{id}/complete` | Complete session |
| DELETE | `/api/workout-sessions/{id}/cancel` | Cancel session |
| POST | `/api/workout-sessions/{id}/sets` | Log set |
| PUT | `/api/workout-sessions/{id}/sets/{setId}` | Update set |
| DELETE | `/api/workout-sessions/{id}/sets/{setId}` | Delete set |
| POST | `/api/workout-sessions/{id}/exercises` | Add exercise |
| PUT | `/api/workout-sessions/{id}/exercises/{exerciseId}` | Update exercise |
| DELETE | `/api/workout-sessions/{id}/exercises/{exerciseId}` | Remove exercise |
| POST | `/api/workout-sessions/{id}/exercises/reorder` | Reorder exercises |

---

## Usage Examples

### Example: Complete Authentication Flow

```typescript
// 1. Register
const registerResponse = await fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    password_confirmation: 'password123'
  })
});
const { token, user } = await registerResponse.json();

// 2. Use token for subsequent requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

### Example: Start and Track a Workout

```typescript
// 1. Start session from template
const startResponse = await fetch('/api/workout-sessions/start', {
  method: 'POST',
  headers,
  body: JSON.stringify({ template_id: 1 })
});
const { data: session } = await startResponse.json();

// 2. Log sets as user completes them
await fetch(`/api/workout-sessions/${session.id}/sets`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    exercise_id: 1,
    set_number: 1,
    weight: 80,
    reps: 10
  })
});

// 3. Complete the workout
await fetch(`/api/workout-sessions/${session.id}/complete`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ notes: 'Great workout!' })
});
```

### Example: Create a Complete Workout Plan

```typescript
// 1. Create a plan
const planResponse = await fetch('/api/plans', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    name: 'My PPL Program',
    description: 'Push/Pull/Legs split',
    is_active: true
  })
});
const { data: plan } = await planResponse.json();

// 2. Create templates for each day
const pushTemplate = await fetch('/api/workout-templates', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    plan_id: plan.id,
    name: 'Push Day',
    day_of_week: 0  // Monday
  })
});

// 3. Add exercises to template
await fetch(`/api/workout-templates/${pushTemplate.data.id}/exercises`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    exercise_id: 1,  // Bench Press
    target_sets: 4,
    target_reps: 8,
    target_weight: 80
  })
});
```

---

## Important Notes

1. **Day of Week Mapping**: 0 = Monday through 6 = Sunday
2. **Pivot IDs**: When managing exercises in templates/sessions, use the pivot record ID, not the exercise ID
3. **Set Deletion**: Only the last set for an exercise can be deleted
4. **Session Uniqueness**: Only one active (uncompleted) session per day per user
5. **Authorization**: Users can only access their own plans, templates, and sessions
6. **File Uploads**: Profile photos max 2MB, exercise images max 5MB, videos max 50MB
7. **Weight Format**: Stored as decimals, may be returned as strings in JSON
