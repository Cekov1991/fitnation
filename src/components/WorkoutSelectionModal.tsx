import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Dumbbell, ChevronRight, Zap, Target, TrendingUp } from 'lucide-react';
import { usePlans } from '../hooks/useApi';
import { useModalTransition } from '../utils/animations';
import type { PlanResource, WorkoutTemplateResource } from '../types/api';

interface WorkoutSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: number | null, templateName: string) => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20'
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20'
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20'
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20'
  }
};

const icons = [Dumbbell, Zap, Target, TrendingUp];
const colors = ['blue', 'purple', 'green', 'orange'] as const;

interface WorkoutTemplate {
  id: number;
  name: string;
  exercises: number;
  icon: typeof Dumbbell;
  color: typeof colors[number];
}

interface PlanWithWorkouts {
  id: number;
  name: string;
  isActive: boolean;
  workouts: WorkoutTemplate[];
}

export function WorkoutSelectionModal({
  isOpen,
  onClose,
  onSelectTemplate
}: WorkoutSelectionModalProps) {
  const modalTransition = useModalTransition();
  const { data: plans = [] } = usePlans();

  const { activePlan, otherPlans } = useMemo(() => {
    const mapWorkouts = (templates: WorkoutTemplateResource[] | null, startIndex: number): WorkoutTemplate[] => {
      if (!templates) return [];
      return templates.map((template, index) => ({
        id: template.id,
        name: template.name,
        exercises: template.exercises?.length ?? 0,
        icon: icons[(startIndex + index) % icons.length],
        color: colors[(startIndex + index) % colors.length]
      }));
    };

    const mapPlan = (plan: PlanResource, workoutStartIndex: number): PlanWithWorkouts => ({
      id: plan.id,
      name: plan.name,
      isActive: plan.is_active,
      workouts: mapWorkouts(plan.workout_templates, workoutStartIndex)
    });

    const active = plans.find((p: PlanResource) => p.is_active);
    const others = plans.filter((p: PlanResource) => !p.is_active);

    let workoutIndex = 0;
    const activePlanMapped = active ? mapPlan(active, workoutIndex) : null;
    workoutIndex += activePlanMapped?.workouts.length ?? 0;

    const otherPlansMapped = others.map((plan: PlanResource) => {
      const mapped = mapPlan(plan, workoutIndex);
      workoutIndex += mapped.workouts.length;
      return mapped;
    });

    return {
      activePlan: activePlanMapped,
      otherPlans: otherPlansMapped
    };
  }, [plans]);
  return <AnimatePresence>
      {isOpen && <>
          {/* Backdrop */}
          <motion.div {...modalTransition} onClick={onClose} className="fixed inset-0 bg-black/80  " style={{ zIndex: 10000 }} />

          {/* Modal */}
          <motion.div {...modalTransition} className="fixed inset-x-0 bottom-0 max-h-[85vh] overflow-hidden" style={{ zIndex: 10001 }}>
            <div 
              className="  border-t rounded-t-3xl shadow-2xl"
              style={{ 
                backgroundColor: 'var(--color-bg-modal)',
                borderColor: 'var(--color-border)'
              }}
            >
              {/* Header */}
              <div 
                className="flex justify-between items-center p-6 border-b"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    Choose Workout
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Select a workout to start or begin a blank session.
                  </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ backgroundColor: 'var(--color-border-subtle)' }}>
                  <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(85vh-100px)] p-6">
                {/* Blank Session Card */}
                <button onClick={() => onSelectTemplate(null, 'Blank Session')} className="w-full mb-6 relative group">
                  {/* Dashed border animation */}
                  <div 
                    className="absolute inset-0 rounded-2xl border-2 border-dashed transition-colors"
                    style={{ 
                      borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
                    }}
                  />

                  <div 
                    className="relative   rounded-2xl p-6 flex items-center gap-4"
                    style={{ 
                      background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 5%, transparent), color-mix(in srgb, var(--color-secondary) 5%, transparent))' 
                    }}
                  >
                    {/* Plus Icon */}
                    <div 
                      className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-shadow"
                      style={{ 
                        background: 'linear-gradient(to bottom right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
                        boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
                      }}
                    >
                      <Plus className="text-white w-7 h-7" strokeWidth={2.5} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        Blank Session
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Start fresh and add exercises as you go
                      </p>
                    </div>

                    {/* Chevron */}
                    <ChevronRight 
                      className="transition-colors flex-shrink-0" 
                      size={20}
                      style={{ color: 'var(--color-text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-muted)';
                      }}
                    />
                  </div>
                </button>

                {/* Active Plan Section */}
                {activePlan && activePlan.workouts.length > 0 && (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-green-400">
                        Active Plan
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                    </div>

                    <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                      {activePlan.name}
                    </h4>

                    <div className="space-y-3 mb-6">
                      {activePlan.workouts.map((template) => {
                        const Icon = template.icon;
                        const colorClass = colorClasses[template.color];
                        return (
                          <button 
                            key={template.id} 
                            onClick={() => onSelectTemplate(template.id, template.name)}
                            className="w-full border rounded-2xl p-5 flex items-center gap-4 transition-colors group"
                            style={{ 
                              backgroundColor: 'var(--color-bg-surface)',
                              borderColor: 'var(--color-border-subtle)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                            }}
                          >
                            <div className={`flex-shrink-0 w-12 h-12 ${colorClass.bg} rounded-xl flex items-center justify-center`}>
                              <Icon className={`${colorClass.text} w-6 h-6`} />
                            </div>
                            <div className="flex-1 text-left">
                              <h3 
                                className="text-base font-bold mb-1 transition-colors"
                                style={{ color: 'var(--color-primary)' }}
                              >
                                {template.name}
                              </h3>
                              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                {template.exercises} exercises
                              </span>
                            </div>
                            <ChevronRight 
                              className="transition-colors flex-shrink-0" 
                              size={20}
                              style={{ color: 'var(--color-text-muted)' }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Other Plans Section */}
                {otherPlans.length > 0 && otherPlans.some((p: PlanWithWorkouts) => p.workouts.length > 0) && (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                        Other Plans
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                    </div>

                    {otherPlans.map((plan: PlanWithWorkouts) => {
                      if (plan.workouts.length === 0) return null;
                      return (
                        <div key={plan.id} className="mb-6">
                          <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                            {plan.name}
                          </h4>
                          <div className="space-y-3">
                            {plan.workouts.map((template: WorkoutTemplate) => {
                              const Icon = template.icon;
                              const colorClass = colorClasses[template.color];
                              return (
                                <button 
                                  key={template.id} 
                                  onClick={() => onSelectTemplate(template.id, template.name)}
                                  className="w-full border rounded-2xl p-5 flex items-center gap-4 transition-colors group"
                                  style={{ 
                                    backgroundColor: 'var(--color-bg-surface)',
                                    borderColor: 'var(--color-border-subtle)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                                  }}
                                >
                                  <div className={`flex-shrink-0 w-12 h-12 ${colorClass.bg} rounded-xl flex items-center justify-center`}>
                                    <Icon className={`${colorClass.text} w-6 h-6`} />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h3 
                                      className="text-base font-bold mb-1 transition-colors"
                                      style={{ color: 'var(--color-secondary)' }}
                                    >
                                      {template.name}
                                    </h3>
                                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                      {template.exercises} exercises
                                    </span>
                                  </div>
                                  <ChevronRight 
                                    className="transition-colors flex-shrink-0" 
                                    size={20}
                                    style={{ color: 'var(--color-text-muted)' }}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Bottom padding for safe area */}
                <div className="h-6" />
              </div>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}