import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Power, PowerOff, Trash2, X } from 'lucide-react';
import { useModalTransition } from '../utils/animations';
interface PlanMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  onAddWorkout?: () => void;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
  isToggleLoading?: boolean;
  isDeleteLoading?: boolean;
}
export function PlanMenu({
  isOpen,
  onClose,
  isActive,
  onAddWorkout,
  onEdit,
  onToggleActive,
  onDelete,
  isToggleLoading = false,
  isDeleteLoading = false
}: PlanMenuProps) {
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
    label: 'Add Workout',
    icon: Plus,
    onClick: onAddWorkout,
    color: 'text-blue-400',
    isLoading: false,
    disabled: false
  }, {
    label: 'Edit',
    icon: Edit3,
    onClick: onEdit,
    color: 'text-gray-300',
    isLoading: false,
    disabled: false
  }, {
    label: isActive ? 'Deactivate' : 'Activate',
    icon: isActive ? PowerOff : Power,
    onClick: onToggleActive,
    color: isActive ? 'text-orange-400' : 'text-green-400',
    isLoading: isToggleLoading,
    disabled: isToggleLoading
  }, {
    label: 'Delete',
    icon: Trash2,
    onClick: onDelete,
    color: 'text-red-400',
    isLoading: isDeleteLoading,
    disabled: isDeleteLoading
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
                  Plan Actions
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
              // For items with loading states, don't close immediately - parent handles closing
              const shouldCloseImmediately = !item.isLoading && item.label !== 'Delete' && item.label !== 'Activate' && item.label !== 'Deactivate';
              return <button 
                key={item.label} 
                onClick={() => {
                if (!item.disabled) {
                  item.onClick?.();
                  if (shouldCloseImmediately) {
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