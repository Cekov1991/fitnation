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
  const tabs = showPrograms
    ? [
        { id: 'programs' as const, label: 'My Program', icon: Flag },
        { id: 'customPlans' as const, label: 'Custom Plans', icon: List },
      ]
    : [{ id: 'customPlans' as const, label: 'Custom Plans', icon: List }];

  return (
    <div
      className="mb-6 flex rounded-full p-1"
      style={{ backgroundColor: 'var(--color-segment-track)' }}
      role="tablist"
      aria-label="Plan type"
    >
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeType === id}
          id={`plan-type-tab-${id}`}
          onClick={() => onTypeChange(id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 px-4 text-sm font-medium transition-all"
          style={{
            color: activeType === id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            backgroundColor: activeType === id ? 'var(--color-segment-active)' : 'transparent',
            boxShadow: activeType === id ? 'var(--color-segment-active-shadow)' : undefined,
          }}
        >
          <Icon size={16} className="shrink-0" strokeWidth={2} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
