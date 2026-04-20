import { Dumbbell } from 'lucide-react';
import type { RoutinePlanResource } from '@fit-nation/shared';

interface RoutineCardSmallProps {
  routine: RoutinePlanResource;
  onClick: () => void;
}

export function RoutineCardSmall({ routine, onClick }: RoutineCardSmallProps) {
  const workoutCount = routine.workout_templates?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-0 w-full rounded-2xl overflow-hidden shadow-sm text-left"
      style={{ backgroundColor: 'var(--color-bg-surface)' }}
    >
      {/* Cover Image */}
      <div className="relative w-full h-28 overflow-hidden">
        {routine.cover_image ? (
          <>
            <img
              src={routine.cover_image}
              alt={routine.name}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))' }}
              aria-hidden
            />
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-surface))' }}
          >
            <Dumbbell className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3
          className="font-bold text-sm line-clamp-1 mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {routine.name}
        </h3>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {workoutCount} {workoutCount === 1 ? 'workout' : 'workouts'}
        </p>
      </div>
    </button>
  );
}
