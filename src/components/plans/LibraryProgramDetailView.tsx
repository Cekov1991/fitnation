import { useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Dumbbell } from 'lucide-react';
import { ProgramWeekCard } from './ProgramWeekCard';
import type { LibraryProgramResource, WorkoutTemplateResource, TemplateExercise } from '../../types/api';

interface LibraryProgramDetailViewProps {
  program: LibraryProgramResource;
  onBack: () => void;
  onStartProgram: () => void;
}

function groupWorkoutsByWeek(workoutTemplates: WorkoutTemplateResource[] | null): { weekNumber: number; workouts: WorkoutTemplateResource[] }[] {
  if (!workoutTemplates || workoutTemplates.length === 0) return [];

  const weekMap = new Map<number, WorkoutTemplateResource[]>();
  workoutTemplates.forEach((template) => {
    const weekNum = template.week_number || 1;
    if (!weekMap.has(weekNum)) weekMap.set(weekNum, []);
    weekMap.get(weekNum)!.push(template);
  });
  weekMap.forEach((workouts) => {
    workouts.sort((a, b) => a.order_index - b.order_index);
  });
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, workouts]) => ({ weekNumber, workouts }));
}

export function LibraryProgramDetailView({ program, onBack, onStartProgram }: LibraryProgramDetailViewProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplateResource | null>(null);
  const programWeeks = useMemo(() => groupWorkoutsByWeek(program.workout_templates), [program.workout_templates]);

  const handleWorkoutClick = (templateId: number) => {
    const workout = program.workout_templates?.find((t) => t.id === templateId) ?? null;
    setSelectedWorkout(workout);
  };

  if (selectedWorkout) {
    const exercises = selectedWorkout.exercises ?? [];
    return (
      <div
        className="min-h-screen w-full pb-32"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <main className="relative z-10 max-w-md mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedWorkout(null)}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: 'var(--color-border-subtle)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
            </button>
            <h1
              className="text-2xl font-bold flex-1 min-w-0"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {selectedWorkout.name}
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
            <div className="space-y-2">
              {exercises.map((ex: TemplateExercise) => {
                const sets = ex.pivot?.target_sets ?? 0;
                const reps = ex.pivot?.target_reps ?? 0;
                const weight = ex.pivot?.target_weight ?? 0;
                return (
                  <div
                    key={ex.pivot?.id ?? ex.id}
                    className="flex items-center gap-4 p-4 border rounded-2xl"
                    style={{
                      borderColor: 'var(--color-border-subtle)',
                      backgroundColor: 'var(--color-bg-surface)'
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                    >
                      <Dumbbell className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />
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
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

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
            {program.name}
          </h1>
        </div>

        {/* Cover + description */}
        <div
          className="border rounded-2xl overflow-hidden relative mb-6 min-h-[140px] bg-cover bg-center"
          style={{
            backgroundColor: program.cover_image ? undefined : 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
            ...(program.cover_image && { backgroundImage: `url(${program.cover_image})` })
          }}
        >
          {program.cover_image && (
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
                  {program.description || 'No description available.'}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'white' }} />
                    <span className="text-xs font-bold" style={{ color: 'white' }}>
                      {program.duration_weeks} WEEKS
                    </span>
                  </div>
                  {program.workout_templates && program.workout_templates.length > 0 && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
                    >
                      <span className="text-xs font-bold" style={{ color: 'white' }}>
                        {program.workout_templates.length} WORKOUTS
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {!program.cover_image && (
            <div className="p-6">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {program.description || 'No description available.'}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-border-subtle)' }}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                  <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {program.duration_weeks} WEEKS
                  </span>
                </div>
                {program.workout_templates && program.workout_templates.length > 0 && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-border-subtle)' }}
                  >
                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {program.workout_templates.length} WORKOUTS
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Weeks / workouts */}
        {programWeeks.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-primary)' }}>
              Program structure
            </h2>
            <div className="relative">
              <div
                className="absolute left-[9px] top-8 bottom-8 w-0.5"
                style={{ backgroundColor: 'var(--color-border)' }}
              />
              <div className="space-y-4 relative">
                {programWeeks.map((week) => (
                  <div key={week.weekNumber} className="flex items-start">
                    <div className="relative z-10 mt-6 mr-4">
                      <div
                        className="w-5 h-5 rounded-full border-2"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border)'
                        }}
                      />
                    </div>
                    <div className="flex-1" style={{ minWidth: 0, maxWidth: '100%' }}>
                      <ProgramWeekCard
                        weekNumber={week.weekNumber}
                        workouts={week.workouts}
                        isActive={false}
                        accentColor="var(--color-primary)"
                        nextWorkoutId={null}
                        onWorkoutClick={handleWorkoutClick}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
            <p className="text-sm">No workouts in this program.</p>
          </div>
        )}

        {/* Start Program */}
        <button
          type="button"
          onClick={onStartProgram}
          className="w-full py-3 rounded-xl font-bold transition-all"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white'
          }}
        >
          Start Program
        </button>
      </main>
    </div>
  );
}
