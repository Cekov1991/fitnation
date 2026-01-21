import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useModalTransition } from '../../utils/animations';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const modalTransition = useModalTransition();

  const variantStyles = {
    danger: {
      iconBg: 'rgb(239 68 68 / 0.2)',
      iconColor: '#f87171',
      buttonBg: 'bg-red-600 hover:bg-red-700',
      buttonText: 'text-white',
    },
    warning: {
      iconBg: 'rgb(245 158 11 / 0.2)',
      iconColor: '#fbbf24',
      buttonBg: 'bg-amber-600 hover:bg-amber-700',
      buttonText: 'text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            {...modalTransition}
            onClick={onClose}
            className="fixed inset-0 bg-black/60"
            style={{ zIndex: 10000 }}
          />

          {/* Dialog */}
          <motion.div
            {...modalTransition}
            className="fixed inset-0 flex items-center justify-center p-6"
            style={{ zIndex: 10001 }}
          >
            <div
              className="w-full max-w-sm rounded-2xl shadow-2xl p-6"
              style={{ backgroundColor: 'var(--color-bg-modal)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className="p-3 rounded-full"
                  style={{ backgroundColor: styles.iconBg }}
                >
                  <AlertTriangle
                    className="w-8 h-8"
                    style={{ color: styles.iconColor }}
                  />
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-xl font-bold text-center mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </h3>

              {/* Message */}
              <p
                className="text-center mb-6"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {message}
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.buttonBg} ${styles.buttonText}`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
