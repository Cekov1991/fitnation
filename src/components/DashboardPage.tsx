import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { WorkoutSelectionModal } from './WorkoutSelectionModal';
import { SessionDetailModal } from './SessionDetailModal';
import { WorkoutCard } from './WorkoutCard';
import { useAuth } from '../hooks/useAuth';
import { useBranding } from '../hooks/useBranding';
import { useStartSession, useTodayWorkout } from '../hooks/useApi';
import { useModals } from '../contexts/ModalsContext';

export function DashboardPage() {
  const { user } = useAuth();
  const { logo, partnerName } = useBranding();
  const history = useHistory();
  const { data: todayWorkout } = useTodayWorkout();
  const startSession = useStartSession();
  const {
    isWorkoutSelectionOpen,
    openWorkoutSelection,
    closeWorkoutSelection,
  } = useModals();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  const handleStartWorkoutClick = () => {
    const ongoingSession = todayWorkout?.session;
    if (ongoingSession?.id) {
      history.push(`/session/${ongoingSession.id}`);
    } else {
      openWorkoutSelection();
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

  const handleDateClick = (sessionId: number | null) => {
    if (sessionId) {
      setSelectedSessionId(sessionId);
      setIsSessionModalOpen(true);
    }
  };

  const handleCloseSessionModal = () => {
    setIsSessionModalOpen(false);
    setSelectedSessionId(null);
  };

  return (
    <>
      <div>
        <div>

          <main className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-32">
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

            {/* Calendar Section */}
            <WeeklyCalendar onDateClick={handleDateClick} />

            {/* Today's Workout Card */}
            {todayWorkout?.template && (
              <div className="mb-6">
                <WorkoutCard
                  template={todayWorkout.template}
                  title="TODAY'S WORKOUT"
                  onExerciseClick={(exerciseName) => {
                    history.push(`/exercises/${encodeURIComponent(exerciseName)}`);
                  }}
                  onEditWorkout={(templateId) => {
                    history.push(`/workouts/${templateId}/exercises`);
                  }}
                />
              </div>
            )}

            {/* CTA Button */}
            <button 
              onClick={handleStartWorkoutClick} 
              className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow relative overflow-hidden group"
              style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
            >
              <span className="relative z-10 text-white">
                {todayWorkout?.session?.id ? 'Continue Workout' : 'Start Workout'}
              </span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
              />
            </button>
          </main>
        </div>
      </div>

      {/* Modals */}
      <WorkoutSelectionModal 
        isOpen={isWorkoutSelectionOpen} 
        onClose={closeWorkoutSelection} 
        onSelectTemplate={handleSelectTemplate}
      />
      <SessionDetailModal
        isOpen={isSessionModalOpen}
        onClose={handleCloseSessionModal}
        sessionId={selectedSessionId}
      />
    </>
  );
}
