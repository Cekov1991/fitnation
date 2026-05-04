import { Dumbbell, ArrowLeft } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import { useStartSession, useTodayWorkout } from '@fit-nation/shared';
import type { RoutinePlanResource, WorkoutTemplateResource } from '@fit-nation/shared';

interface BrowsableRoutineDetailViewProps {
  routine: RoutinePlanResource;
  onBack: () => void;
}

export function BrowsableRoutineDetailView({ routine, onBack }: BrowsableRoutineDetailViewProps) {
  const history = useHistory();
  const startSession = useStartSession();
  const { data: todayWorkout } = useTodayWorkout();

  const handleViewWorkoutDetails = (workoutId: number) => {
    history.push(`/routines/${routine.id}/workouts/${workoutId}`, { from: `/routines/${routine.id}` });
  };

  const handleStartWorkout = async (templateId: number) => {
    const activeSession = todayWorkout?.session;
    if (activeSession && !activeSession.completed_at && activeSession.workout_template_id === templateId) {
      history.push(`/session/${activeSession.id}`);
      return;
    }

    try {
      const response = await startSession.mutateAsync(templateId);
      const session = response.data?.session || response.data;
      if (session?.id) {
        history.push(`/session/${session.id}`);
      }
    } catch (error) {
      console.error('Failed to start workout:', error);
    }
  };

  return (
    <div
      className="min-h-screen w-full pb-32"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <main className="relative z-10 max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-border-subtle)' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
          </button>
          <h1
            className="text-2xl font-bold bg-clip-text text-transparent flex-1 min-w-0"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            {routine.name}
          </h1>
        </div>

        {/* Cover + description */}
        <div
          className="border rounded-2xl overflow-hidden relative mb-6 min-h-[140px] bg-cover bg-center"
          style={{
            backgroundColor: routine.cover_image ? undefined : 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
            ...(routine.cover_image && { backgroundImage: `url(${routine.cover_image})` })
          }}
        >
          {routine.cover_image && (
            <>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                aria-hidden
              />
              <div className="relative z-10 p-6">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  {routine.description || 'No description available.'}
                </p>
                {routine.workout_templates && routine.workout_templates.length > 0 && (
                  <div className="flex items-center gap-3 mt-4">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
                    >
                      <Dumbbell className="w-4 h-4 flex-shrink-0" style={{ color: 'white' }} />
                      <span className="text-xs font-bold" style={{ color: 'white' }}>
                        {routine.workout_templates.length} WORKOUTS
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {!routine.cover_image && (
            <div className="p-6">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {routine.description || 'No description available.'}
              </p>
              {routine.workout_templates && routine.workout_templates.length > 0 && (
                <div className="flex items-center gap-3 mt-4">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-border-subtle)' }}
                  >
                    <Dumbbell className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {routine.workout_templates.length} WORKOUTS
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workouts List */}
        {routine.workout_templates && routine.workout_templates.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-primary)' }}>
              Workouts
            </h2>
            <div className="space-y-3">
              {routine.workout_templates.map((workout: WorkoutTemplateResource) => {
                const exerciseCount = workout.exercises?.length ?? 0;
                const activeSession = todayWorkout?.session;
                const hasActiveSession = activeSession && !activeSession.completed_at && activeSession.workout_template_id === workout.id;
                
                return (
                  <div
                    key={workout.id}
                    className="border rounded-2xl p-4 transition-all"
                    style={{
                      borderColor: 'var(--color-border-subtle)',
                      backgroundColor: 'var(--color-bg-surface)'
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {workout.name}
                        </h3>
                        {workout.description && (
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {workout.description}
                          </p>
                        )}
                        {exerciseCount > 0 && (
                          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewWorkoutDetails(workout.id)}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartWorkout(workout.id)}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          backgroundColor: hasActiveSession ? 'var(--color-secondary)' : 'var(--color-primary)',
                          color: 'white'
                        }}
                      >
                        {hasActiveSession ? 'Continue' : 'Start'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 mb-6 text-center"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <p className="text-sm">No workouts in this routine.</p>
          </div>
        )}
      </main>
    </div>
  );
}
