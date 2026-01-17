import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  initialData?: {
    name: string;
    description: string;
    isActive: boolean;
  };
  onSubmit?: (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => void;
}
export function CreatePlanModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData,
  onSubmit
}: CreatePlanModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isActive, setIsActive] = useState(initialData?.isActive || false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      name,
      description,
      isActive
    });
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
      }} className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl h-full md:h-auto overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <h2 
                    className="text-2xl font-bold bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
                  >
                    {mode === 'create' ? 'Create Plan' : 'Edit Plan'}
                  </h2>
                  <motion.button type="button" whileHover={{
                scale: 1.1,
                rotate: 90
              }} whileTap={{
                scale: 0.9
              }} onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <X size={20} className="text-gray-400" />
                  </motion.button>
                </div>

                {/* Plan Name Input */}
                <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.1
            }} className="mb-6">
                  <label htmlFor="plan-name" className="block text-sm font-medium text-gray-400 mb-3">
                    Plan Name *
                  </label>
                  <input 
                    id="plan-name" 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g., Bulking Plan" 
                    required 
                    className="w-full px-5 py-4 bg-gray-800/50 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all" 
                    style={{
                      '--tw-ring-color': 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </motion.div>

                {/* Description Textarea */}
                <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.2
            }} className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-3">
                    Description
                  </label>
                  <textarea 
                    id="description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Optional description" 
                    rows={4} 
                    className="w-full px-5 py-4 bg-gray-800/50 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all resize-none" 
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </motion.div>

                {/* Active Plan Toggle */}
                <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.3
            }} className="mb-8">
                  <div className="bg-gray-800/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-semibold text-white">
                        Active Plan
                      </span>
                      <button type="button" onClick={() => setIsActive(!isActive)} className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isActive ? 'bg-green-500' : 'bg-gray-600'}`}>
                        <motion.div animate={{
                      x: isActive ? 24 : 2
                    }} transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30
                    }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Active plans are highlighted and used as the default when
                      creating workouts.
                    </p>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.button initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.4
            }} type="submit" disabled={!name.trim()} whileHover={{
              scale: name.trim() ? 1.02 : 1
            }} whileTap={{
              scale: name.trim() ? 0.98 : 1
            }} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all relative overflow-hidden group ${name.trim() ? '' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
              style={name.trim() ? {
                background: 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
                boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
              } : {}}
            >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Check size={20} />
                    {mode === 'create' ? 'CREATE PLAN' : 'SAVE CHANGES'}
                  </span>
                  {name.trim() && (
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                      style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
                    />
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}