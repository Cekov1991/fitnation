import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PlanTypeSwitcher } from './plans/PlanTypeSwitcher';
import { CustomPlansView } from './plans/CustomPlansView';
import { ProgramPlansView } from './plans/ProgramPlansView';
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
  const [planType, setPlanType] = useState<'customPlans' | 'programs'>('customPlans');
  const history = useHistory();

  const handleNavigateToBrowseLibrary = () => {
    history.push('/programs/library');
  };

  const handleNavigateToWorkout = (templateId: number) => {
    history.push(`/workouts/${templateId}/exercises`);
  };

  const handleContinueSession = (sessionId: number) => {
    history.push(`/session/${sessionId}`);
  };

  return (
    <div>
      <div>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
          <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 
                className="text-3xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
              >
                Plans
              </h1>
              {planType === 'customPlans' && (
                <button 
                  onClick={onNavigateToCreate} 
                  className="p-2 rounded-full transition-colors"
                  style={{ 
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
                  }}
                >
                  <Plus className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                </button>
              )}
            </div>

            {/* Plan Type Switcher */}
            <PlanTypeSwitcher activeType={planType} onTypeChange={setPlanType} />

            {/* Conditional content based on plan type */}
            {planType === 'customPlans' ? (
              <CustomPlansView
                onNavigateToCreate={onNavigateToCreate}
                onNavigateToEdit={onNavigateToEdit}
                onNavigateToAddWorkout={onNavigateToAddWorkout}
                onNavigateToEditWorkout={onNavigateToEditWorkout}
                onNavigateToManageExercises={onNavigateToManageExercises}
                onContinueSession={handleContinueSession}
              />
            ) : (
              <ProgramPlansView
                onNavigateToBrowseLibrary={handleNavigateToBrowseLibrary}
                onNavigateToWorkout={handleNavigateToWorkout}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}