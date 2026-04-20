import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Target, TrendingDown, Dumbbell, HeartPulse } from 'lucide-react';
import { Control, Controller } from 'react-hook-form';
import { useSlideTransition } from '../../utils/animations';
import { OnboardingFormData } from '../../schemas/onboarding';

interface FitnessGoalsStepProps {
  control: Control<OnboardingFormData>;
  selectedGoal: string | undefined;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export function FitnessGoalsStep({
  control,
  selectedGoal,
  onNext,
  onBack,
  isValid,
}: FitnessGoalsStepProps) {
  const slideProps = useSlideTransition('up');

  const goals = [
    {
      id: 'general_fitness',
      label: 'General Fitness',
      icon: HeartPulse,
      desc: 'Stay healthy and active',
    },
    {
      id: 'fat_loss',
      label: 'Fat Loss',
      icon: TrendingDown,
      desc: 'Burn fat and lose weight',
    },
    {
      id: 'muscle_gain',
      label: 'Muscle Gain',
      icon: Dumbbell,
      desc: 'Build strength and mass',
    },
    {
      id: 'strength',
      label: 'Strength',
      icon: Target,
      desc: 'Increase overall strength',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <motion.div {...slideProps} className="mb-6">
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          What's your main goal?
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Select the primary reason you want to train.
        </p>
      </motion.div>

      <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-4">
        <div className="space-y-3">
          <Controller
            name="fitness_goal"
            control={control}
            render={({ field }) => (
              <>
                {goals.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = field.value === goal.id;
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => field.onChange(goal.id)}
                      className="w-full flex items-center p-4 rounded-xl border-2 transition-all duration-200 text-left group"
                      style={{
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor: isSelected 
                          ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                          : 'var(--color-bg-surface)',
                      }}
                    >
                      <div
                        className="p-3 rounded-full mr-4 transition-colors"
                        style={{
                          backgroundColor: isSelected 
                            ? 'var(--color-primary)' 
                            : 'var(--color-border)',
                          color: isSelected ? 'white' : 'var(--color-text-muted)',
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 
                          className="font-semibold"
                          style={{ 
                            color: isSelected 
                              ? 'var(--color-text-primary)' 
                              : 'var(--color-text-primary)' 
                          }}
                        >
                          {goal.label}
                        </h3>
                        <p 
                          className="text-sm"
                          style={{ 
                            color: isSelected 
                              ? 'var(--color-text-secondary)' 
                              : 'var(--color-text-secondary)' 
                          }}
                        >
                          {goal.desc}
                        </p>
                      </div>
                      <div
                        className="ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: isSelected 
                            ? 'var(--color-primary)' 
                            : 'var(--color-border)',
                        }}
                      >
                        {isSelected && (
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          />
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
            Continue
            <ArrowRight className="ml-2 w-5 h-5" />
          </span>
        </button>
      </div>
    </div>
  );
}
