import { motion } from 'framer-motion';
import { Dumbbell, Clock, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import { Control, Controller } from 'react-hook-form';
import { useSlideTransition } from '../../utils/animations';
import { OnboardingFormData } from '../../schemas/onboarding';

interface TrainingPreferencesStepProps {
  control: Control<OnboardingFormData>;
  selectedDays: number | undefined;
  selectedDuration: number | undefined;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export function TrainingPreferencesStep({
  control,
  onNext,
  onBack,
  isValid,
}: TrainingPreferencesStepProps) {
  const slideProps = useSlideTransition('up');

  return (
    <div className="flex flex-col h-full">
      <motion.div {...slideProps} className="mb-6">
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Training Preferences
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Help us design the perfect workout schedule for you.
        </p>
      </motion.div>

      <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-4">
        <div className="space-y-6">
          {/* Experience Level */}
          <div>
            <label 
              className="text-xs mb-2 block"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Experience Level
            </label>
            <div className="relative">
              <Dumbbell 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" 
                style={{ color: 'var(--color-text-muted)' }} 
              />
              <Controller
                name="training_experience"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full pl-12 pr-12 py-4 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                  >
                    <option value="beginner">Beginner (0-1 years)</option>
                    <option value="intermediate">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3+ years)</option>
                  </select>
                )}
              />
              <ChevronDown 
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
                style={{ color: 'var(--color-text-muted)' }} 
              />
            </div>
          </div>

          {/* Training Days Per Week */}
          <div className="space-y-4">
            <label 
              className="block text-xs font-medium ml-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Training Days Per Week
            </label>
            <Controller
              name="training_days_per_week"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => field.onChange(day)}
                      className="aspect-square rounded-xl flex items-center justify-center text-lg font-semibold transition-all"
                      style={{
                        backgroundColor: field.value === day 
                          ? 'var(--color-primary)' 
                          : 'var(--color-bg-surface)',
                        color: field.value === day 
                          ? 'white' 
                          : 'var(--color-text-secondary)',
                        border: `2px solid ${field.value === day 
                          ? 'var(--color-primary)' 
                          : 'var(--color-border)'}`,
                        transform: field.value === day ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            />
            <p 
              className="text-xs ml-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Select how many days you can commit to training.
            </p>
          </div>

          {/* Workout Duration */}
          <div className="space-y-4">
            <label 
              className="text-xs mb-2 block"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Workout Duration (minutes)
            </label>
            <div className="relative">
              <Clock 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                style={{ color: 'var(--color-text-muted)' }} 
              />
              <Controller
                name="workout_duration_minutes"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                    placeholder="e.g. 45"
                    min="15"
                    max="180"
                    className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                  />
                )}
              />
            </div>

            {/* Quick select buttons */}
            <Controller
              name="workout_duration_minutes"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {[30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => field.onChange(mins)}
                      className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all"
                      style={{
                        backgroundColor: field.value === mins
                          ? 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
                          : 'var(--color-border-subtle)',
                        color: field.value === mins
                          ? 'var(--color-primary)'
                          : 'var(--color-text-secondary)',
                      }}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 mt-auto flex gap-3">
        <button
          onClick={onBack}
          className="w-1/3 py-4 border-2 rounded-xl font-semibold transition-all"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            backgroundColor: 'transparent',
          }}
        >
          <ArrowLeft className="w-5 h-5 mx-auto" />
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-2/3 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
            color: 'white',
          }}
        >
          <span className="flex items-center justify-center">
            Finish Setup
            <ArrowRight className="ml-2 w-5 h-5" />
          </span>
        </button>
      </div>
    </div>
  );
}
