import React from 'react';
import type { WorkoutTemplateResource } from '../../types/api';

interface ProgramWeekCardProps {
  weekNumber: number;
  title: string;
  workouts: WorkoutTemplateResource[];
  isActive?: boolean;
  accentColor?: string;
  onWorkoutClick?: (templateId: number) => void;
}

export function ProgramWeekCard({
  weekNumber,
  title,
  workouts,
  isActive = false,
  accentColor,
  onWorkoutClick
}: ProgramWeekCardProps) {
  const primaryColor = accentColor || 'var(--color-primary)';

  return (
    <div
      className={`rounded-2xl p-5 transition-all ${
        isActive 
          ? 'border-2 shadow-md' 
          : 'border-2 border-transparent'
      }`}
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        ...(isActive && { borderColor: primaryColor })
      }}
    >
      <div className="flex items-center mb-4">
        <div
          className="w-1 h-6 rounded-full mr-3"
          style={{ backgroundColor: primaryColor }}
        />
        <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Week {weekNumber} - {title}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {workouts.map((workout, index) => (
          <button
            key={workout.id}
            onClick={() => onWorkoutClick?.(workout.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors`}
            style={{
              backgroundColor: isActive && index === 0 
                ? primaryColor 
                : 'var(--color-bg-elevated)',
              color: isActive && index === 0 
                ? 'white' 
                : 'var(--color-text-muted)'
            }}
          >
            Day {workout.order_index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
