import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, Check } from 'lucide-react';
interface CreatePlanPageProps {
  mode?: 'create' | 'edit';
  initialData?: {
    name: string;
    description: string;
    isActive: boolean;
  };
  onBack: () => void;
  onSubmit?: (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => void;
}
export function CreatePlanPage({
  mode = 'create',
  initialData,
  onBack,
  onSubmit
}: CreatePlanPageProps) {
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
    onBack();
  };
  return <IonPage>
      <IonContent>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div 
            className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" 
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
          />
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" 
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
          />
        </div>

      <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex items-center gap-4 mb-8">
          <motion.button whileHover={{
          scale: 1.1,
          x: -2
        }} whileTap={{
          scale: 0.9
        }} onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
          </motion.button>
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            {mode === 'create' ? 'Create Plan' : 'Edit Plan'}
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit}>
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
            <label htmlFor="plan-name" className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Plan Name *
            </label>
            <input 
              id="plan-name" 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., Bulking Plan" 
              required 
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all"
              style={{ 
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }} 
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
            <label htmlFor="description" className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Description
            </label>
            <textarea 
              id="description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Optional description" 
              rows={4} 
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none"
              style={{ 
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }} 
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
            <div 
              className="border rounded-2xl p-5"
              style={{ 
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-subtle)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Active Plan
                </span>
                <button 
                  type="button" 
                  onClick={() => setIsActive(!isActive)} 
                  className="relative w-14 h-8 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: isActive ? '#22c55e' : 'var(--color-bg-elevated)' }}
                >
                  <motion.div 
                    animate={{
                      x: isActive ? 24 : 2
                    }} 
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30
                    }} 
                    className="absolute top-1 w-6 h-6 rounded-full shadow-lg"
                    style={{ backgroundColor: 'var(--color-text-primary)' }}
                  />
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
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
        }} 
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all relative overflow-hidden group ${name.trim() ? '' : 'cursor-not-allowed opacity-50'}`}
          style={!name.trim() ? {
            backgroundColor: 'var(--color-bg-elevated)'
          } : undefined}
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
      </main>
    </div>
      </IonContent>
    </IonPage>;
}