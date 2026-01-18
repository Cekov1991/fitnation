import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useExerciseHistory } from '../../hooks/useApi';
import type { Exercise } from './types';
import type { PerformanceDataPoint } from '../../types/api';

interface MaxWeightChartProps {
  exercise: Exercise;
}

export function MaxWeightChart({ exercise }: MaxWeightChartProps) {
  // Fetch exercise history from API
  const { data: historyData, isLoading } = useExerciseHistory(
    exercise.exerciseId,
    { limit: 10 }, // Get last 10 data points for the chart
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
    // Get the most recent (last) data point
    const lastPoint = historyData.performance_data[historyData.performance_data.length - 1];
    return lastPoint;
  }, [historyData]);

  // Get max weight from history stats (best_weight) or fallback to exercise.maxWeightLifted
  const maxWeight = useMemo(() => {
    if (historyData?.stats?.best_weight !== undefined && historyData.stats.best_weight > 0) {
      return historyData.stats.best_weight;
    }
    return exercise.maxWeightLifted || 0;
  }, [historyData, exercise.maxWeightLifted]);

  // Format date for display (e.g., "02/10/2025")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div 
      className="backdrop-blur-sm border rounded-2xl p-4"
      style={{ 
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
          Max Weight Lifted
        </span>
        <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
      </div>
      <div className="mb-2">
        <span className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {maxWeight} kg
        </span>
        {recentSession && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {recentSession.reps} reps • {formatDate(recentSession.date)}
          </p>
        )}
      </div>
      <div className="h-16">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${exercise.exerciseId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                dot={false} 
                fill={`url(#gradient-${exercise.exerciseId})`} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No history data</div>
          </div>
        )}
      </div>
    </div>
  );
}
