import { AlertTriangle, Info, Sparkles } from 'lucide-react';

interface ProgressionBannerProps {
  status: 'no_history' | 'below_min' | 'working' | 'ready';
  maxTargetReps: number;
}

const CONFIG = {
  no_history: { text: "First time loging this exercise! We've estimated a starting weight for you.", color: 'var(--color-primary)', icon: Info },
  below_min:  { text: 'Last session was tough — consider lowering your weight to hit your target reps.', color: '#f59e0b', icon: AlertTriangle },
  ready:      { text: '', color: '#22c55e', icon: Sparkles },
  working:    null,
} as const;

export function ProgressionBanner({ status, maxTargetReps }: ProgressionBannerProps) {
  if (status === 'working') return null;

  const config = CONFIG[status];
  const Icon = config.icon;
  const text = status === 'ready'
    ? `Weight increase! You hit ${maxTargetReps} reps last time.`
    : config.text;

  return (
    <div
      className="flex items-start gap-3 rounded-xl border px-4 py-3"
      style={{
        backgroundColor: `color-mix(in srgb, ${config.color} 2%, transparent)`,
        borderColor: `color-mix(in srgb, ${config.color} 10%, transparent)`,
      }}
    >
      <Icon className="w-4 h-4 mt-1.5 flex-shrink-0" style={{ color: config.color }} />
      <p className="text-xs font-small leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {text}
      </p>
    </div>
  );
}
