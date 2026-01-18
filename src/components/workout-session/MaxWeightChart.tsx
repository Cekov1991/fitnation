import React from 'react';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { Exercise } from './types';

interface MaxWeightChartProps {
  exercise: Exercise;
}

export function MaxWeightChart({ exercise }: MaxWeightChartProps) {
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
          {exercise.maxWeightLifted} kg
        </span>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          10 reps • 02/10/2025
        </p>
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={exercise.history}>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} dot={false} fill="url(#gradient)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
