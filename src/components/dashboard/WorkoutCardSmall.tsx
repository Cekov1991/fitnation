import { Clock, Dumbbell } from 'lucide-react';

interface WorkoutCardSmallProps {
  name: string;
  duration: string;
  exerciseCount: number;
  icon?: React.ReactNode;
  onClick?: () => void;
  onStart?: () => void;
  hasActiveSession?: boolean;
}

export function WorkoutCardSmall({
  name,
  duration,
  exerciseCount,
  icon,
  onClick,
  onStart,
  hasActiveSession = false
}: WorkoutCardSmallProps) {
  return (
    <div 
      className="rounded-2xl p-5 shadow-sm flex flex-col h-full transition-colors min-w-[160px] flex-shrink-0"
      style={{ backgroundColor: 'var(--color-bg-surface)' }}
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
        style={{ 
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          color: 'var(--color-primary)'
        }}
      >
        {icon || <Dumbbell size={18} />}
      </div>

      <h3 
        onClick={onClick}
        className={`text-lg font-bold mb-3 line-clamp-2 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        style={{ color: 'var(--color-primary)' }}
      >
        {name}
      </h3>

      <div 
        className="flex items-center text-xs font-medium space-x-3 mt-auto mb-3"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <div className="flex items-center">
          <Clock size={12} className="mr-1" />
          <span>{duration}</span>
        </div>
        <div 
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: 'var(--color-border-subtle)' }}
        />
        <div className="flex items-center">
          <span>{exerciseCount} Ex</span>
        </div>
      </div>

      {onStart && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
          className="w-full py-2 rounded-xl font-semibold text-sm transition-transform active:scale-[0.98]"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-button)'
          }}
        >
          {hasActiveSession ? 'Continue Workout' : 'Start'}
        </button>
      )}
    </div>
  );
}
