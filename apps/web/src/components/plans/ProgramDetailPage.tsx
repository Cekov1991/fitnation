import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { ProgramWeekCard } from './ProgramWeekCard';
import { LoadingContent } from '../ui';
import { ProgramDetailPageSkeleton } from './ProgramDetailPageSkeleton';
import { useProgram } from '../../hooks/useApi';
import type { ProgramResource, WorkoutTemplateResource } from '../../types/api';

interface ProgramDetailPageProps {
  programId: number;
  onBack: () => void;
  onNavigateToWorkout: (templateId: number) => void;
}

function groupWorkoutsByWeek(program: ProgramResource) {
  if (!program?.workout_templates) return [];

  const weekMap = new Map<number, WorkoutTemplateResource[]>();

  program.workout_templates.forEach((template: WorkoutTemplateResource) => {
    const weekNum = template.week_number || 1;
    if (!weekMap.has(weekNum)) {
      weekMap.set(weekNum, []);
    }
    weekMap.get(weekNum)!.push(template);
  });

  weekMap.forEach((workouts) => {
    workouts.sort((a, b) => a.order_index - b.order_index);
  });

  const currentActiveWeek = program.current_active_week ?? 1;
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, workouts]) => ({
      weekNumber,
      workouts,
      isActive: weekNumber === currentActiveWeek && program.is_active,
    }));
}

export function ProgramDetailPage({ programId, onBack, onNavigateToWorkout }: ProgramDetailPageProps) {
  const history = useHistory();
  const { data: program, isLoading, isError, error, refetch } = useProgram(programId);

  const programWeeks = useMemo(() => {
    if (!program) return [];
    return groupWorkoutsByWeek(program);
  }, [program]);

  const handleCompletedDayClick = (sessionId: number) => {
    history.push(`/sessions/${sessionId}`, { navPage: 'plans' });
  };

  const programDetailHeader = (
    <div className="flex items-center gap-4 mb-6">
      <button
        type="button"
        onClick={onBack}
        className="p-2 rounded-full transition-colors"
        style={{ backgroundColor: 'var(--color-border-subtle)' }}
      >
        <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
      </button>
      <h1
        className="text-2xl font-bold bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
      >
        Program Details
      </h1>
    </div>
  );

  const errorMessage = error instanceof Error ? error.message : error || 'Something went wrong';

  return (
    <div
      className="min-h-screen w-full pb-32"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <main className="relative z-10 max-w-md mx-auto px-4 py-8">
        <LoadingContent
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
          loadingFallback={<ProgramDetailPageSkeleton />}
          errorFallback={
            <>
              {programDetailHeader}
              <div
                className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border"
                style={{
                  backgroundColor: 'color-mix(in srgb, #ef4444 10%, transparent)',
                  borderColor: 'color-mix(in srgb, #ef4444 30%, transparent)',
                }}
              >
                <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                <p className="text-sm text-red-400 text-center mb-4">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'color-mix(in srgb, #ef4444 20%, transparent)',
                    color: '#f87171',
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </>
          }
        >
          <>
            {programDetailHeader}

            {program && (
            <>
              {/* Program Info */}
              <div
                className="rounded-2xl overflow-hidden mb-6"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {program.cover_image && (
                  <div className="relative min-h-[140px] w-full">
                    <div
                      className="min-h-[140px] w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${program.cover_image})` }}
                      aria-hidden
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                      aria-hidden
                    />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {program.name}
                  </h2>
                  {program.description && (
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {program.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] font-bold uppercase px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {program.duration_weeks} Weeks
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {program.workout_templates?.length || 0} Workouts
                    </span>
                    {program.is_active && (
                      <span
                        className="text-[10px] font-bold uppercase px-3 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80' }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {programWeeks.length > 0 && (
                <div className="relative">
                  {/* Timeline line */}
                  <div
                    className="absolute left-[9px] top-8 bottom-8 w-0.5"
                    style={{ backgroundColor: 'var(--color-border)' }}
                  />

                  {/* Week cards */}
                  <div className="space-y-4 relative">
                    {programWeeks.map((week) => (
                      <div key={week.weekNumber} className="flex items-start">
                        {/* Timeline dot */}
                        <div className="relative z-10 mt-6 mr-4">
                          <div
                            className="w-5 h-5 rounded-full border-2"
                            style={{
                              backgroundColor: week.isActive ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                              borderColor: week.isActive ? 'var(--color-primary)' : 'var(--color-border)',
                            }}
                          />
                        </div>

                        {/* Week card */}
                        <div className="flex-1" style={{ minWidth: 0, maxWidth: '100%' }}>
                          <ProgramWeekCard
                            weekNumber={week.weekNumber}
                            workouts={week.workouts}
                            isActive={week.isActive}
                            accentColor="var(--color-primary)"
                            nextWorkoutId={program.is_active ? (program.next_workout?.id || null) : null}
                            nextWorkout={program.is_active ? (program.next_workout ?? null) : null}
                            onWorkoutClick={onNavigateToWorkout}
                            onCompletedDayClick={handleCompletedDayClick}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
            )}
          </>
        </LoadingContent>

      </main>
    </div>
  );
}
