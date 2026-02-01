import { useMemo } from 'react';
import { Clock, Dumbbell, Activity, Edit2 } from 'lucide-react';
import { ExerciseImage } from './ExerciseImage';
import { formatWeight } from './workout-session/utils';
import type { WorkoutTemplateResource, TemplateExercise } from '../types/api';

interface WorkoutCardProps {
  template: WorkoutTemplateResource | null;
  title?: string;
  onStartWorkout?: (templateId: number) => void;
  onExerciseClick?: (exerciseName: string) => void;
  onEditWorkout?: (templateId: number) => void;
}

// Type for the raw API response structure from /workout-sessions/today
interface RawWorkoutTemplateExercise {
  id: number;
  workout_template_id: number;
  exercise_id: number;
  order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: string | null;
  rest_seconds: number | null;
  exercise: {
    id: number;
    name: string;
    image: string | null;
    muscle_group_image: string | null;
    default_rest_sec: number;
    category?: {
      id: number;
      type: string;
      name: string;
    } | null;
  };
}

/**
 * Normalize exercises from either the standard format (exercises) or raw API format (workout_template_exercises)
 */
function normalizeExercises(template: WorkoutTemplateResource | null | Record<string, unknown>): TemplateExercise[] {
  if (!template) return [];

  // Check if it's the standard format (exercises array)
  if ('exercises' in template && Array.isArray(template.exercises)) {
    return template.exercises as TemplateExercise[];
  }

  // Check if it's the raw API format (workout_template_exercises array)
  if ('workout_template_exercises' in template && Array.isArray(template.workout_template_exercises)) {
    return (template.workout_template_exercises as RawWorkoutTemplateExercise[]).map((item: RawWorkoutTemplateExercise) => ({
      id: item.exercise.id,
      name: item.exercise.name,
      image: item.exercise.image,
      muscle_group_image: item.exercise.muscle_group_image || null,
      default_rest_sec: item.exercise.default_rest_sec,
      category: null, // Raw API format doesn't include full category details
      muscle_groups: [],
      pivot: {
        id: item.id,
        order: item.order,
        target_sets: item.target_sets,
        target_reps: item.target_reps,
        target_weight: item.target_weight ? parseFloat(item.target_weight) : null,
        rest_seconds: item.rest_seconds
      }
    })) as TemplateExercise[];
  }

  return [];
}

/**
 * Estimate workout duration in minutes based on exercises, sets, reps, and rest times
 */
function estimateWorkoutDuration(exercises: TemplateExercise[]): number {
  if (!exercises || exercises.length === 0) {
    return 0;
  }

  let totalMinutes = 0;

  for (const exercise of exercises) {
    const sets = exercise.pivot.target_sets || 0;
    const restSeconds = exercise.pivot.rest_seconds || exercise.default_rest_sec || 60;

    // Estimate time per set: 30 seconds for the set itself + rest time
    // For the last set, no rest time is needed
    const timePerSet = 0.5 + (restSeconds / 60); // 0.5 min for the set + rest in minutes
    const totalSetTime = sets > 0 ? (sets - 1) * timePerSet + 0.5 : 0; // Last set has no rest

    // Add 1 minute setup time per exercise
    totalMinutes += totalSetTime + 1;
  }

  // If calculation results in 0 or very low, use fallback: 3-4 minutes per exercise
  if (totalMinutes < exercises.length * 2) {
    return exercises.length * 3.5;
  }

  return Math.round(totalMinutes);
}

export function WorkoutCard({ template, title = "TODAY'S WORKOUT", onExerciseClick, onEditWorkout }: WorkoutCardProps) {
  // Normalize exercises to handle both API response formats
  const normalizedExercises = useMemo(() => normalizeExercises(template), [template]);
  const duration = useMemo(() => estimateWorkoutDuration(normalizedExercises), [normalizedExercises]);
  const exerciseCount = normalizedExercises.length;

  // Sort exercises by order
  const sortedExercises = useMemo(() => {
    if (!normalizedExercises || normalizedExercises.length === 0) return [];
    return [...normalizedExercises].sort((a, b) => (a.pivot.order || 0) - (b.pivot.order || 0));
  }, [normalizedExercises]);

  if (!template) {
    return null;
  }

  const handleExerciseClick = (exerciseName: string) => {
    if (onExerciseClick) {
      onExerciseClick(exerciseName);
    }
  };

  const handleEditClick = () => {
    if (onEditWorkout && template.id) {
      onEditWorkout(template.id);
    }
  };

  return (
    <div 
      className="rounded-2xl p-6 border"
      style={{ 
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          <h1 
            className="text-1xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            {title}
          </h1>
        </div>
        {onEditWorkout && (
          <button
            onClick={handleEditClick}
            className="p-2 rounded-full transition-colors"
            style={{ 
              backgroundColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Workout Title */}
      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        {template.name}
      </h2>

      {/* Duration and Exercise Count */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {duration} min
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {exerciseCount} exercises
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-border-subtle)' }} />

      {/* Workout Plan Section */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-primary)' }}>
          WORKOUT PLAN
        </h4>

        {/* Exercise List */}
        <div className="space-y-3">
          {sortedExercises.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              No exercises in this workout
            </p>
          ) : (
            sortedExercises.map((exercise) => {
              const sets = exercise.pivot.target_sets || 0;
              const reps = exercise.pivot.target_reps || 0;
              const weight = exercise.pivot.target_weight || 0;

              return (
                <div
                  key={exercise.pivot.id}
                  onClick={() => handleExerciseClick(exercise.name)}
                  className={`flex items-center gap-4 rounded-xl transition-colors ${onExerciseClick ? 'cursor-pointer' : ''}`}
                  style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                >
                  {/* Exercise Image */}
                  <div className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden">
                    <ExerciseImage src={exercise.image} alt={exercise.name} className="w-full h-full" />
                  </div>

                  {/* Exercise Info */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold mb-1 leading-tight break-words" style={{ color: 'var(--color-text-primary)' }}>
                      {exercise.name}
                    </h5>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {sets} sets × {reps} reps × {formatWeight(weight)} kg
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
