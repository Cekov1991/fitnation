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
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white pb-32">
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-30" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-30" />
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
            <ArrowLeft className="text-gray-400 w-6 h-6" />
          </motion.button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
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
            <label htmlFor="plan-name" className="block text-sm font-medium text-gray-400 mb-3">
              Plan Name *
            </label>
            <input id="plan-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Bulking Plan" required className="w-full px-5 py-4 bg-gray-800/50 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all" />
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
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" rows={4} className="w-full px-5 py-4 bg-gray-800/50 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" />
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
        }} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all relative overflow-hidden group ${name.trim() ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/25 hover:shadow-blue-500/40' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}>
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Check size={20} />
              {mode === 'create' ? 'CREATE PLAN' : 'SAVE CHANGES'}
            </span>
            {name.trim() && <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
          </motion.button>
        </form>
      </main>
    </div>
      </IonContent>
    </IonPage>;
}