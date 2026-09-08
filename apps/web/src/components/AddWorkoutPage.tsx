import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { LoadingButton } from './ui';
import { usePlans } from '@fit-nation/shared';
import { workoutSchema, WorkoutFormData } from '@fit-nation/shared';


interface AddWorkoutPageProps {
  mode?: 'create' | 'edit';
  planName?: string;
  templateId?: number; // Current workout ID for edit mode (to exclude from occupied days)
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
  /** Unused since the day picker went (0020, 1/3); kept because the route wrapper passes it. */
  onSwap?: (data: {
    currentWorkoutDay: string;
    targetDay: string;
    targetWorkoutId: number;
  }) => void;
  isLoading?: boolean;
}

export function AddWorkoutPage({
  mode = 'create',
  planName,
  initialData,
  onBack,
  onSubmit,
  isLoading = false
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
    reset,
    control,
    formState: { errors, isSubmitting },
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

  // Reset form when initialData changes (e.g., when API returns fresh data)
  // Use JSON.stringify to create a stable dependency for the daysOfWeek array
  const initialDataKey = initialData 
    ? `${initialData.plan}-${initialData.name}-${initialData.daysOfWeek?.join(',')}`
    : null;
  
  useEffect(() => {
    if (initialData && mode === 'edit') {
      reset({
        plan: initialData.plan || '',
        name: initialData.name || '',
        description: initialData.description || '',
        daysOfWeek: initialData.daysOfWeek || [],
      });
    }
  }, [initialDataKey, reset, mode]);

  // Update plan when plans load
  useEffect(() => {
    if (!selectedPlan && (planName || activePlanName || availablePlans[0])) {
      setValue('plan', planName || activePlanName || availablePlans[0] || '');
    }
  }, [activePlanName, availablePlans, planName, selectedPlan, setValue]);

  const handleFormSubmit = (data: WorkoutFormData) => {
    onSubmit?.({
      plan: data.plan,
      name: data.name,
      description: data.description || '',
      daysOfWeek: data.daysOfWeek || [],
    });
  };

  return (
    <div>
      <div>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >

          <main className="relative z-10 max-w-md mx-auto px-4 py-8">
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
              {/* Plan - Static display if planName provided, dropdown otherwise */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Plan *
                </label>
                {planName ? (
                  // Static plan name display when coming from a specific plan
                  <div 
                    className="w-full px-5 py-4 rounded-2xl"
                    style={{ 
                      backgroundColor: '#e5e5e5',
                      color: '#6b7280'
                    }}
                  >
                    {planName}
                  </div>
                ) : (
                  // Dropdown for selecting plan when not pre-selected
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
                              className="absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-2xl overflow-hidden z-10"
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
                )}
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

              {/* Submit Button */}
              <LoadingButton
                type="submit"
                isLoading={isSubmitting || isLoading}
                loadingText="Saving..."
                disabled={ isSubmitting || isLoading}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed btn-primary`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Check size={20} />
                  {mode === 'create' ? 'CREATE WORKOUT' : 'SAVE CHANGES'}
                </span>
              </LoadingButton>
            </form>
          </main>
        </div>
      </div>
      
    </div>
  );
}
