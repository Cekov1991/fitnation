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
      }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md z-50" />

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
      }} className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm z-50">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Edit Sets & Reps
                  </h2>
                  <motion.button whileHover={{
                scale: 1.1,
                rotate: 90
              }} whileTap={{
                scale: 0.9
              }} onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <X size={20} className="text-gray-400" />
                  </motion.button>
                </div>

                {/* Form */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Sets
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                      <IonInput type="number" value={sets.toString()} onIonInput={e => setSets(parseInt(e.detail.value!) || 0)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Reps
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                      <IonInput type="number" value={reps} onIonInput={e => setReps(e.detail.value || '')} placeholder="e.g., 8-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Weight
                    </label>
                    <div className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                      <IonInput type="number" value={weight} onIonInput={e => setWeight(e.detail.value || '')} placeholder="e.g., 30" />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <motion.button whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }} onClick={handleSave} className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow relative overflow-hidden group">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Check size={20} />
                    Save Changes
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}