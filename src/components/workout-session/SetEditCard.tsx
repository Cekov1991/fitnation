import { motion } from 'framer-motion';
import { IonInput } from '@ionic/react';
import { formatWeight } from './utils';
import { useSlideTransition } from '../../utils/animations';

interface SetEditCardProps {
  weight: number;
  reps: number;
  onWeightChange: (weight: number) => void;
  onRepsChange: (reps: number) => void;
  onSave: () => void;
  onCancel: () => void;
  setNumber?: number;
  allowWeightLogging?: boolean;
}

export function SetEditCard({
  weight,
  reps,
  onWeightChange,
  onRepsChange,
  onSave,
  onCancel,
  setNumber,
  allowWeightLogging = true,
}: SetEditCardProps) {
  const slideTransition = useSlideTransition()
  return (
    <motion.div 
      {...slideTransition}
      className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl p-6 shadow-2xl shadow-orange-500/20"
    >
      <p className="text-sm font-bold text-orange-100 mb-4">
        {setNumber ? `Edit Set ${setNumber}` : 'Edit Set'}
      </p>
      <div className="flex items-center justify-between gap-4">
        {/* Weight Input */}
        {allowWeightLogging && (
          <div className="flex-1">
            <label className="text-xs font-semibold text-orange-100 mb-2 block">
              Weight
            </label>
            <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
              <IonInput 
                type="number" 
                inputmode="decimal" 
                step="0.5"
                value={weight === 0 ? '' : formatWeight(weight)} 
                onIonInput={e => {
                  const value = e.detail.value || '';
                  const numValue = value === '' ? 0 : parseFloat(value);
                  onWeightChange(isNaN(numValue) ? 0 : numValue);
                }} 
                className="ionic-input-workout" 
              />
              <span className="text-sm font-semibold text-orange-100 ml-2">
                kg
              </span>
            </div>
          </div>
        )}

        {/* Reps Input */}
        <div className="flex-1">
          <label className="text-xs font-semibold text-orange-100 mb-2 block">
            Reps
          </label>
          <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
            <IonInput 
              type="number" 
              inputmode="numeric" 
              pattern="[0-9]*" 
              value={reps?.toString() || ''} 
              onIonInput={e => {
                const value = e.detail.value || '';
                const numValue = value === '' ? 0 : parseInt(value, 10);
                onRepsChange(isNaN(numValue) ? 0 : numValue);
              }} 
              className="ionic-input-workout" 
            />
            <span className="text-sm font-semibold text-orange-100 ml-2">
              reps
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel} 
          className="flex-1 px-6 py-4 rounded-2xl font-bold text-lg" 
          style={{ 
            color: 'var(--color-text-primary)',
            backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 20%, transparent)'
          }}
        >
          Cancel
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onSave}
          className="flex-1 px-6 py-4 rounded-2xl font-bold text-lg shadow-lg active:opacity-90"
          style={{ 
            color: '#ea580c',
            backgroundColor: 'var(--color-text-primary)',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          Save
        </motion.button>
      </div>
    </motion.div>
  );
}
