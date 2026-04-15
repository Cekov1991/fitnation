import { AlertTriangle, Info, Sparkles, Target } from 'lucide-react';

interface ProgressionBannerProps {
  status: 'no_history' | 'below_min' | 'working' | 'ready';
  maxTargetReps: number;
  progressionMode: 'double_progression' | 'total_reps';
  totalRepsPrevious?: number | null;
  totalRepsTarget?: number | null;
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
  working:    { color: 'var(--color-primary)', icon: Target },
  ready:      { color: '#22c55e',              icon: Sparkles },
} as const;

export function ProgressionBanner({ status, maxTargetReps, progressionMode, totalRepsPrevious, totalRepsTarget }: ProgressionBannerProps) {
  // For double_progression, 'working' means no actionable message
  if (status === 'working' && progressionMode === 'double_progression') return null;

  // For total_reps 'working': show the goal if we have target data
  if (status === 'working' && progressionMode === 'total_reps') {
    if (totalRepsTarget == null) return null;
    const text = totalRepsPrevious != null
      ? `Nice work hitting ${totalRepsPrevious} total reps! One more rep to beat your record — go for ${totalRepsTarget} this time.`
      : `Go for ${totalRepsTarget} total reps this session.`;
    const meta = STATUS_META.working;
    const Icon = meta.icon;
    return (
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3"
        style={{
          backgroundColor: `color-mix(in srgb, ${meta.color} 2%, transparent)`,
          borderColor: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
        }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: meta.color }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {text}
        </p>
      </div>
    );
  }

  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const copy = progressionMode === 'double_progression' ? WEIGHTED_COPY : BODYWEIGHT_COPY;
  const text = status === 'ready'
    ? copy.ready(maxTargetReps)
    : copy[status as 'no_history' | 'below_min'];

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{
        backgroundColor: `color-mix(in srgb, ${meta.color} 2%, transparent)`,
        borderColor: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: meta.color }} />
      <p className="text-xs font-small leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {text}
      </p>
    </div>
  );
}
