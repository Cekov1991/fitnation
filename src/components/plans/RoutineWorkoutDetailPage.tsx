import { useMemo } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import { LoadingContent } from '../ui';
import { ExerciseImage } from '../ExerciseImage';
import { useBrowsableRoutine, useStartSession, useTodayWorkout } from '../../hooks/useApi';
import type { TemplateExercise } from '../../types/api';

interface RoutineWorkoutDetailPageProps {
  routineId: number;
  workoutId: number;
  onBack: () => void;
}

export function RoutineWorkoutDetailPage({ routineId, workoutId, onBack }: RoutineWorkoutDetailPageProps) {
  const history = useHistory();
  const startSession = useStartSession();
  const { data: todayWorkout } = useTodayWorkout();

  const {
    data: routine,
    isLoading,
    isError,
    error,
    refetch
  } = useBrowsableRoutine(routineId);

  const workout = useMemo(() => {
    if (!routine?.workout_templates) return null;
    return routine.workout_templates.find(w => w.id === workoutId) ?? null;
  }, [routine, workoutId]);

  const handleViewExercise = (exerciseName: string) => {
    history.push(`/exercises/${encodeURIComponent(exerciseName)}`);
  };

  const handleStartWorkout = async () => {
    const activeSession = todayWorkout?.session;
    if (activeSession && !activeSession.completed_at && activeSession.workout_template_id === workoutId) {
      history.push(`/session/${activeSession.id}`);
      return;
    }

    try {
      const response = await startSession.mutateAsync(workoutId);
      const session = response.data?.session || response.data;
      if (session?.id) {
        history.push(`/session/${session.id}`);
      }
    } catch (err) {
      console.error('Failed to start workout:', err);
    }
  };

  if (isLoading || isError || !workout) {
    return (
      <div
        className="min-h-screen w-full pb-32"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <main className="relative z-10 max-w-md mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: 'var(--color-border-subtle)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
            </button>
          </div>
          <LoadingContent
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
          >
            {!workout && !isLoading && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Workout not found.</p>
              </div>
            )}
          </LoadingContent>
        </main>
      </div>
    );
  }

  const exercises = workout.exercises ?? [];
  const activeSession = todayWorkout?.session;
  const hasActiveSession = activeSession && !activeSession.completed_at && activeSession.workout_template_id === workoutId;

  return (
    <div
      className="min-h-screen w-full pb-32"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <main className="relative z-10 max-w-md mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-border-subtle)' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
          </button>
          <h1
            className="text-2xl font-bold flex-1 min-w-0"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {workout.name}
          </h1>
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Exercises
        </h2>

        {exercises.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' }}
          >
            <p className="text-sm">No exercises in this workout.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {exercises.map((ex: TemplateExercise) => {
              const sets = ex.pivot?.target_sets ?? 0;
              const reps = ex.pivot?.target_reps ?? 0;
              const weight = ex.pivot?.target_weight ?? 0;
              return (
                <div
                  key={ex.pivot?.id ?? ex.id}
                  onClick={() => handleViewExercise(ex.name)}
                  className="w-full flex items-center gap-4 p-1 border rounded-2xl transition-colors cursor-pointer"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    backgroundColor: 'var(--color-bg-surface)'
                  }}
                >
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden relative">
                    <ExerciseImage src={ex.image} alt={ex.name} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {ex.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {sets} sets · {reps} reps
                      {weight != null && weight > 0 ? ` · ${weight} kg` : ' · 0 kg'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0 mr-3" style={{ color: 'var(--color-text-muted)' }} />
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={handleStartWorkout}
          className="w-full py-3 rounded-xl font-bold transition-all"
          style={{
            backgroundColor: hasActiveSession ? 'var(--color-secondary)' : 'var(--color-primary)',
            color: 'white'
          }}
        >
          {hasActiveSession ? 'Continue Workout' : 'Start Workout'}
        </button>
      </main>
    </div>
  );
}
