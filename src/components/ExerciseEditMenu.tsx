import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, ArrowUpDown, Trash2, X } from 'lucide-react';
import { useModalTransition } from '../utils/animations';
interface ExerciseEditMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSetsReps?: () => void;
  onSwap?: () => void;
  onRemove?: () => void;
}
export function ExerciseEditMenu({
  isOpen,
  onClose,
  onEditSetsReps,
  onSwap,
  onRemove
}: ExerciseEditMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const modalTransition = useModalTransition();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  const menuItems = [{
    label: 'Edit Sets & Reps',
    icon: Edit3,
    onClick: onEditSetsReps,
    color: 'text-blue-400'
  }, {
    label: 'Swap Exercise',
    icon: ArrowUpDown,
    onClick: onSwap,
    color: 'text-gray-300'
  }, {
    label: 'Remove',
    icon: Trash2,
    onClick: onRemove,
    color: 'text-red-400'
  }];
  return <AnimatePresence>
      {isOpen && <>
          {/* Backdrop */}
          <motion.div 
            {...modalTransition}
            onClick={onClose} 
            className="fixed inset-0 bg-black/60  " 
            style={{ zIndex: 10000 }} 
          />

          {/* Bottom Sheet */}
          <motion.div 
            ref={menuRef} 
            {...modalTransition}
            className="fixed inset-x-0 bottom-0   border-t rounded-t-3xl shadow-2xl max-w-md mx-auto"
        style={{ 
          zIndex: 10001,
          backgroundColor: 'var(--color-bg-modal)',
          borderColor: 'var(--color-border)'
        }}
      >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Exercise Actions
                </h3>
                <button 
                  onClick={onClose} 
                  className="p-2 rounded-full transition-colors"
                  style={{ backgroundColor: 'var(--color-border-subtle)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
                  }}
                >
                  <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-2 mb-6">
                {menuItems.map((item) => {
              const Icon = item.icon;
              return <button 
                key={item.label} 
                onClick={() => {
                item.onClick?.();
                onClose();
              }} 
                className="w-full flex items-center gap-4 p-4 rounded-xl transition-colors text-left group"
                style={{ backgroundColor: 'var(--color-bg-surface)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                }}
              >
                      <div 
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                        }}
                      >
                        <Icon 
                          className="w-5 h-5" 
                          style={{ color: item.color === 'text-gray-300' ? 'var(--color-text-secondary)' : undefined }}
                        />
                      </div>
                      <span 
                        className="text-base font-medium"
                        style={{ color: item.color === 'text-gray-300' ? 'var(--color-text-secondary)' : undefined }}
                      >
                        {item.label}
                      </span>
                    </button>;
            })}
              </div>

              {/* Cancel Button */}
              <button 
            onClick={onClose} 
            className="w-full py-4 rounded-xl font-semibold transition-colors"
            style={{ 
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
            }}
          >
                Cancel
              </button>

              {/* Safe area padding for mobile */}
              <div className="h-4" />
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}