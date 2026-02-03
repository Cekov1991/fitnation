import { motion } from 'framer-motion';
import { IonInput } from '@ionic/react';
import { Timer } from 'lucide-react';
import { formatWeight } from './utils';

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
}: SetLogCardProps) {
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
      <div className="flex items-center justify-between gap-4">
        {/* Weight Input */}
        {allowWeightLogging && (
          <div className="flex-1">
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Weight
            </label>
            <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
              <IonInput 
                type="number" 
                inputmode="decimal" 
                step="0.5"
                placeholder={defaultWeight > 0 ? formatWeight(defaultWeight) : '0'}
                value={weight !== null ? formatWeight(weight) : ''} 
                onIonInput={e => {
                  const value = e.detail.value || '';
                  if (value === '') {
                    onWeightChange(null); // Use default when empty
                  } else {
                    const numValue = parseFloat(value);
                    onWeightChange(isNaN(numValue) ? null : numValue);
                  }
                }} 
                className="ionic-input-workout" 
              />
              <span className="text-sm font-semibold ml-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                kg
              </span>
            </div>
          </div>
        )}

        {/* Reps Input */}
        <div className="flex-1">
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Reps
          </label>
          <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
            <IonInput 
              type="number" 
              inputmode="numeric" 
              pattern="[0-9]*" 
              placeholder={defaultReps > 0 ? defaultReps.toString() : '0'}
              value={reps !== null ? reps.toString() : ''} 
              onIonInput={e => {
                const value = e.detail.value || '';
                if (value === '') {
                  onRepsChange(null); // Use default when empty
                } else {
                  const numValue = parseInt(value, 10);
                  onRepsChange(isNaN(numValue) ? null : numValue);
                }
              }} 
              className="ionic-input-workout" 
            />
            <span className="text-sm font-semibold ml-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              reps
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onLogSet}
          className="flex-1 px-6 py-4 bg-white rounded-2xl font-bold text-lg shadow-lg active:opacity-90"
          style={{ color: 'var(--color-primary)', WebkitTapHighlightColor: 'transparent' }}
        >
          Log Set
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
