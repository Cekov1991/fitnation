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
  isRemoveLoading?: boolean;
  exerciseName?: string;
}
export function ExerciseEditMenu({
  isOpen,
  onClose,
  onEditSetsReps,
  onSwap,
  onRemove,
  isRemoveLoading = false,
  exerciseName
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
    color: 'text-blue-400',
    isLoading: false,
    disabled: false
  }, {
    label: 'Swap Exercise',
    icon: ArrowUpDown,
    onClick: onSwap,
    color: 'text-gray-300',
    isLoading: false,
    disabled: false
  }, {
    label: 'Remove',
    icon: Trash2,
    onClick: onRemove,
    color: 'text-red-400',
    isLoading: isRemoveLoading,
    disabled: isRemoveLoading
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
              <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Exercise Actions
                    </h3>
                    {exerciseName && (
                      <p 
                        className="text-sm mt-1"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {exerciseName}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-2 rounded-full transition-colors ml-4"
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
              </div>

              {/* Menu Items */}
              <div className="space-y-2 mb-6">
                {menuItems.map((item) => {
              const Icon = item.icon;
              return <button 
                key={item.label} 
                onClick={() => {
                if (!item.disabled) {
                  item.onClick?.();
                  // Only close menu immediately for non-async operations
                  // Async operations (like remove) will close the menu themselves when done
                  // Don't close if it's loading or if it's the Remove action (which is async)
                  if (!item.isLoading && item.label !== 'Remove') {
                    onClose();
                  }
                }
              }} 
                disabled={item.disabled}
                className="w-full flex items-center gap-4 p-4 rounded-xl transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-bg-surface)' }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                }}
              >
                      <div 
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                        onMouseEnter={(e) => {
                          if (!item.disabled) {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                        }}
                      >
                        {item.isLoading ? (
                          <div className="w-5 h-5 border-2 border-t-transparent border-current rounded-full animate-spin" style={{ color: item.color === 'text-gray-300' ? 'var(--color-text-secondary)' : undefined }} />
                        ) : (
                          <Icon 
                            className="w-5 h-5" 
                            style={{ color: item.color === 'text-gray-300' ? 'var(--color-text-secondary)' : undefined }}
                          />
                        )}
                      </div>
                      <span 
                        className="text-base font-medium"
                        style={{ color: item.color === 'text-gray-300' ? 'var(--color-text-secondary)' : undefined }}
                      >
                        {item.isLoading ? 'Processing...' : item.label}
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