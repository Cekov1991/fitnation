import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Dumbbell, ChevronRight, Zap, Target, TrendingUp, Loader2 } from 'lucide-react';
import { useTemplates } from '../hooks/useApi';
import { useModalTransition } from '../utils/animations';
interface WorkoutSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: number | null, templateName: string) => void;
  isLoading?: boolean;
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
  onSelectTemplate,
  isLoading = false
}: WorkoutSelectionModalProps) {
  const modalTransition = useModalTransition();
  const [selectedId, setSelectedId] = useState<number | null | undefined>(undefined);
  const {
    data: templates = []
  } = useTemplates();

  // Reset selected state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedId(undefined);
    }
  }, [isOpen]);

  const handleSelect = (templateId: number | null, templateName: string) => {
    if (isLoading) return;
    setSelectedId(templateId);
    onSelectTemplate(templateId, templateName);
  };

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
          <motion.div {...modalTransition} onClick={onClose} className="fixed inset-0 bg-black/80  " style={{ zIndex: 10000 }} />

          {/* Modal */}
          <motion.div {...modalTransition} className="fixed inset-x-0 bottom-0 max-h-[85vh] overflow-hidden" style={{ zIndex: 10001 }}>
            <div 
              className="  border-t rounded-t-3xl shadow-2xl"
              style={{ 
                backgroundColor: 'var(--color-bg-modal)',
                borderColor: 'var(--color-border)'
              }}
            >
              {/* Header */}
              <div 
                className="flex justify-between items-center p-6 border-b"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    Choose Workout
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Select a workout to start or begin a blank session.
                  </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ backgroundColor: 'var(--color-border-subtle)' }}>
                  <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(85vh-100px)] p-6">
                {/* Blank Session Card */}
                <button onClick={() => handleSelect(null, 'Blank Session')} disabled={isLoading} className="w-full mb-6 relative group disabled:opacity-50 disabled:cursor-not-allowed">
                  {/* Dashed border animation */}
                  <div 
                    className="absolute inset-0 rounded-2xl border-2 border-dashed transition-colors"
                    style={{ 
                      borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
                    }}
                  />

                  <div 
                    className="relative   rounded-2xl p-6 flex items-center gap-4"
                    style={{ 
                      background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 5%, transparent), color-mix(in srgb, var(--color-secondary) 5%, transparent))' 
                    }}
                  >
                    {/* Plus Icon or Loading */}
                    <div 
                      className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-shadow"
                      style={{ 
                        background: 'linear-gradient(to bottom right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
                        boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
                      }}
                    >
                      {isLoading && selectedId === null ? (
                        <Loader2 className="text-white w-7 h-7 animate-spin" />
                      ) : (
                        <Plus className="text-white w-7 h-7" strokeWidth={2.5} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        {isLoading && selectedId === null ? 'Starting Session...' : 'Blank Session'}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Start fresh and add exercises as you go
                      </p>
                    </div>

                    {/* Chevron */}
                    {!(isLoading && selectedId === null) && (
                      <ChevronRight 
                        className="transition-colors flex-shrink-0" 
                        size={20}
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                      />
                    )}
                  </div>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Or Choose a Template
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                </div>

                {/* Template Cards */}
                <div className="space-y-3">
                  {workoutTemplates.map((template) => {
                const Icon = template.icon;
                const colors = colorClasses[template.color as keyof typeof colorClasses];
                const isThisLoading = isLoading && selectedId === template.id;
                return <button key={template.id} onClick={() => handleSelect(template.id, template.name)} disabled={isLoading}
                  className="w-full   border rounded-2xl p-5 flex items-center gap-4 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                  }}
                >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                          {isThisLoading ? (
                            <Loader2 className={`${colors.text} w-6 h-6 animate-spin`} />
                          ) : (
                            <Icon className={`${colors.text} w-6 h-6`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-left">
                          <h3 
                            className="text-base font-bold mb-1 transition-colors"
                            style={{ 
                              color: 'var(--color-primary)' 
                            }}
                          >
                            {isThisLoading ? 'Starting...' : template.name}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {template.exercises} exercises
                            </span>
                            <span 
                              className="text-xs px-2 py-0.5 border rounded-full"
                              style={{ 
                                backgroundColor: 'var(--color-bg-elevated)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-secondary)'
                              }}
                            >
                              {template.plan}
                            </span>
                          </div>
                        </div>

                        {/* Chevron or nothing when loading */}
                        {!isThisLoading && (
                          <ChevronRight 
                            className="transition-colors flex-shrink-0" 
                            size={20}
                            style={{ color: 'var(--color-text-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--color-text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                          />
                        )}
                      </button>;
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