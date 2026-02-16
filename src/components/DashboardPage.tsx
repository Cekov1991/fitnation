import { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { WorkoutSelectionModal } from './WorkoutSelectionModal';
import { PlanTypeSwitcher } from './plans/PlanTypeSwitcher';
import { CustomPlansDashboard, ProgramDashboard } from './dashboard';
import { useAuth } from '../hooks/useAuth';
import { useBranding } from '../hooks/useBranding';
import { useStartSession, useTodayWorkout, usePrograms } from '../hooks/useApi';
import { useModals } from '../contexts/ModalsContext';
import type { ProgramResource } from '../types/api';

export function DashboardPage() {
  const { user } = useAuth();
  const { logo, partnerName } = useBranding();
  const history = useHistory();
  const location = useLocation();
  const { data: todayWorkout } = useTodayWorkout();
  const startSession = useStartSession();
  const { data: programs = [] } = usePrograms();
  const {
    isWorkoutSelectionOpen,
    openWorkoutSelection,
    closeWorkoutSelection,
  } = useModals();

  // Get active program for key-based remounting
  const activeProgram = useMemo(() => {
    return programs.find((program: ProgramResource) => program.is_active) || null;
  }, [programs]);

  // Create a key that changes when program or week changes to force remount
  const programDashboardKey = useMemo(() => {
    if (!activeProgram) return 'no-program';
    return `${activeProgram.id}-${activeProgram.current_active_week ?? 1}`;
  }, [activeProgram]);

  // Get dashboard type from URL query parameter, default to 'customPlans'
  const dashboardType = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    if (type === 'programs' || type === 'customPlans') {
      return type;
    }
    return 'customPlans';
  }, [location.search]);

  const handleDashboardTypeChange = (type: 'customPlans' | 'programs') => {
    const params = new URLSearchParams(location.search);
    params.set('type', type);
    history.push({ pathname: location.pathname, search: params.toString() });
  };

  const handleStartWorkoutClick = () => {
    const session = todayWorkout?.session;
    if (session?.id) {
      // Check if draft (performed_at is null)
      if (!session.performed_at) {
        // Navigate to preview page to continue setup
        history.push(`/generate-workout/preview/${session.id}`);
      } else {
        // Active session - continue workout
        history.push(`/session/${session.id}`);
      }
    } else {
      openWorkoutSelection();
    }
  };

  const handleStartBlankSession = async () => {
    try {
      const response = await startSession.mutateAsync(undefined);
      const session = response.data?.session || response.data;
      if (session?.id) {
        history.push(`/session/${session.id}`);
      }
    } catch (error) {
      console.error('Failed to start blank session:', error);
    }
  };

  const handleSelectTemplate = async (templateId: number | null, _templateName: string) => {
    try {
      const response = await startSession.mutateAsync(templateId || undefined);
      const session = response.data?.session || response.data;
      if (session?.id) {
        history.push(`/session/${session.id}`);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      closeWorkoutSelection();
    }
  };


  return (
    <>
      <main className="relative z-10 max-w-md mx-auto px-3 py-8">
        {/* Header */}
        <header className="flex flex-col items-center mb-8">
          {logo ? (
            <img 
              src={logo} 
              alt={partnerName || 'Partner logo'} 
              className="w-16 h-16 rounded-2xl shadow-lg mb-4 object-contain"
            />
          ) : (
            <div 
              className="w-16 h-16 rounded-2xl shadow-lg mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(to top right, var(--color-primary), var(--color-secondary))' }}
            >
              <Dumbbell className="w-8 h-8" style={{ color: 'var(--color-text-primary)' }} />
            </div>
          )}
          <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}>
            {partnerName || 'Fit Nation'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Welcome back, {user?.name || 'Athlete'}
          </p>
        </header>

        

        {/* Dashboard Type Switcher */}
        <PlanTypeSwitcher 
          activeType={dashboardType} 
          onTypeChange={handleDashboardTypeChange} 
        />

        {/* Conditional content based on dashboard type */}
        {dashboardType === 'customPlans' ? (
          <CustomPlansDashboard onStartBlankSession={handleStartBlankSession} />
        ) : (
          <ProgramDashboard key={programDashboardKey} onStartWorkout={handleStartWorkoutClick} />
        )}
      </main>

      {/* Modals */}
      <WorkoutSelectionModal 
        isOpen={isWorkoutSelectionOpen} 
        onClose={closeWorkoutSelection} 
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  );
}
