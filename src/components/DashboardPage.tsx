import React, { useMemo } from 'react';
import { IonPage, IonContent, useIonRouter } from '@ionic/react';
import { motion } from 'framer-motion';
import { Dumbbell, TrendingUp, TrendingDown } from 'lucide-react';
import { WeeklyCalendar } from './WeeklyCalendar';
import { MetricCard } from './MetricCard';
import { StrengthScoreModal } from './StrengthScoreModal';
import { BalanceModal } from './BalanceModal';
import { WeeklyProgressModal } from './WeeklyProgressModal';
import { WorkoutSelectionModal } from './WorkoutSelectionModal';
import { BackgroundGradients } from './BackgroundGradients';
import { useAuth } from '../hooks/useAuth';
import { useBranding } from '../hooks/useBranding';
import { useFitnessMetrics, useStartSession, useTodayWorkout } from '../hooks/useApi';
import { useModals } from '../contexts/ModalsContext';

export function DashboardPage() {
  const { user } = useAuth();
  const { logo, partnerName } = useBranding();
  const router = useIonRouter();
  const { data: metrics } = useFitnessMetrics();
  const { data: todayWorkout, refetch: refetchTodayWorkout } = useTodayWorkout();
  const startSession = useStartSession();
  const {
    isStrengthModalOpen,
    isBalanceModalOpen,
    isProgressModalOpen,
    isWorkoutSelectionOpen,
    openStrengthModal,
    openBalanceModal,
    openProgressModal,
    openWorkoutSelection,
    closeStrengthModal,
    closeBalanceModal,
    closeProgressModal,
    closeWorkoutSelection,
  } = useModals();

  const strengthScoreValue = useMemo(() => {
    if (!metrics?.strength_score) return '--';
    return `${metrics.strength_score.current}`;
  }, [metrics]);

  const strengthScoreSubtitle = useMemo(() => {
    if (!metrics?.strength_score) return undefined;
    return `${metrics.strength_score.level} • +${metrics.strength_score.recent_gain}`;
  }, [metrics]);

  const balanceValue = useMemo(() => {
    if (!metrics?.strength_balance) return '--';
    return `${metrics.strength_balance.percentage}%`;
  }, [metrics]);

  const balanceSubtitle = useMemo(() => {
    if (!metrics?.strength_balance) return undefined;
    const change = metrics.strength_balance.recent_change;
    const sign = change >= 0 ? '+' : '';
    return `${metrics.strength_balance.level} • ${sign}${change}%`;
  }, [metrics]);

  const weeklyValue = useMemo(() => {
    if (!metrics?.weekly_progress) return '--';
    const sign = metrics.weekly_progress.percentage >= 0 ? '+' : '';
    return `${sign}${metrics.weekly_progress.percentage}%`;
  }, [metrics]);

  const weeklySubtitle = useMemo(() => {
    if (!metrics?.weekly_progress) return undefined;
    return `${metrics.weekly_progress.current_week_workouts} workouts`;
  }, [metrics]);

  const handleStartWorkoutClick = () => {
    const ongoingSession = todayWorkout?.session;
    if (ongoingSession?.id) {
      router.push(`/session/${ongoingSession.id}`, 'forward', 'push');
    } else {
      openWorkoutSelection();
    }
  };

  const handleSelectTemplate = async (templateId: number | null, templateName: string) => {
    closeWorkoutSelection();
    try {
      const response = await startSession.mutateAsync(templateId || undefined);
      const session = response.data?.session || response.data;
      if (session?.id) {
        router.push(`/session/${session.id}`, 'forward', 'push');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  return (
    <>
      <IonPage>
        <IonContent>
          <BackgroundGradients />

          <main className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-32">
            {/* Header */}
            <motion.header 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center mb-8"
            >
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
              <h1 className="text-2xl font-bold tracking-tight text-center">
                {partnerName || 'Fit Nation'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Welcome back, {user?.name || 'Athlete'}
              </p>
            </motion.header>

            {/* Calendar Section */}
            <WeeklyCalendar />

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="col-span-1">
                <MetricCard 
                  title="Strength Score" 
                  value={strengthScoreValue} 
                  icon={Dumbbell} 
                  delay={0.1} 
                  subtitle={strengthScoreSubtitle} 
                  onClick={openStrengthModal} 
                />
              </div>
              <div className="col-span-1">
                <MetricCard 
                  title="Balance" 
                  value={balanceValue} 
                  icon={TrendingUp} 
                  delay={0.2} 
                  subtitle={balanceSubtitle} 
                  onClick={openBalanceModal} 
                />
              </div>
              <div className="col-span-2">
                <MetricCard 
                  title="Weekly Progress" 
                  value={weeklyValue} 
                  icon={TrendingDown} 
                  delay={0.3} 
                  subtitle={weeklySubtitle} 
                  onClick={openProgressModal} 
                />
              </div>
            </div>

            {/* CTA Button */}
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartWorkoutClick} 
              className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow relative overflow-hidden group"
              style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
            >
              <span className="relative z-10">
                {todayWorkout?.session?.id ? 'Continue Workout' : 'Start Workout'}
              </span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
              />
            </motion.button>
          </main>
        </IonContent>
      </IonPage>

      {/* Modals */}
      <StrengthScoreModal isOpen={isStrengthModalOpen} onClose={closeStrengthModal} />
      <BalanceModal isOpen={isBalanceModalOpen} onClose={closeBalanceModal} />
      <WeeklyProgressModal isOpen={isProgressModalOpen} onClose={closeProgressModal} />
      <WorkoutSelectionModal 
        isOpen={isWorkoutSelectionOpen} 
        onClose={closeWorkoutSelection} 
        onSelectTemplate={handleSelectTemplate} 
      />
    </>
  );
}
