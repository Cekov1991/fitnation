import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IonInput } from '@ionic/react';
import { X, Check } from 'lucide-react';
interface EditSetsRepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSets: number;
  initialReps: string;
  initialWeight: string;
  onSave: (sets: number, reps: string, weight: string) => void;
}
export function EditSetsRepsModal({
  isOpen,
  onClose,
  initialSets,
  initialReps,
  initialWeight,
  onSave
}: EditSetsRepsModalProps) {
  const [sets, setSets] = useState(initialSets);
  const [reps, setReps] = useState(initialReps);
  const [weight, setWeight] = useState(initialWeight);
  const handleSave = () => {
    onSave(sets, reps, weight);
    onClose();
  };
  return <AnimatePresence>
      {isOpen && <>
          {/* Backdrop */}
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" style={{ zIndex: 10000 }} />

          {/* Modal */}
          <motion.div initial={{
        opacity: 0,
        scale: 0.95,
        y: 20
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.95,
        y: 20
      }} transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300
      }} className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm" style={{ zIndex: 10001 }}>
            <div 
              className="backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden"
              style={{ 
                backgroundColor: 'var(--color-bg-modal)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 
                    className="text-xl font-bold bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
                  >
                    Edit Sets & Reps
                  </h2>
                  <motion.button whileHover={{
                scale: 1.1,
                rotate: 90
              }} whileTap={{
                scale: 0.9
              }} onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                  </motion.button>
                </div>

                {/* Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Sets
                    </label>
                    <div 
                      className="w-full px-4 py-3 border rounded-xl transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <IonInput type="number" inputmode="numeric" pattern="[0-9]*" value={sets.toString()} onIonInput={e => setSets(parseInt(e.detail.value!) || 0)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Reps
                    </label>
                    <div 
                      className="w-full px-4 py-3 border rounded-xl transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <IonInput type="number" inputmode="numeric" pattern="[0-9]*" value={reps} onIonInput={e => setReps(e.detail.value || '')} placeholder="e.g., 8-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Weight
                    </label>
                    <div 
                      className="w-full px-4 py-3 border rounded-xl transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <IonInput type="number" inputmode="decimal" pattern="[0-9.]*" value={weight} onIonInput={e => setWeight(e.detail.value || '')} placeholder="e.g., 30" />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <motion.button whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }} onClick={handleSave} className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-shadow relative overflow-hidden group"
              style={{
                background: 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
                boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
              }}
            >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Check size={20} />
                    Save Changes
                  </span>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                    style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}