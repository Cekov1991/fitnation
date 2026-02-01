import React, { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ExerciseImage } from '../ExerciseImage';
import { useExerciseHistory } from '../../hooks/useApi';
import type { Exercise } from './types';
import type { PerformanceDataPoint } from '../../types/api';

interface CurrentExerciseCardProps {
  exercise: Exercise;
  onOpenMenu: () => void;
  onViewExercise?: () => void;
}

export function CurrentExerciseCard({ exercise, onOpenMenu, onViewExercise }: CurrentExerciseCardProps) {
  // Fetch exercise history from API
  const { data: historyData, isLoading } = useExerciseHistory(
    exercise.exerciseId,
    { limit: 10 },
    { enabled: !!exercise.exerciseId }
  );

  // Transform API data to chart format
  const chartData = useMemo(() => {
    if (!historyData?.performance_data || historyData.performance_data.length === 0) {
      return [];
    }
    return historyData.performance_data.map((point: PerformanceDataPoint) => ({
      date: point.date,
      weight: point.weight,
    }));
  }, [historyData]);

  // Get the most recent session data for display
  const recentSession = useMemo(() => {
    if (!historyData?.performance_data || historyData.performance_data.length === 0) {
      return null;
    }
    return historyData.performance_data[historyData.performance_data.length - 1];
  }, [historyData]);

  // Get max weight from history stats or fallback
  const maxWeight = useMemo(() => {
    if (historyData?.stats?.best_weight !== undefined && historyData.stats.best_weight > 0) {
      return historyData.stats.best_weight;
    }
    return exercise.maxWeightLifted || 0;
  }, [historyData, exercise.maxWeightLifted]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const handleCardClick = () => {
    if (onViewExercise) {
      onViewExercise();
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenMenu();
  };

  return (
    <div 
      onClick={handleCardClick}
      className="relative border rounded-2xl overflow-hidden transition-all cursor-pointer hover:opacity-90 active:scale-[0.98]"
      style={{ 
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      {/* Top section: Image, Name, Muscle Group, Menu */}
      <div className="flex items-start gap-4 p-4 pb-3">
        <div className="flex-shrink-0 w-24 h-20 rounded-xl overflow-hidden">
          <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h2 className="text-lg font-bold mb-2 leading-tight line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
            {exercise.name}
          </h2>
          <span className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-bold text-cyan-400">
            {exercise.muscleGroup}
          </span>
        </div>

        <button
          onClick={handleMenuClick}
          className="flex-shrink-0 p-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-elevated)' }}
        >
          <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      {/* Bottom section: Max Weight Stats + Chart */}
      <div className="flex items-end px-4 pb-4">
        {/* Stats on the left */}
        <div className="flex-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Max Weight Lifted
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {maxWeight} kg
            </span>
          </div>
          {recentSession && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {recentSession.reps} reps
            </p>
          )}
          {recentSession && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {formatDate(recentSession.date)}
            </p>
          )}
        </div>

        {/* Chart on the right */}
        <div className="w-32 h-14">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${exercise.exerciseId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2} 
                  fill={`url(#gradient-${exercise.exerciseId})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>No history</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
