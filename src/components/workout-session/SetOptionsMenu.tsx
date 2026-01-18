import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useModalTransition } from '../../utils/animations';
import type { Set } from './types';

interface SetOptionsMenuProps {
  isOpen: boolean;
  selectedSet: Set | null;
  onClose: () => void;
  onEditSet: () => void;
  onRemoveSet: () => void;
}

export function SetOptionsMenu({
  isOpen,
  selectedSet,
  onClose,
  onEditSet,
  onRemoveSet,
}: SetOptionsMenuProps) {
  const modalTransition = useModalTransition();
  if (!selectedSet) return null;

  return (
    <AnimatePresence>
      {isOpen && selectedSet && (
        <>
          <motion.div
            {...modalTransition}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            {...modalTransition}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
          >
            <div 
              className="rounded-t-3xl shadow-2xl p-6 pb-32"
              style={{ backgroundColor: 'var(--color-bg-modal)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Set Options
                </h3>
                <button onClick={onClose} className="btn-icon">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {selectedSet.completed && (
                  <MenuButton
                    icon={<Edit2 className="text-orange-400 w-5 h-5" />}
                    iconBg="rgb(251 146 60 / 0.2)"
                    title="Edit Set"
                    subtitle="Modify weight and reps"
                    onClick={onEditSet}
                  />
                )}

                <MenuButton
                  icon={<Trash2 className="text-red-400 w-5 h-5" />}
                  iconBg="rgb(239 68 68 / 0.2)"
                  title="Remove Set"
                  subtitle="Delete this set"
                  onClick={onRemoveSet}
                  variant="danger"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Reusable menu button component
interface MenuButtonProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  variant?: 'default' | 'success' | 'danger';
}

function MenuButton({ icon, iconBg, title, subtitle, onClick, variant = 'default' }: MenuButtonProps) {
  const styles = {
    default: 'card-hover border',
    success: 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20',
    danger: 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20',
  };
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${styles[variant]}`}
      style={variant === 'default' ? {
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)'
      } : undefined}
    >
      <div className="p-2 rounded-lg" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold" style={{ 
          color: variant === 'success' ? '#4ade80' : variant === 'danger' ? '#f87171' : 'var(--color-text-primary)' 
        }}>
          {title}
        </p>
        <p className="text-xs" style={{ 
          color: variant === 'success' ? 'rgb(74 222 128 / 0.7)' : variant === 'danger' ? 'rgb(248 113 113 / 0.7)' : 'var(--color-text-secondary)' 
        }}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}
