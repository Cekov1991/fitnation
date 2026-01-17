import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IonPage, IonContent } from '@ionic/react';
import { Plus, Info, MoreVertical, Dumbbell, CheckCircle2, Circle } from 'lucide-react';
import { PlanMenu } from './PlanMenu';
import { WorkoutMenu } from './WorkoutMenu';
import { useDeletePlan, useDeleteTemplate, usePlans, useStartSession, useTemplates, useUpdatePlan } from '../hooks/useApi';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
    isLoading: isPlansLoading
  } = usePlans();
  const {
    data: templates = []
  } = useTemplates();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const deleteTemplate = useDeleteTemplate();
  const startSession = useStartSession();

  const activePlan = useMemo(() => {
    return plans.find(plan => plan.is_active) || plans[0] || null;
  }, [plans]);

  const activePlanWorkouts = useMemo(() => {
    if (!activePlan) return [];
    const planTemplates = activePlan.workout_templates ?? templates.filter(template => template.plan_id === activePlan.id);
    return planTemplates.map(template => ({
      templateId: template.id,
      name: template.name,
      description: template.description || '',
      daysOfWeek: template.day_of_week !== null ? [DAY_NAMES[template.day_of_week]] : [],
      completed: false,
      plan: activePlan.name
    }));
  }, [activePlan, templates]);

  const allPlans = useMemo(() => {
    return plans.map(plan => {
      const planTemplates = plan.workout_templates ?? templates.filter(template => template.plan_id === plan.id);
      const workouts = planTemplates.length;
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        workouts,
        isEmpty: workouts === 0,
        isActive: plan.is_active
      };
    });
  }, [plans, templates]);
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
  const handleToggleActive = () => {
    if (!currentMenuPlan) return;
    updatePlan.mutate({
      planId: currentMenuPlan.id,
      data: {
        name: currentMenuPlan.name,
        description: currentMenuPlan.description,
        is_active: !currentMenuPlan.isActive
      }
    });
  };
  const handleDeletePlan = () => {
    if (!currentMenuPlan) return;
    deletePlan.mutate(currentMenuPlan.id);
  };
  const handleStartWorkout = () => {
    if (!currentWorkout?.templateId) return;
    startSession.mutate(currentWorkout.templateId);
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
  const handleDeleteWorkout = () => {
    if (!currentWorkout?.templateId) return;
    deleteTemplate.mutate(currentWorkout.templateId);
  };
  return <IonPage>
      <IonContent>
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white pb-32">
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-30" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-30" />
        </div>

      <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Plans
          </h1>
          <motion.button whileHover={{
          scale: 1.1,
          rotate: 90
        }} whileTap={{
          scale: 0.9
        }} onClick={onNavigateToCreate} className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 transition-colors">
            <Plus className="text-blue-400 w-6 h-6" />
          </motion.button>
        </motion.div>

        {/* Active Plan Section */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Active Plan
            </h2>
            <button className="p-1 hover:bg-white/5 rounded-full transition-colors">
              <Info className="text-gray-500 w-4 h-4" />
            </button>
          </div>

          {/* Active Plan Card */}
          <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-xl">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  {activePlan?.name || (isPlansLoading ? 'Loading...' : 'No active plan')}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {activePlan?.description || 'Create a plan to get started.'}
                </p>
              </div>
              {activePlan && <button onClick={e => handlePlanMenuClick(e, 'active-plan', {
                id: activePlan.id,
                name: activePlan.name,
                description: activePlan.description || '',
                isActive: activePlan.is_active
              })} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <MoreVertical className="text-gray-400 w-5 h-5" />
              </button>}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
                <span className="text-xs font-bold text-blue-400">
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
              {activePlanWorkouts.length === 0 && <div className="text-sm text-gray-500 text-center py-4">
                  No workouts in this plan yet.
                </div>}
              {activePlanWorkouts.map((workout, index) => <motion.div key={workout.templateId || `${workout.name}-${index}`} initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.2 + index * 0.1
            }} className="flex items-center justify-between p-4 bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-xl hover:bg-gray-800/60 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Dumbbell className="text-blue-400 w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                      {workout.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {workout.completed ? <CheckCircle2 className="text-green-400 w-5 h-5" /> : <Circle className="text-gray-600 w-5 h-5" />}
                    <button onClick={e => handleWorkoutMenuClick(e, `workout-${index}`, {
                  templateId: workout.templateId,
                  plan: activePlan?.name || workout.plan,
                  name: workout.name,
                  description: workout.description,
                  daysOfWeek: workout.daysOfWeek
                })} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                      <MoreVertical className="text-gray-500 w-4 h-4" />
                    </button>
                  </div>
                </motion.div>)}
            </div>
          </div>
        </motion.div>

        {/* All Plans Section */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }}>
          <h2 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4">
            All Plans
          </h2>

          <div className="space-y-4 mb-6">
            {allPlans.map((plan, index) => <motion.div key={plan.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.4 + index * 0.1
          }} className="relative bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:bg-gray-800/60 transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                    {plan.name}
                  </h3>
                  <button onClick={e => handlePlanMenuClick(e, `plan-${plan.id}`, plan)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <MoreVertical className="text-gray-400 w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="px-3 py-1.5 bg-gray-700/50 border border-gray-600/50 rounded-full">
                    <span className="text-xs font-bold text-gray-400">
                      {plan.workouts} WORKOUT{plan.workouts !== 1 ? 'S' : ''}
                    </span>
                  </div>
                </div>

                {plan.isEmpty && <>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4" />
                    <p className="text-sm text-gray-500 text-center py-2">
                      No workout templates in this plan.
                    </p>
                  </>}
              </motion.div>)}
          </div>
        </motion.div>

        {/* Create New Button */}
        <motion.button initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: 0.6,
        type: 'spring'
      }} whileHover={{
        scale: 1.02
      }} whileTap={{
        scale: 0.98
      }} onClick={onNavigateToCreate} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow relative overflow-hidden group">
          <span className="relative z-10">CREATE NEW</span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </main>

      {/* Plan Menu */}
      {menuType === 'plan' && <PlanMenu isOpen={openMenuId !== null} onClose={() => setOpenMenuId(null)} isActive={currentMenuPlan?.isActive ?? false} onAddWorkout={handleAddWorkout} onEdit={handleEditPlan} onToggleActive={handleToggleActive} onDelete={handleDeletePlan} />}

      {/* Workout Menu */}
      {menuType === 'workout' && <WorkoutMenu isOpen={openMenuId !== null} onClose={() => setOpenMenuId(null)} onStartWorkout={handleStartWorkout} onAddExercises={handleAddExercises} onEdit={handleEditWorkout} onDelete={handleDeleteWorkout} />}
    </div>
      </IonContent>
    </IonPage>;
}