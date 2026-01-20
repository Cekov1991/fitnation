import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { IonInput } from '@ionic/react';
import { X, Check } from 'lucide-react';
import { LoadingButton } from './ui';
import { setsRepsSchema, SetsRepsFormData } from '../schemas/setsReps';
import { useModalTransition } from '../utils/animations';

interface EditSetsRepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSets: number;
  initialReps: string;
  initialWeight: string;
  onSave: (sets: number, reps: string, weight: string) => void;
  isLoading?: boolean;
}

export function EditSetsRepsModal({
  isOpen,
  onClose,
  initialSets,
  initialReps,
  initialWeight,
  onSave,
  isLoading = false
}: EditSetsRepsModalProps) {
  const modalTransition = useModalTransition();
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SetsRepsFormData>({
    resolver: zodResolver(setsRepsSchema),
    defaultValues: {
      sets: initialSets,
      reps: initialReps,
      weight: initialWeight,
    },
    mode: 'onChange',
  });

  // Reset form when modal opens with new values
  useEffect(() => {
    if (isOpen) {
      reset({
        sets: initialSets,
        reps: initialReps,
        weight: initialWeight,
      });
    }
  }, [isOpen, initialSets, initialReps, initialWeight, reset]);

  const onSubmit = async (data: SetsRepsFormData) => {
    await onSave(data.sets, data.reps, data.weight || '');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            {...modalTransition}
            onClick={onClose} 
            className="fixed inset-0 bg-black/80  " 
            style={{ zIndex: 10000 }} 
          />

          {/* Modal */}
          <motion.div 
            {...modalTransition}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm" 
            style={{ zIndex: 10001 }}
          >
            <div 
              className="  border rounded-3xl shadow-2xl overflow-hidden"
              style={{ 
                backgroundColor: 'var(--color-bg-modal)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 
                    className="text-xl font-bold bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
                  >
                    Edit Sets & Reps
                  </h2>
                  <button 
                    onClick={onClose} 
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Sets
                      </label>
                      <div 
                        className="w-full px-4 py-3 border rounded-xl transition-all"
                        style={{ 
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: errors.sets ? '#f87171' : 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        <Controller
                          name="sets"
                          control={control}
                          render={({ field }) => (
                            <IonInput 
                              type="number" 
                              inputmode="numeric" 
                              pattern="[0-9]*" 
                              value={field.value?.toString() || ''} 
                              onIonInput={e => {
                                const val = e.detail.value;
                                field.onChange(val ? parseInt(val, 10) || 0 : 0);
                              }} 
                            />
                          )}
                        />
                      </div>
                      {errors.sets && <p className="text-xs text-red-400 mt-1">{errors.sets.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Reps
                      </label>
                      <div 
                        className="w-full px-4 py-3 border rounded-xl transition-all"
                        style={{ 
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: errors.reps ? '#f87171' : 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        <Controller
                          name="reps"
                          control={control}
                          render={({ field }) => (
                            <IonInput 
                              type="text" 
                              inputmode="numeric" 
                              value={field.value || ''} 
                              onIonInput={e => field.onChange(e.detail.value || '')} 
                              placeholder="e.g., 8-10" 
                            />
                          )}
                        />
                      </div>
                      {errors.reps && <p className="text-xs text-red-400 mt-1">{errors.reps.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Weight
                      </label>
                      <div 
                        className="w-full px-4 py-3 border rounded-xl transition-all"
                        style={{ 
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: errors.weight ? '#f87171' : 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        <Controller
                          name="weight"
                          control={control}
                          render={({ field }) => (
                            <IonInput 
                              type="text" 
                              inputmode="decimal" 
                              value={field.value || ''} 
                              onIonInput={e => field.onChange(e.detail.value || '')} 
                              placeholder="e.g., 30" 
                            />
                          )}
                        />
                      </div>
                      {errors.weight && <p className="text-xs text-red-400 mt-1">{errors.weight.message}</p>}
                    </div>
                  </div>

                  {/* Save Button */}
                  <LoadingButton
                    type="submit"
                    isLoading={isSubmitting || isLoading}
                    loadingText="Saving..."
                    disabled={!isValid || isSubmitting || isLoading}
                    className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-shadow relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: isValid 
                        ? 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))'
                        : 'var(--color-bg-elevated)',
                      boxShadow: isValid ? '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)' : 'none'
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Check size={20} />
                      Save Changes
                    </span>
                    {isValid && (
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                        style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
                      />
                    )}
                  </LoadingButton>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
