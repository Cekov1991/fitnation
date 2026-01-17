import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Dumbbell, ChevronRight, Zap, Target, TrendingUp } from 'lucide-react';
import { useTemplates } from '../hooks/useApi';
interface WorkoutSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: number | null, templateName: string) => void;
}
const colorClasses = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20'
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20'
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20'
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20'
  }
};
export function WorkoutSelectionModal({
  isOpen,
  onClose,
  onSelectTemplate
}: WorkoutSelectionModalProps) {
  const {
    data: templates = []
  } = useTemplates();

  const workoutTemplates = useMemo(() => {
    const icons = [Dumbbell, Zap, Target, TrendingUp];
    const colors = ['blue', 'purple', 'green', 'orange'] as const;
    return templates.map((template, index) => ({
      id: template.id,
      name: template.name,
      exercises: template.exercises?.length ?? 0,
      plan: template.plan?.name || 'Plan',
      icon: icons[index % icons.length],
      color: colors[index % colors.length]
    }));
  }, [templates]);
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
        y: 100
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: 100
      }} transition={{
        type: 'spring',
        damping: 30,
        stiffness: 300
      }} className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden">
            <div className="bg-gray-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Choose Workout
                  </h2>
                  <p className="text-sm text-gray-400">
                    Select a workout to start or begin a blank session.
                  </p>
                </div>
                <motion.button whileHover={{
              scale: 1.1,
              rotate: 90
            }} whileTap={{
              scale: 0.9
            }} onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <X size={20} className="text-gray-400" />
                </motion.button>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(85vh-100px)] p-6">
                {/* Blank Session Card */}
                <motion.button initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.1
            }} whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }} onClick={() => onSelectTemplate(null, 'Blank Session')} className="w-full mb-6 relative group">
                  {/* Dashed border animation */}
                  <div 
                    className="absolute inset-0 rounded-2xl border-2 border-dashed transition-colors"
                    style={{ 
                      borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
                    }}
                  />

                  <div 
                    className="relative backdrop-blur-sm rounded-2xl p-6 flex items-center gap-4"
                    style={{ 
                      background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 5%, transparent), color-mix(in srgb, var(--color-secondary) 5%, transparent))' 
                    }}
                  >
                    {/* Plus Icon */}
                    <div 
                      className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-shadow"
                      style={{ 
                        background: 'linear-gradient(to bottom right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
                        boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
                      }}
                    >
                      <Plus className="text-white w-7 h-7" strokeWidth={2.5} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-white mb-1">
                        Blank Session
                      </h3>
                      <p className="text-sm text-gray-400">
                        Start fresh and add exercises as you go
                      </p>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="text-gray-500 group-hover:text-white transition-colors flex-shrink-0" size={20} />
                  </div>
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Or Choose a Template
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                </div>

                {/* Template Cards */}
                <div className="space-y-3">
                  {workoutTemplates.map((template, index) => {
                const Icon = template.icon;
                const colors = colorClasses[template.color as keyof typeof colorClasses];
                return <motion.button key={template.id} onClick={() => onSelectTemplate(template.id, template.name)} initial={{
                  opacity: 0,
                  x: -20
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  delay: 0.2 + index * 0.1
                }} whileHover={{
                  scale: 1.02,
                  x: 5
                }} whileTap={{
                  scale: 0.98
                }} className="w-full bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:bg-gray-800/60 transition-colors group">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                          <Icon className={`${colors.text} w-6 h-6`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-left">
                          <h3 
                            className="text-base font-bold text-white mb-1 transition-colors"
                            style={{ 
                              color: 'var(--color-primary)' 
                            }}
                          >
                            {template.name}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">
                              {template.exercises} exercises
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-700/50 border border-gray-600/50 rounded-full text-gray-400">
                              {template.plan}
                            </span>
                          </div>
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="text-gray-500 group-hover:text-white transition-colors flex-shrink-0" size={20} />
                      </motion.button>;
              })}
                </div>

                {/* Bottom padding for safe area */}
                <div className="h-6" />
              </div>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}