import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';
import { QuickStartCard } from './QuickStartCard';
import { WorkoutCardSmall } from './WorkoutCardSmall';
import { RoutineCardSmall } from './RoutineCardSmall';
import { CreateCustomPlanCard } from './CreateCustomPlanCard';
import { AIGeneratorCard } from './AIGeneratorCard';
import { CustomPlansDashboardSkeleton } from './CustomPlansDashboardSkeleton';
import { usePlans, useBrowsableRoutines, useStartSession, useTodayWorkout } from '@fit-nation/shared';
import { estimateWorkoutDuration } from '@fit-nation/shared';
import type { PlanResource, WorkoutTemplateResource, RoutinePlanResource } from '@fit-nation/shared';

interface CustomPlansDashboardProps {
  onStartBlankSession: () => void;
}

// Helper to calculate workout stats
function calculateWorkoutStats(template: WorkoutTemplateResource) {
  const exercises = template.exercises || [];
  const exerciseCount = exercises.length;
  const duration = estimateWorkoutDuration(exercises);

  return {
    duration: duration > 0 ? `${duration} min` : 'N/A',
    exerciseCount: exerciseCount || 0
  };
}

export function CustomPlansDashboard({ onStartBlankSession }: CustomPlansDashboardProps) {
  const history = useHistory();
  const { data: plans = [], isLoading } = usePlans();
  const startSession = useStartSession();
  const { data: todayWorkout } = useTodayWorkout();

  // Get active plan
  const activePlan = useMemo(() => {
    return plans.find((plan: PlanResource) => plan.is_active) || null;
  }, [plans]);

  // Get workouts from active plan, sorted by day_of_week
  const activePlanWorkouts = useMemo(() => {
    if (!activePlan?.workout_templates) return [];
    
    return activePlan.workout_templates
      .slice()
      .sort((a: WorkoutTemplateResource, b: WorkoutTemplateResource) => {
        if (a.day_of_week === null && b.day_of_week === null) return 0;
        if (a.day_of_week === null) return 1;
        if (b.day_of_week === null) return -1;
        return a.day_of_week - b.day_of_week;
      })
      .map((template: WorkoutTemplateResource) => {
        const stats = calculateWorkoutStats(template);
        return {
          ...template,
          ...stats
        };
      });
  }, [activePlan]);

  // Helper to check if a template has an active session
  const getActiveSessionForTemplate = (templateId: number) => {
    const activeSession = todayWorkout?.session;
    if (activeSession && !activeSession.completed_at && activeSession.workout_template_id === templateId) {
      return activeSession;
    }
    return null;
  };

  const handleWorkoutClick = (templateId: number) => {
    history.push(`/workouts/${templateId}/exercises`, { returnPath: '/dashboard?type=customPlans' });
  };

  const handleStartWorkout = async (templateId: number) => {
    const activeSession = getActiveSessionForTemplate(templateId);
    if (activeSession?.id) {
      // Continue existing session
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

  const handleCreatePlan = () => {
    history.push('/plans/create');
  };

  const handleGenerateWorkout = () => {
    history.push('/generate-workout');
  };

  const handleViewRoutine = (routine: RoutinePlanResource) => {
    history.push(`/routines/${routine.id}`, { from: '/dashboard?type=customPlans' });
  };

  const { data: browsableRoutines = [] } = useBrowsableRoutines();

  if (isLoading) {
    return <CustomPlansDashboardSkeleton />;
  }

  return (
    <div className="pb-24">
      <div className="space-y-8">
        <AIGeneratorCard onGenerate={handleGenerateWorkout} />

        {/* Browsable Routines Section */}
        {browsableRoutines.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4 px-1">
              <h2
                className="font-bold text-lg"
                style={{ color: 'var(--color-primary)' }}
              >
                Recomended Workouts
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {browsableRoutines.map((routine: RoutinePlanResource) => (
                <div key={routine.id} className="w-[200px] min-w-[200px] flex-shrink-0">
                  <RoutineCardSmall
                    routine={routine}
                    onClick={() => handleViewRoutine(routine)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Active Plan Workouts Section */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 
              className="font-bold text-lg"
              style={{ color: 'var(--color-primary)' }}
            >
              {activePlan ? activePlan.name : 'My Custom Plans'}
            </h2>
            {activePlan && (
              <button 
                onClick={() => history.push('/plans?type=customPlans')}
                className="text-sm transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                See all
              </button>
            )}
          </div>

          {activePlan && activePlanWorkouts.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {activePlanWorkouts.map((workout: WorkoutTemplateResource & { duration: string; exerciseCount: number }) => {
                const activeSession = getActiveSessionForTemplate(workout.id);
                return (
                  <div key={workout.id} className="w-[180px] min-w-[180px] flex-shrink-0">
                    <WorkoutCardSmall
                      name={workout.name}
                      duration={workout.duration}
                      exerciseCount={workout.exerciseCount}
                      icon={<ArrowUpDown size={18} />}
                      onClick={() => handleWorkoutClick(workout.id)}
                      onStart={() => handleStartWorkout(workout.id)}
                      hasActiveSession={!!activeSession}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-4 -mx-1 px-1">
              <div className="w-[160px] min-w-[160px] flex-shrink-0">
                <CreateCustomPlanCard onClick={handleCreatePlan} />
              </div>
            </div>
          )}
        </div>

        {/* Quick Start Card */}
        <QuickStartCard onStartBlankSession={onStartBlankSession} />
      </div>
    </div>
  );
}
