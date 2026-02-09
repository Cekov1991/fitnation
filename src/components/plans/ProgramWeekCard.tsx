import { useRef, useEffect } from 'react';
import type { WorkoutTemplateResource } from '../../types/api';

interface ProgramWeekCardProps {
  weekNumber: number;
  workouts: WorkoutTemplateResource[];
  isActive?: boolean;
  accentColor?: string;
  nextWorkoutId?: number | null;
  onWorkoutClick?: (templateId: number) => void;
}

export function ProgramWeekCard({
  weekNumber,
  workouts,
  isActive = false,
  accentColor,
  nextWorkoutId,
  onWorkoutClick
}: ProgramWeekCardProps) {
  const primaryColor = accentColor || 'var(--color-primary)';
  const containerRef = useRef<HTMLDivElement>(null);
  const nextWorkoutButtonRef = useRef<HTMLButtonElement | null>(null);

  // Scroll to next workout when it's in this week
  useEffect(() => {
    if (nextWorkoutButtonRef.current && containerRef.current && nextWorkoutId) {
      const button = nextWorkoutButtonRef.current;
      const container = containerRef.current;
      
      // Calculate scroll position to center the button
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [nextWorkoutId]);

  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl p-3 pl-5 pt-5 transition-all overflow-hidden ${
        isActive 
          ? 'border-2 shadow-md' 
          : 'border-2 border'
      }`}
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        ...(isActive && { borderColor: primaryColor }),
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div className="flex items-center mb-4">
        <div
          className="w-1 h-6 rounded-full mr-3"
          style={{ backgroundColor: primaryColor }}
        />
        <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Week {weekNumber}
        </h3>
      </div>

      <div 
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{ 
          minWidth: 0,
          maxWidth: '100%',
          width: '100%'
        }}
      >
        {workouts.map((workout, index) => {
          const isNextWorkout = workout.id === nextWorkoutId;
          
          return (
            <button
              key={workout.id}
              ref={isNextWorkout ? nextWorkoutButtonRef : null}
              onClick={() => onWorkoutClick?.(workout.id)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: isNextWorkout 
                  ? primaryColor 
                  : 'var(--color-bg-base)',
                color: isNextWorkout 
                  ? 'white' 
                  : 'var(--color-text-muted)'
              }}
            >
              Day {workout.order_index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
