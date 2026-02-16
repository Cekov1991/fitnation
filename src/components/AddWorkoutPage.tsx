import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { LoadingButton } from './ui';
import { usePlans } from '../hooks/useApi';
import { DAYS_OF_WEEK } from '../constants';
import { workoutSchema, WorkoutFormData } from '../schemas/workout';
import type { PlanResource, WorkoutTemplateResource } from '../types/api';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
  templateId,
  initialData,
  onBack,
  onSubmit,
  onSwap,
  isLoading = false
}: AddWorkoutPageProps) {
  const { data: plans = [] } = usePlans();
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [clickedOccupiedDay, setClickedOccupiedDay] = useState<string | null>(null);
  const [swapConfirmation, setSwapConfirmation] = useState<{
    targetDay: string;
    existingWorkout: { name: string; id: number };
  } | null>(null);

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

  // Compute which days are already occupied by the selected plan's existing workouts
  // Map: day name -> { name: workout name, id: workout template id }
  const occupiedDays = useMemo(() => {
    const selectedPlanData = plans.find((p: PlanResource) => p.name === selectedPlan);
    if (!selectedPlanData?.workout_templates) return new Map<string, { name: string; id: number }>();
    
    const dayToWorkout = new Map<string, { name: string; id: number }>();
    selectedPlanData.workout_templates
      .filter((t: WorkoutTemplateResource) => t.day_of_week !== null)
      // In edit mode, exclude the current workout from occupied days
      .filter((t: WorkoutTemplateResource) => mode !== 'edit' || t.id !== templateId)
      .forEach((t: WorkoutTemplateResource) => {
        dayToWorkout.set(DAY_NAMES[t.day_of_week!], { name: t.name, id: t.id });
      });
    return dayToWorkout;
  }, [plans, selectedPlan, mode, templateId]);

  // Update plan when plans load
  useEffect(() => {
    if (!selectedPlan && (planName || activePlanName || availablePlans[0])) {
      setValue('plan', planName || activePlanName || availablePlans[0] || '');
    }
  }, [activePlanName, availablePlans, planName, selectedPlan, setValue]);

  const selectDay = (day: string) => {
    // Only allow single day selection
    const currentDay = selectedDays[0];
    if (currentDay === day) {
      setValue('daysOfWeek', []); // Deselect if clicking same day
      return;
    }
    
    // Check if day is occupied by another workout
    const existingWorkout = occupiedDays.get(day);
    if (existingWorkout && mode === 'edit') {
      // Show swap confirmation dialog
      setSwapConfirmation({ targetDay: day, existingWorkout });
      setClickedOccupiedDay(null);
    } else if (!existingWorkout) {
      setValue('daysOfWeek', [day]); // Select only this day
      setClickedOccupiedDay(null);
    }
  };
  
  const handleSwapConfirm = () => {
    if (!swapConfirmation || !onSwap) return;
    
    const currentDay = selectedDays[0] || '';
    onSwap({
      currentWorkoutDay: currentDay,
      targetDay: swapConfirmation.targetDay,
      targetWorkoutId: swapConfirmation.existingWorkout.id
    });
    
    // Update local state to show the new day
    setValue('daysOfWeek', [swapConfirmation.targetDay]);
    setSwapConfirmation(null);
  };
  
  const handleSwapCancel = () => {
    setSwapConfirmation(null);
  };

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

              {/* Day of Week - Single Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Day of Week
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDays.includes(day.full);
                    const isOccupied = occupiedDays.has(day.full);
                    // In edit mode, occupied days are clickable (for swap)
                    // In create mode, occupied days show error message
                    const canClick = mode === 'edit' || !isOccupied;
                    
                    return (
                      <button 
                        key={day.full} 
                        type="button" 
                        onClick={() => {
                          if (mode === 'edit') {
                            // In edit mode, always use selectDay (handles swap)
                            selectDay(day.full);
                          } else if (isOccupied) {
                            // In create mode, show error for occupied days
                            setClickedOccupiedDay(day.full);
                          } else {
                            setClickedOccupiedDay(null);
                            selectDay(day.full);
                          }
                        }} 
                        className={`relative aspect-square rounded-xl font-bold text-sm transition-all ${
                          isSelected ? 'text-white shadow-lg' : 'border'
                        } ${!canClick ? 'cursor-not-allowed' : ''}`}
                        style={
                          isSelected ? {
                            background: 'linear-gradient(to bottom right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
                            boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
                          } : isOccupied ? {
                            backgroundColor: 'var(--color-bg-elevated)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-muted)',
                            opacity: mode === 'edit' ? 0.7 : 0.4 // Slightly more visible in edit mode
                          } : {
                            backgroundColor: 'var(--color-bg-elevated)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-secondary)'
                          }
                        }
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
                {clickedOccupiedDay && occupiedDays.has(clickedOccupiedDay) && mode === 'create' && (
                  <p className="text-xs mt-3" style={{ color: '#f87171' }}>
                    {clickedOccupiedDay} is already assigned to "{occupiedDays.get(clickedOccupiedDay)?.name}"
                  </p>
                )}
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
      
      {/* Swap Confirmation Modal */}
      {swapConfirmation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleSwapCancel}
        >
          <div 
            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: 'var(--color-bg-modal)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 
              className="text-lg font-bold mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Swap Workouts?
            </h3>
            <p 
              className="text-sm mb-6"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <strong>{swapConfirmation.targetDay}</strong> is assigned to "{swapConfirmation.existingWorkout.name}".
              {selectedDays[0] ? (
                <> Swap with "{initialData?.name || 'this workout'}"?</>
              ) : (
                <> Move "{initialData?.name || 'this workout'}" to {swapConfirmation.targetDay} and unassign "{swapConfirmation.existingWorkout.name}"?</>
              )}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSwapCancel}
                className="flex-1 py-3 rounded-xl font-semibold border transition-colors"
                style={{ 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSwapConfirm}
                className="flex-1 py-3 rounded-xl font-semibold text-white transition-colors"
                style={{ 
                  background: 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))'
                }}
              >
                Swap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
