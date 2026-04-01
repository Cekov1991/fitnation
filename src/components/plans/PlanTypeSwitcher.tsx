import { List, Flag } from 'lucide-react';

type PlanType = 'customPlans' | 'programs';

interface PlanTypeSwitcherProps {
  activeType: PlanType;
  onTypeChange: (type: PlanType) => void;
  showPrograms?: boolean;
}

export function PlanTypeSwitcher({
  activeType,
  onTypeChange,
  showPrograms = true,
}: PlanTypeSwitcherProps) {
  return (
    <div 
      className="flex p-1 rounded-xl mb-6 relative"
      style={{ backgroundColor: 'var(--color-border-subtle)' }}
    >
      {showPrograms && (
        <button
          onClick={() => onTypeChange('programs')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeType === 'programs'
              ? 'shadow-sm'
              : ''
          }`}
          style={{
            backgroundColor: activeType === 'programs' ? 'var(--color-bg-surface)' : 'transparent',
            color: activeType === 'programs' ? 'var(--color-primary)' : 'var(--color-text-muted)'
          }}
        >
          <Flag size={16} />
          My Program
        </button>
      )}
      <button
        onClick={() => onTypeChange('customPlans')}
        className={`${showPrograms ? 'flex-1' : 'w-full'} py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
          activeType === 'customPlans'
            ? 'shadow-sm'
            : ''
        }`}
        style={{
          backgroundColor: activeType === 'customPlans' ? 'var(--color-bg-surface)' : 'transparent',
          color: activeType === 'customPlans' ? 'var(--color-primary)' : 'var(--color-text-muted)'
        }}
      >
        <List size={16} />
        Custom Plans
      </button>
    </div>
  );
}
