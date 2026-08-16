import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { DEFAULT_TRAINING_STYLES, TRAINING_STYLE_OPTIONS, useEquipmentTypes } from '@fit-nation/shared';
import type { EquipmentTypeResource } from '@fit-nation/shared';
import { useModalTransition } from '../../utils/animations';

interface RegeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: { equipment_types?: string[]; training_styles?: string[] }) => void;
  showWarning: boolean;
  isLoading: boolean;
}

export function RegeneratePlanModal({
  isOpen,
  onClose,
  onConfirm,
  showWarning,
  isLoading,
}: RegeneratePlanModalProps) {
  const { backdrop, panel } = useModalTransition();
  const { data: equipmentTypes = [] } = useEquipmentTypes();

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([...DEFAULT_TRAINING_STYLES]);

  useEffect(() => {
    if (isOpen) {
      setSelectedEquipment([]);
      setSelectedStyles([...DEFAULT_TRAINING_STYLES]);
    }
  }, [isOpen]);

  const toggleEquipment = (code: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleStyle = (code: string) => {
    setSelectedStyles((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleConfirm = () => {
    onConfirm({
      equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
      training_styles: selectedStyles.length > 0 ? selectedStyles : [...DEFAULT_TRAINING_STYLES],
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            {...backdrop}
            onClick={onClose}
            className="fixed inset-0 bg-black/60"
            style={{ zIndex: 10000 }}
          />

          {/* Dialog */}
          <motion.div
            {...panel}
            className="fixed inset-0 flex items-center justify-center p-6"
            style={{ zIndex: 10001 }}
          >
            <div
              className="w-full max-w-sm rounded-2xl shadow-2xl p-6"
              style={{ backgroundColor: 'var(--color-bg-modal)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title */}
              <h3
                className="text-xl font-bold text-center mb-5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Refresh Personalized Plan?
              </h3>

              {/* Equipment */}
              {equipmentTypes.length > 0 && (
                <div className="mb-4">
                  <h2
                    className="text-sm font-bold mb-3 uppercase tracking-wider"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Equipment
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {equipmentTypes.map((eq: EquipmentTypeResource) => {
                      const isSelected = selectedEquipment.includes(eq.code);
                      return (
                        <button
                          key={eq.code}
                          onClick={() => toggleEquipment(eq.code)}
                          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                            isSelected ? 'shadow-lg' : 'border'
                          }`}
                          style={
                            isSelected
                              ? {
                                  background:
                                    'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                                  boxShadow:
                                    '0 4px 12px color-mix(in srgb, var(--color-primary) 20%, transparent)',
                                }
                              : {
                                  backgroundColor: 'var(--color-bg-surface)',
                                  borderColor: 'var(--color-border-subtle)',
                                }
                          }
                        >
                          <span
                            className="text-xs font-medium"
                            style={{
                              color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                            }}
                          >
                            {eq.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Training Style */}
              <div className="mb-4">
                <h2
                  className="text-sm font-bold mb-3 uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Training Style
                </h2>
                <div className="flex flex-wrap gap-2">
                  {TRAINING_STYLE_OPTIONS.map((style) => {
                    const isSelected = selectedStyles.includes(style.code);
                    return (
                      <button
                        key={style.code}
                        onClick={() => toggleStyle(style.code)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                          isSelected ? 'shadow-lg' : 'border'
                        }`}
                        style={
                          isSelected
                            ? {
                                background:
                                  'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                                boxShadow:
                                  '0 4px 12px color-mix(in srgb, var(--color-primary) 20%, transparent)',
                              }
                            : {
                                backgroundColor: 'var(--color-bg-surface)',
                                borderColor: 'var(--color-border-subtle)',
                              }
                        }
                      >
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                          }}
                        >
                          {style.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warning block */}
              {showWarning && (
                <div
                  className="flex items-start gap-3 rounded-xl p-3 mb-4"
                  style={{ backgroundColor: 'rgb(245 158 11 / 0.15)' }}
                >
                  <AlertTriangle
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: '#fbbf24' }}
                  />
                  <p className="text-xs" style={{ color: '#fbbf24' }}>
                    Your current personalized plan has completed workouts. Refreshing will create a
                    new plan and you will start from scratch.
                  </p>
                </div>
              )}

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
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    'Refresh Plan'
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
