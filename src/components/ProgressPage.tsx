import React, { useMemo, useState } from 'react';
import { Dumbbell, TrendingUp, TrendingDown } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { StrengthScoreModal } from './StrengthScoreModal';
import { BalanceModal } from './BalanceModal';
import { WeeklyProgressModal } from './WeeklyProgressModal';
import { WeeklyCalendar } from './WeeklyCalendar';
import { SessionDetailModal } from './SessionDetailModal';
import { useFitnessMetrics } from '../hooks/useApi';
import { useModals } from '../contexts/ModalsContext';

export function ProgressPage() {
  const { data: metrics } = useFitnessMetrics();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const {
    isStrengthModalOpen,
    isBalanceModalOpen,
    isProgressModalOpen,
    openStrengthModal,
    openBalanceModal,
    openProgressModal,
    closeStrengthModal,
    closeBalanceModal,
    closeProgressModal,
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

        <main className="relative z-10 max-w-md mx-auto px-3 py-8">
          {/* Header */}
          <header className="mb-8">
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >Progress</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Track your fitness journey
            </p>
          </header>

          {/* Weekly Calendar */}
          <div className="mb-8">
            <WeeklyCalendar onDateClick={handleDateClick} />
          </div>

          {/* Metrics */}
          <div className="space-y-4 mb-8">
            <MetricCard 
              title="Strength Score" 
              value={strengthScoreValue} 
              icon={Dumbbell} 
              delay={0.1} 
              subtitle={strengthScoreSubtitle} 
              onClick={openStrengthModal} 
            />
            <MetricCard 
              title="Balance" 
              value={balanceValue} 
              icon={TrendingUp} 
              delay={0.2} 
              subtitle={balanceSubtitle} 
              onClick={openBalanceModal} 
            />
            <MetricCard 
              title="Weekly Progress" 
              value={weeklyValue} 
              icon={TrendingDown} 
              delay={0.3} 
              subtitle={weeklySubtitle} 
              onClick={openProgressModal} 
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <StrengthScoreModal isOpen={isStrengthModalOpen} onClose={closeStrengthModal} />
      <BalanceModal isOpen={isBalanceModalOpen} onClose={closeBalanceModal} />
      <WeeklyProgressModal isOpen={isProgressModalOpen} onClose={closeProgressModal} />
      <SessionDetailModal
        isOpen={isSessionModalOpen}
        onClose={handleCloseSessionModal}
        sessionId={selectedSessionId}
      />
    </>
  );
}
