import { WEEKDAY_LABELS } from '../../constants';

interface DaySelectorProps {
  selectedDay: number; // 0-6 (Monday-Sunday)
  onDaySelect: (day: number) => void;
}

export function DaySelector({ selectedDay, onDaySelect }: DaySelectorProps) {
  const days = [0, 1, 2, 3, 4, 5, 6]; // Monday to Sunday

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {days.map((day) => (
        <button
          key={day}
          onClick={() => onDaySelect(day)}
          className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            selectedDay === day
              ? 'shadow-sm ring-1'
              : 'hover:opacity-80'
          }`}
          style={{
            backgroundColor: selectedDay === day 
              ? 'var(--color-bg-surface)' 
              : 'var(--color-border-subtle)',
            color: selectedDay === day
              ? 'var(--color-primary)'
              : 'var(--color-text-secondary)',
            borderColor: selectedDay === day
              ? 'var(--color-border-subtle)'
              : 'transparent'
          }}
        >
          {WEEKDAY_LABELS[day]}
        </button>
      ))}
    </div>
  );
}
