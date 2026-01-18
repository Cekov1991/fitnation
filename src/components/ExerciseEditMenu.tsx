import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, ArrowUpDown, Trash2, X } from 'lucide-react';
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
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 10000 }} />

          {/* Bottom Sheet */}
          <motion.div ref={menuRef} initial={{
        y: '100%'
      }} animate={{
        y: 0
      }} exit={{
        y: '100%'
      }} transition={{
        type: 'spring',
        damping: 30,
        stiffness: 300
      }} 
        className="fixed inset-x-0 bottom-0 backdrop-blur-xl border-t rounded-t-3xl shadow-2xl max-w-md mx-auto"
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
                {menuItems.map((item, index) => {
              const Icon = item.icon;
              return <motion.button key={item.label} initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: index * 0.05
              }} onClick={() => {
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
                    </motion.button>;
            })}
              </div>

              {/* Cancel Button */}
              <motion.button initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.2
          }} 
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
              </motion.button>

              {/* Safe area padding for mobile */}
              <div className="h-4" />
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}