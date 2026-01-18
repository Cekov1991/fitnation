import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { BackgroundGradients } from './BackgroundGradients';
import { usePlans } from '../hooks/useApi';
import { DAYS_OF_WEEK } from '../constants';
import { workoutSchema, WorkoutFormData } from '../schemas/workout';

interface AddWorkoutPageProps {
  mode?: 'create' | 'edit';
  planName?: string;
  initialData?: {
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  };
  onBack: () => void;
  onSubmit?: (data: {
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  }) => void;
}

export function AddWorkoutPage({
  mode = 'create',
  planName,
  initialData,
  onBack,
  onSubmit
}: AddWorkoutPageProps) {
  const { data: plans = [] } = usePlans();
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);

  const availablePlans = useMemo(() => {
    return plans.map((plan: { name: string }) => plan.name);
  }, [plans]);

  const activePlanName = useMemo(() => {
    return plans.find((plan: { is_active: boolean }) => plan.is_active)?.name;
  }, [plans]);

  const defaultPlan = initialData?.plan || planName || activePlanName || availablePlans[0] || '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      plan: defaultPlan,
      name: initialData?.name || '',
      description: initialData?.description || '',
      daysOfWeek: initialData?.daysOfWeek || [],
    },
    mode: 'onChange',
  });

  const selectedPlan = watch('plan');
  const selectedDays = watch('daysOfWeek') || [];

  // Update plan when plans load
  useEffect(() => {
    if (!selectedPlan && (planName || activePlanName || availablePlans[0])) {
      setValue('plan', planName || activePlanName || availablePlans[0] || '');
    }
  }, [activePlanName, availablePlans, planName, selectedPlan, setValue]);

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    setValue('daysOfWeek', newDays);
  };

  const handleFormSubmit = (data: WorkoutFormData) => {
    onSubmit?.({
      plan: data.plan,
      name: data.name,
      description: data.description || '',
      daysOfWeek: data.daysOfWeek || [],
    });
    onBack();
  };

  return (
    <IonPage>
      <IonContent>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
          <BackgroundGradients />

          <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={onBack} 
                className="btn-icon"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 
                className="text-3xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
              >
                {mode === 'create' ? 'Create Workout' : 'Edit Workout'}
              </h1>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)}>
              {/* Plan Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Plan *
                </label>
                <div className="relative">
                  <Controller
                    name="plan"
                    control={control}
                    render={({ field }) => (
                      <>
                        <button 
                          type="button" 
                          onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)} 
                          className="w-full px-5 py-4 border rounded-2xl text-left focus:outline-none focus:ring-2 transition-all flex items-center justify-between"
                          style={{ 
                            backgroundColor: 'var(--color-bg-elevated)',
                            borderColor: errors.plan ? '#f87171' : 'var(--color-border)',
                            color: 'var(--color-text-primary)'
                          }}
                          onFocus={(e) => {
                            if (!errors.plan) {
                              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                            }
                          }}
                          onBlur={(e) => {
                            if (!errors.plan) {
                              e.currentTarget.style.borderColor = 'var(--color-border)';
                            }
                          }}
                        >
                          <span>{field.value || 'Select a plan'}</span>
                          <ChevronDown 
                            className={`w-5 h-5 transition-transform ${isPlanDropdownOpen ? 'rotate-180' : ''}`}
                            style={{ color: 'var(--color-text-secondary)' }}
                          />
                        </button>

                        {isPlanDropdownOpen && (
                          <div 
                            className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden z-10"
                            style={{ 
                              backgroundColor: 'var(--color-bg-modal)',
                              borderColor: 'var(--color-border)'
                            }}
                          >
                            {availablePlans.map((plan: string) => (
                              <button 
                                key={plan} 
                                type="button" 
                                onClick={() => {
                                  field.onChange(plan);
                                  setIsPlanDropdownOpen(false);
                                }} 
                                className="w-full px-5 py-3 text-left transition-colors"
                                style={field.value === plan ? {
                                  backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                                  color: 'var(--color-primary)'
                                } : {
                                  color: 'var(--color-text-primary)'
                                }}
                              >
                                {plan}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  />
                </div>
                {errors.plan && <p className="text-xs text-red-400 mt-1">{errors.plan.message}</p>}
              </div>

              {/* Workout Name Input */}
              <div className="mb-6">
                <label htmlFor="workout-name" className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Workout Name *
                </label>
                <input 
                  id="workout-name" 
                  type="text" 
                  {...register('name')}
                  placeholder="e.g., Push Day" 
                  className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: errors.name ? '#f87171' : 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }} 
                  onFocus={(e) => {
                    if (!errors.name) {
                      e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.name) {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }
                  }}
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>

              {/* Description Textarea */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Description
                </label>
                <textarea 
                  id="description" 
                  {...register('description')}
                  placeholder="Optional description" 
                  rows={4} 
                  className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ 
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: errors.description ? '#f87171' : 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }} 
                  onFocus={(e) => {
                    if (!errors.description) {
                      e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.description) {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }
                  }}
                />
                {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
              </div>

              {/* Days of Week - Modern Checkboxes */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Days of Week
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day, index) => {
                    const isSelected = selectedDays.includes(day.full);
                    return (
                      <button 
                        key={day.full} 
                        type="button" 
                        onClick={() => toggleDay(day.full)} 
                        className={`relative aspect-square rounded-xl font-bold text-sm transition-all ${isSelected ? 'text-white shadow-lg' : 'border'}`}
                        style={isSelected ? {
                          background: 'linear-gradient(to bottom right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
                          boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
                        } : {
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-4 h-4" strokeWidth={3} />
                          </div>
                        )}
                        <span className={isSelected ? 'opacity-0' : ''}>
                          {day.short}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedDays.length > 0 && (
                  <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
                    Selected: {selectedDays.join(', ')}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={!isValid || isSubmitting}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all relative overflow-hidden group ${isValid ? '' : 'cursor-not-allowed opacity-50'}`}
                style={isValid ? {
                  background: 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
                  boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
                } : {
                  backgroundColor: 'var(--color-bg-elevated)'
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Check size={20} />
                  {isSubmitting ? 'Saving...' : mode === 'create' ? 'CREATE WORKOUT' : 'SAVE CHANGES'}
                </span>
                {isValid && (
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                    style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
                  />
                )}
              </button>
            </form>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
}
