import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { formatWeight } from './utils';
import { formatRepRange, inputStep, useUnitSystem, type WeightUnit } from '@fit-nation/shared';

interface SetLogCardProps {
  weight: number | null;
  reps: number | null;
  defaultWeight: number;
  defaultReps: number;
  onWeightChange: (weight: number | null) => void;
  onRepsChange: (reps: number | null) => void;
  onLogSet: () => void;
  onStartTimer?: () => void;
  setNumber?: number;
  showTimerButton?: boolean;
  allowWeightLogging?: boolean;
  goalMinReps?: number;
  goalMaxReps?: number;
  goalWeight?: number | null;
  totalRepsPrevious?: number | null;
  totalRepsTarget?: number | null;
  isLoading?: boolean;
  weightUnit: WeightUnit;
}

export function SetLogCard({
  weight,
  reps,
  defaultWeight,
  defaultReps,
  onWeightChange,
  onRepsChange,
  onLogSet,
  onStartTimer,
  setNumber,
  showTimerButton = false,
  allowWeightLogging = true,
  goalMinReps,
  goalMaxReps,
  goalWeight,
  totalRepsPrevious,
  totalRepsTarget,
  isLoading = false,
  weightUnit,
}: SetLogCardProps) {
  // weightUnit arrives as a prop (the parent computes it once), but the input
  // step is a property of the Measurement Kind, so it is resolved here.
  const unitSystem = useUnitSystem();
  const showGoalWeightBadge = goalWeight != null && goalWeight > 0 && goalWeight !== defaultWeight;
  const showTotalRepsHint = totalRepsTarget != null;

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded-3xl p-6 shadow-2xl"
      style={{
        background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-secondary))',
        boxShadow: '0 20px 50px color-mix(in srgb, var(--color-primary) 20%, transparent)'
      }}
    >
      <p className="text-sm font-bold mb-4" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
        {setNumber ? `Set ${setNumber}` : 'Log Your Set'}
      </p>
      <div className="flex items-start justify-between gap-4">
        {/* Weight Input */}
        {allowWeightLogging && (
          <div className="flex-1">
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Weight
            </label>
            <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
              <input
                type="number"
                inputMode="decimal"
                step={String(inputStep('training_weight', unitSystem))}
                placeholder={defaultWeight > 0 ? formatWeight(defaultWeight) : '0'}
                // Raw value, not formatWeight: the display formatter rounds to
                // 1dp and this value is written back on save, so formatting it
                // here would nudge a metric weight a little further every cycle.
                value={weight !== null ? String(weight) : ''}
                onChange={e => {
                  const value = e.target.value || '';
                  if (value === '') {
                    onWeightChange(null); // Use default when empty
                  } else {
                    const numValue = parseFloat(value);
                    onWeightChange(isNaN(numValue) ? null : numValue);
                  }
                }}
                className="flex-1 w-full min-w-0 bg-transparent border-0 outline-none p-0 text-4xl font-black text-center text-white placeholder:text-[#d6d6d653]"
              />
              <span className="text-sm font-semibold ml-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {weightUnit}
              </span>
            </div>
            {showGoalWeightBadge && (
              <p className="mt-1.5 text-xs leading-tight" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                Suggested: {formatWeight(goalWeight!)} {weightUnit} based on your performance
              </p>
            )}
          </div>
        )}

        {/* Reps Input */}
        <div className="flex-1">
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Reps
          </label>
          <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={defaultReps > 0 ? defaultReps.toString() : '0'}
              value={reps !== null ? reps.toString() : ''}
              onChange={e => {
                const value = e.target.value || '';
                if (value === '') {
                  onRepsChange(null); // Use default when empty
                } else {
                  const numValue = parseInt(value, 10);
                  onRepsChange(isNaN(numValue) ? null : numValue);
                }
              }}
              className="flex-1 w-full min-w-0 bg-transparent border-0 outline-none p-0 text-4xl font-black text-center text-white placeholder:text-[#d6d6d653]"
            />
            <span className="text-sm font-semibold ml-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              reps
            </span>
          </div>
          {showTotalRepsHint ? (
            <p className="mt-1.5 text-xs leading-tight" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
              {totalRepsPrevious != null
                ? `Last: ${totalRepsPrevious} reps`
                : `Target: ${goalMinReps}-${goalMaxReps} reps`}
            </p>
          ) : (
            goalMinReps !== undefined && goalMaxReps !== undefined && (
              <p className="mt-1.5 text-xs leading-tight" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                Target: {formatRepRange(goalMinReps, goalMaxReps)} reps
              </p>
            )
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onLogSet}
          disabled={isLoading}
          className="flex-1 px-6 py-4 bg-white rounded-2xl font-bold text-lg shadow-lg active:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          style={{ color: 'var(--color-primary)', WebkitTapHighlightColor: 'transparent' }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-t-transparent border-current rounded-full animate-spin" />
          ) : (
            'Log Set'
          )}
        </motion.button>
        
        {showTimerButton && onStartTimer && (
          <button
            onClick={onStartTimer}
            className="px-4 py-4 bg-white/20 border-2 border-white/30 rounded-2xl flex items-center justify-center active:opacity-70"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Timer className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
