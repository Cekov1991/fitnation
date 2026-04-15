import { AlertTriangle, Info, Sparkles } from 'lucide-react';

interface ProgressionBannerProps {
  status: 'no_history' | 'below_min' | 'working' | 'ready';
  maxTargetReps: number;
  allowWeightLogging: boolean;
}

const WEIGHTED_COPY = {
  no_history: "First time logging this exercise! We've estimated a starting weight for you.",
  below_min:  'Last session was tough — consider lowering your weight to hit your target reps.',
  ready:      (reps: number) => `Weight increase! You hit ${reps} reps last time.`,
};

const BODYWEIGHT_COPY = {
  no_history: "First time logging this exercise! Give it your best effort.",
  below_min:  'Last session was tough — keep pushing toward your rep target.',
  ready:      (reps: number) => `Great work! You hit ${reps} reps last time — try to beat it.`,
};

const STATUS_META = {
  no_history: { color: 'var(--color-primary)', icon: Info },
  below_min:  { color: '#f59e0b',              icon: AlertTriangle },
  ready:      { color: '#22c55e',              icon: Sparkles },
} as const;

export function ProgressionBanner({ status, maxTargetReps, allowWeightLogging }: ProgressionBannerProps) {
  if (status === 'working') return null;

  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const copy = allowWeightLogging ? WEIGHTED_COPY : BODYWEIGHT_COPY;
  const text = status === 'ready' ? copy.ready(maxTargetReps) : copy[status];

  return (
    <div
      className="flex items-start gap-3 rounded-xl border px-4 py-3"
      style={{
        backgroundColor: `color-mix(in srgb, ${meta.color} 2%, transparent)`,
        borderColor: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
      }}
    >
      <Icon className="w-4 h-4 mt-1.5 flex-shrink-0" style={{ color: meta.color }} />
      <p className="text-xs font-small leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {text}
      </p>
    </div>
  );
}
