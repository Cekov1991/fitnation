import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check } from 'lucide-react';
import { LoadingButton } from './ui';
import { planSchema, PlanFormData } from '../schemas/plan';

interface CreatePlanPageProps {
  mode?: 'create' | 'edit';
  initialData?: {
    name: string;
    description: string;
    isActive: boolean;
  };
  onBack: () => void;
  onSubmit?: (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => void;
  isLoading?: boolean;
}

export function CreatePlanPage({
  mode = 'create',
  initialData,
  onBack,
  onSubmit,
  isLoading = false
}: CreatePlanPageProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      is_active: initialData?.isActive || false,
    },
    mode: 'onChange',
  });

  const isActive = watch('is_active');

  const handleFormSubmit = (data: PlanFormData) => {
    onSubmit?.({
      name: data.name,
      description: data.description || '',
      isActive: data.is_active,
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
                className="p-2 rounded-full"
                style={{ backgroundColor: 'var(--color-bg-elevated)' }}
              >
                <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <h1 
                className="text-3xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
              >
                {mode === 'create' ? 'Create Plan' : 'Edit Plan'}
              </h1>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)}>
              {/* Plan Name Input */}
              <div className="mb-6">
                <label htmlFor="plan-name" className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Plan Name *
                </label>
                <input 
                  id="plan-name" 
                  type="text" 
                  {...register('name')}
                  placeholder="e.g., Bulking Plan" 
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

              {/* Active Plan Toggle */}
              <div className="mb-8">
                <div 
                  className="border rounded-2xl p-5"
                  style={{ 
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      Active Plan
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setValue('is_active', !isActive)} 
                      className="relative w-14 h-8 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: isActive ? '#22c55e' : 'var(--color-bg-elevated)' }}
                    >
                      <div 
                        className="absolute top-1 w-6 h-6 rounded-full shadow-lg transition-transform duration-200"
                        style={{ 
                          backgroundColor: 'var(--color-text-primary)',
                          transform: isActive ? 'translateX(24px)' : 'translateX(2px)'
                        }}
                      />
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    Active plans are highlighted and used as the default when
                    creating workouts.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <LoadingButton
                type="submit"
                isLoading={isSubmitting || isLoading}
                loadingText="Saving..."
                disabled={isSubmitting || isLoading}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed btn-primary`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Check size={20} />
                  {mode === 'create' ? 'CREATE PLAN' : 'SAVE CHANGES'}
                </span>
              </LoadingButton>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
