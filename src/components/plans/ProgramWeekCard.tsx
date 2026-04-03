import { useRef, useEffect } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import type { WorkoutTemplateResource } from '../../types/api';

interface ProgramWeekCardProps {
  weekNumber: number;
  workouts: WorkoutTemplateResource[];
  isActive?: boolean;
  accentColor?: string;
  nextWorkoutId?: number | null;
  /** Full next-workout template; used to compute completed (earlier week or same week lower order_index). */
  nextWorkout?: WorkoutTemplateResource | null;
  onWorkoutClick?: (templateId: number) => void;
  /** Called when a completed day badge is clicked; receives the session ID to show. */
  onCompletedDayClick?: (sessionId: number) => void;
}

export function ProgramWeekCard({
  weekNumber,
  workouts,
  isActive = false,
  accentColor,
  nextWorkoutId: nextWorkoutIdProp,
  nextWorkout = null,
  onWorkoutClick,
  onCompletedDayClick
}: ProgramWeekCardProps) {
  const primaryColor = accentColor || 'var(--color-primary)';
  const nextWorkoutId = nextWorkout?.id ?? nextWorkoutIdProp ?? null;
  const containerRef = useRef<HTMLDivElement>(null);
  const nextWorkoutButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (nextWorkoutButtonRef.current && containerRef.current && nextWorkoutId) {
      const button = nextWorkoutButtonRef.current;
      const container = containerRef.current;
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

  const isWorkoutCompleted = (workout: WorkoutTemplateResource): boolean => {
    return workout.last_completed_session_id != null;
  };

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl p-3 pl-5 pt-5 transition-all overflow-hidden ${
        isActive ? 'border-2 shadow-md' : 'border-2 border'
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
        {workouts.map((workout) => {
          const isNextWorkout = workout.id === nextWorkoutId;
          const isCompleted = isWorkoutCompleted(workout);
          const isInteractivePreview = onWorkoutClick && nextWorkoutId == null;

          const handleClick = () => {
            if (isCompleted && workout.last_completed_session_id && onCompletedDayClick) {
              onCompletedDayClick(workout.last_completed_session_id);
            } else {
              onWorkoutClick?.(workout.id);
            }
          };

          return (
            <button
              key={workout.id}
              ref={isNextWorkout ? nextWorkoutButtonRef : null}
              onClick={handleClick}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 relative"
              style={{
                background: isNextWorkout
                  ? primaryColor
                  : isCompleted
                    ? 'transparent'
                    : isInteractivePreview
                      ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                      : 'var(--color-bg-base)',
                color: isNextWorkout
                  ? 'white'
                  : isCompleted
                    ? 'var(--color-text-button)'
                    : isInteractivePreview
                      ? 'var(--color-primary)'
                      : 'var(--color-text-muted)',
                border: isNextWorkout
                  ? '1px solid transparent'
                  : isCompleted
                    ? '1px solid var(--color-border-subtle)'
                    : isInteractivePreview
                      ? '1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)'
                      : '1px solid transparent',
                overflow: 'hidden'
              }}
            >
              {isCompleted && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                    zIndex: 0
                  }}
                  aria-hidden
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {isNextWorkout && <Clock size={14} className="flex-shrink-0" />}
                {isCompleted && <CheckCircle2 size={14} className="flex-shrink-0" />}
                Day {workout.order_index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
