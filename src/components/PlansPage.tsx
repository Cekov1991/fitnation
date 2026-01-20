import React, { useMemo, useState } from 'react';
import { Plus, Info, MoreVertical, Dumbbell } from 'lucide-react';
import { PlanMenu } from './PlanMenu';
import { WorkoutMenu } from './WorkoutMenu';
import { BackgroundGradients } from './BackgroundGradients';
import { LoadingContent } from './ui';
import { useDeletePlan, useDeleteTemplate, usePlans, useStartSession, useUpdatePlan } from '../hooks/useApi';
import { DAY_NAMES } from '../constants';
import type { PlanResource, WorkoutTemplateResource } from '../types/api';
interface PlansPageProps {
  onNavigateToCreate: () => void;
  onNavigateToEdit: (plan: {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
  }) => void;
  onNavigateToAddWorkout: (planName?: string) => void;
  onNavigateToEditWorkout: (workout: {
    templateId?: number;
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  }) => void;
  onNavigateToManageExercises: (workout: {
    templateId: number;
    name: string;
    description?: string;
  }) => void;
}
export function PlansPage({
  onNavigateToCreate,
  onNavigateToEdit,
  onNavigateToAddWorkout,
  onNavigateToEditWorkout,
  onNavigateToManageExercises
}: PlansPageProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuType, setMenuType] = useState<'plan' | 'workout'>('plan');
  const [currentMenuPlan, setCurrentMenuPlan] = useState<{
    id: number;
    name: string;
    description: string;
    isActive: boolean;
  } | null>(null);
  const [currentWorkout, setCurrentWorkout] = useState<{
    templateId?: number;
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  } | null>(null);
  const {
    data: plans = [],
    isLoading: isPlansLoading,
    isFetching: isPlansFetching,
    isError: isPlansError,
    error: plansError,
    refetch: refetchPlans
  } = usePlans();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const deleteTemplate = useDeleteTemplate();
  const startSession = useStartSession();

  const activePlan = useMemo(() => {
    return plans.find((plan: PlanResource) => plan.is_active) || null;
  }, [plans]);

  const activePlanWorkouts = useMemo(() => {
    if (!activePlan) return [];
    const planTemplates = activePlan.workout_templates ?? [];
    return planTemplates
      .slice() // Create a copy to avoid mutating original
      .sort((a: WorkoutTemplateResource, b: WorkoutTemplateResource) => {
        // Sort by day_of_week, null values go last
        if (a.day_of_week === null && b.day_of_week === null) return 0;
        if (a.day_of_week === null) return 1;
        if (b.day_of_week === null) return -1;
        return a.day_of_week - b.day_of_week;
      })
      .map((template: WorkoutTemplateResource) => ({
        templateId: template.id,
        name: template.name,
        description: template.description || '',
        daysOfWeek: template.day_of_week !== null ? [DAY_NAMES[template.day_of_week]] : [],
        completed: false,
        plan: activePlan.name
      }));
  }, [activePlan]);

  const allPlans = useMemo(() => {
    return plans
      .filter((plan: PlanResource) => !plan.is_active) // Exclude active plan (shown separately above)
      .map((plan: PlanResource) => {
        const planTemplates = plan.workout_templates ?? [];
        const workouts = planTemplates.length;
        const sortedTemplates = planTemplates
          .slice() // Create a copy to avoid mutating original
          .sort((a: WorkoutTemplateResource, b: WorkoutTemplateResource) => {
            // Sort by day_of_week, null values go last
            if (a.day_of_week === null && b.day_of_week === null) return 0;
            if (a.day_of_week === null) return 1;
            if (b.day_of_week === null) return -1;
            return a.day_of_week - b.day_of_week;
          });
        return {
          id: plan.id,
          name: plan.name,
          description: plan.description || '',
          workouts,
          isEmpty: workouts === 0,
          isActive: plan.is_active,
          workoutList: sortedTemplates.map((template: WorkoutTemplateResource) => ({
            templateId: template.id,
            name: template.name,
            description: template.description || '',
            daysOfWeek: template.day_of_week !== null ? [DAY_NAMES[template.day_of_week]] : []
          }))
        };
      });
  }, [plans]);

  const handleWorkoutClick = (templateId: number, name: string, description: string) => {
    onNavigateToManageExercises({
      templateId,
      name,
      description
    });
  };

  const handlePlanMenuClick = (event: React.MouseEvent, menuId: string, plan: {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
  }) => {
    event.stopPropagation();
    setCurrentMenuPlan(plan);
    setMenuType('plan');
    setOpenMenuId(menuId);
  };
  const handleWorkoutMenuClick = (event: React.MouseEvent, menuId: string, workout: {
    templateId?: number;
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  }) => {
    event.stopPropagation();
    setCurrentWorkout(workout);
    setMenuType('workout');
    setOpenMenuId(menuId);
  };
  const handleAddWorkout = () => {
    if (currentMenuPlan) {
      onNavigateToAddWorkout(currentMenuPlan.name);
    }
  };
  const handleEditPlan = () => {
    if (currentMenuPlan) {
      onNavigateToEdit(currentMenuPlan);
    }
  };
  const handleToggleActive = async () => {
    if (!currentMenuPlan) return;
    try {
      await updatePlan.mutateAsync({
        planId: currentMenuPlan.id,
        data: {
          name: currentMenuPlan.name,
          description: currentMenuPlan.description,
          is_active: !currentMenuPlan.isActive
        }
      });
    } finally {
      setOpenMenuId(null);
    }
  };
  const handleDeletePlan = async () => {
    if (!currentMenuPlan) return;
    try {
      await deletePlan.mutateAsync(currentMenuPlan.id);
    } finally {
      setOpenMenuId(null);
    }
  };
  const handleStartWorkout = async () => {
    if (!currentWorkout?.templateId) return;
    try {
      await startSession.mutateAsync(currentWorkout.templateId);
    } finally {
      setOpenMenuId(null);
    }
  };
  const handleAddExercises = () => {
    if (currentWorkout?.templateId) {
      onNavigateToManageExercises({
        templateId: currentWorkout.templateId,
        name: currentWorkout.name,
        description: currentWorkout.description
      });
    }
  };
  const handleEditWorkout = () => {
    if (currentWorkout) {
      onNavigateToEditWorkout(currentWorkout);
    }
  };
  const handleDeleteWorkout = async () => {
    if (!currentWorkout?.templateId) return;
    try {
      await deleteTemplate.mutateAsync(currentWorkout.templateId);
    } finally {
      setOpenMenuId(null);
    }
  };
  return <div>
      <div>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
        <BackgroundGradients />

      <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            Plans
          </h1>
          <button 
            onClick={onNavigateToCreate} 
            className="p-2 rounded-full transition-colors"
            style={{ 
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
            }}
          >
            <Plus className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          </button>
        </div>

        {/* Active Plan Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
              Active Plan
            </h2>
            <button className="btn-icon p-1">
              <Info className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>

          {/* Loading indicator when refetching */}
          {isPlansFetching && !isPlansLoading && (
            <div className="flex items-center justify-center gap-2 py-2 mb-2">
              <div 
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Updating plans...
              </span>
            </div>
          )}

          <LoadingContent
            isLoading={isPlansLoading}
            isError={isPlansError}
            error={plansError}
            onRetry={refetchPlans}
          >
            {/* Active Plan Card */}
            <div 
              className="relative bg-gradient-to-br   border rounded-3xl p-6 shadow-xl"
              style={{ 
                background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
                borderColor: 'var(--color-border)'
              }}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {activePlan?.name || 'No active plan'}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {activePlan?.description || 'Create a plan to get started.'}
                  </p>
                </div>
                {activePlan && <button onClick={e => handlePlanMenuClick(e, 'active-plan', {
                  id: activePlan.id,
                  name: activePlan.name,
                  description: activePlan.description || '',
                  isActive: activePlan.is_active
                })} className="p-2 rounded-full transition-colors" style={{ backgroundColor: 'var(--color-border-subtle)' }}>
                  <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                </button>}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                    {activePlanWorkouts.length} WORKOUT
                    {activePlanWorkouts.length !== 1 ? 'S' : ''}
                  </span>
                </div>
                {activePlan?.is_active && <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                    <span className="text-xs font-bold text-green-400">ACTIVE</span>
                  </div>}
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-6" />

              {/* Workouts List */}
              <div className="space-y-3">
                {activePlanWorkouts.length === 0 && <div className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                    No workouts in this plan yet.
                  </div>}
                {activePlanWorkouts.map((workout: { templateId?: number; name: string; description: string; daysOfWeek: string[]; completed: boolean; plan: string }, index: number) => <div 
                  key={workout.templateId || `${workout.name}-${index}`} 
                  className="card-hover flex items-center justify-between p-4 border rounded-xl group cursor-pointer"
                  onClick={() => workout.templateId && handleWorkoutClick(workout.templateId, workout.name, workout.description)}
                >
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
                      >
                        <Dumbbell className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <span 
                        className="text-sm font-medium text-hover-primary"
                        style={{ 
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        {workout.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={e => handleWorkoutMenuClick(e, `workout-${index}`, {
                    templateId: workout.templateId,
                    plan: activePlan?.name || workout.plan,
                    name: workout.name,
                    description: workout.description,
                    daysOfWeek: workout.daysOfWeek
                  })} className="p-1 rounded-full transition-colors" style={{ backgroundColor: 'var(--color-border-subtle)' }}>
                        <MoreVertical className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                      </button>
                    </div>
                  </div>)}
              </div>
            </div>
          </LoadingContent>
        </div>

        {/* All Plans Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-secondary)' }}>
            All Plans
          </h2>

          {/* Loading indicator when refetching */}
          {isPlansFetching && !isPlansLoading && (
            <div className="flex items-center justify-center gap-2 py-2 mb-2">
              <div 
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Updating plans...
              </span>
            </div>
          )}

          <LoadingContent
            isLoading={isPlansLoading}
            isError={isPlansError}
            error={plansError}
            onRetry={refetchPlans}
          >
            <div className="space-y-4 mb-6">
              {allPlans.length === 0 ? (
                <div className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                  No other plans yet.
                </div>
              ) : (
                allPlans.map((plan: { id: number; name: string; description: string; workouts: number; isEmpty: boolean; isActive: boolean; workoutList: { templateId: number; name: string; description: string; daysOfWeek: string[] }[] }) => <div key={plan.id} 
                  className="relative border rounded-2xl p-6"
                  style={{ 
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                    <div className="flex justify-between items-start mb-4">
                      <h3 
                        className="text-lg font-bold transition-colors"
                        style={{ color: 'var(--color-secondary)' }}
                      >
                        {plan.name}
                      </h3>
                      <button onClick={e => handlePlanMenuClick(e, `plan-${plan.id}`, plan)} className="p-2 rounded-full transition-colors" style={{ backgroundColor: 'var(--color-border-subtle)' }}>
                        <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="px-3 py-1.5 border rounded-full"
                        style={{ 
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: 'var(--color-border)'
                        }}
                      >
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                          {plan.workouts} WORKOUT{plan.workouts !== 1 ? 'S' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Workouts List */}
                    {plan.workoutList.length > 0 && (
                      <>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4" />
                        <div className="space-y-2">
                          {plan.workoutList.map((workout: { templateId: number; name: string; description: string; daysOfWeek: string[] }, idx: number) => (
                            <div 
                              key={workout.templateId || `${workout.name}-${idx}`}
                              className="card-hover flex items-center justify-between p-3 border rounded-xl cursor-pointer"
                              style={{ 
                                backgroundColor: 'var(--color-bg-elevated)',
                                borderColor: 'var(--color-border-subtle)'
                              }}
                              onClick={() => handleWorkoutClick(workout.templateId, workout.name, workout.description)}
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="p-2 rounded-lg"
                                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 10%, transparent)' }}
                                >
                                  <Dumbbell className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                                </div>
                                <span 
                                  className="text-sm font-medium"
                                  style={{ color: 'var(--color-text-primary)' }}
                                >
                                  {workout.name}
                                </span>
                              </div>
                              <button 
                                onClick={e => handleWorkoutMenuClick(e, `plan-${plan.id}-workout-${idx}`, {
                                  templateId: workout.templateId,
                                  plan: plan.name,
                                  name: workout.name,
                                  description: workout.description,
                                  daysOfWeek: workout.daysOfWeek
                                })} 
                                className="p-1 rounded-full transition-colors" 
                                style={{ backgroundColor: 'var(--color-border-subtle)' }}
                              >
                                <MoreVertical className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {plan.isEmpty && <>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4" />
                        <p className="text-sm text-center py-2" style={{ color: 'var(--color-text-muted)' }}>
                          No workout templates in this plan.
                        </p>
                      </>}
                  </div>)
              )}
            </div>
          </LoadingContent>
        </div>

        {/* Create New Button */}
        <button onClick={onNavigateToCreate} className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow relative overflow-hidden group"
        style={{
          background: 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
          boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
        }}
      >
          <span className="relative z-10">CREATE NEW</span>
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
            style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
          />
        </button>
      </main>

      {/* Plan Menu */}
      {menuType === 'plan' && <PlanMenu isOpen={openMenuId !== null} onClose={() => setOpenMenuId(null)} isActive={currentMenuPlan?.isActive ?? false} onAddWorkout={handleAddWorkout} onEdit={handleEditPlan} onToggleActive={handleToggleActive} onDelete={handleDeletePlan} isToggleLoading={updatePlan.isPending} isDeleteLoading={deletePlan.isPending} />}

      {/* Workout Menu */}
      {menuType === 'workout' && <WorkoutMenu isOpen={openMenuId !== null} onClose={() => setOpenMenuId(null)} onStartWorkout={handleStartWorkout} onAddExercises={handleAddExercises} onEdit={handleEditWorkout} onDelete={handleDeleteWorkout} isStartLoading={startSession.isPending} isDeleteLoading={deleteTemplate.isPending} />}
    </div>
      </div>
    </div>;
}