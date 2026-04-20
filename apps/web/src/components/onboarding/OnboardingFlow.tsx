import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { onboardingSchema, OnboardingFormData } from '../../schemas/onboarding';
import { useProfile } from '../../hooks/useApi';
import { WelcomeStep } from './WelcomeStep';
import { PersonalInfoStep } from './PersonalInfoStep';
import { FitnessGoalsStep } from './FitnessGoalsStep';
import { TrainingPreferencesStep } from './TrainingPreferencesStep';
import { CompleteStep } from './CompleteStep';

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  
  // Fetch existing profile data
  const { data: profile, isLoading: isLoadingProfile } = useProfile();

  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      age: null,
      gender: 'other',
      height: null,
      weight: null,
      fitness_goal: 'general_fitness',
      training_experience: 'beginner',
      training_days_per_week: 3,
      workout_duration_minutes: 45,
    },
  });

  // Populate form with existing profile data when loaded
  useEffect(() => {
    if (profile?.profile) {
      const existingProfile = profile.profile;
      reset({
        age: existingProfile.age ?? null,
        gender: existingProfile.gender ?? 'other',
        height: existingProfile.height ?? null,
        weight: existingProfile.weight ? Math.round(existingProfile.weight) : null,
        fitness_goal: existingProfile.fitness_goal ?? 'general_fitness',
        training_experience: existingProfile.training_experience ?? 'beginner',
        training_days_per_week: existingProfile.training_days_per_week ?? 3,
        workout_duration_minutes: existingProfile.workout_duration_minutes ?? 45,
      });
    }
  }, [profile, reset]);

  const formData = watch();
  const totalSteps = 5;

  const nextStep = async () => {
    let isStepValid = true;

    // Validate current step before proceeding
    if (step === 1) {
      isStepValid = await trigger(['age', 'gender', 'height', 'weight']);
    } else if (step === 2) {
      isStepValid = await trigger(['fitness_goal']);
    } else if (step === 3) {
      isStepValid = await trigger(['training_experience', 'training_days_per_week', 'workout_duration_minutes']);
    }

    if (isStepValid && step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    if (step === 0) return true;
    if (step === 1) {
      return formData.age !== null && formData.gender && formData.height !== null && formData.weight !== null;
    }
    if (step === 2) {
      return !!formData.fitness_goal;
    }
    if (step === 3) {
      return formData.training_experience && formData.training_days_per_week && formData.workout_duration_minutes;
    }
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeStep onNext={nextStep} />;
      case 1:
        return (
          <PersonalInfoStep
            register={register}
            errors={errors}
            control={control}
            onNext={nextStep}
            onBack={prevStep}
            isValid={isStepValid()}
          />
        );
      case 2:
        return (
          <FitnessGoalsStep
            control={control}
            selectedGoal={formData.fitness_goal}
            onNext={nextStep}
            onBack={prevStep}
            isValid={isStepValid()}
          />
        );
      case 3:
        return (
          <TrainingPreferencesStep
            control={control}
            selectedDays={formData.training_days_per_week}
            selectedDuration={formData.workout_duration_minutes}
            onNext={nextStep}
            onBack={prevStep}
            isValid={isStepValid()}
          />
        );
      case 4:
        return <CompleteStep formData={formData} />;
      default:
        return null;
    }
  };

  // Simple fade transition - no slide animations for iOS compatibility
  const variants = {
    enter: {
      opacity: 0,
    },
    center: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--color-bg-base)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 
            className="w-8 h-8 animate-spin" 
            style={{ color: 'var(--color-primary)' }} 
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'var(--color-bg-base)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div 
        className="w-full max-w-md rounded-3xl shadow-xl overflow-hidden h-[800px] max-h-[90vh] flex flex-col relative"
        style={{ backgroundColor: 'var(--color-bg-surface)' }}
      >
        {/* Progress Bar - Only show after welcome screen and before complete screen */}
        {step > 0 && step < totalSteps - 1 && (
          <div className="px-8 pt-8 pb-2">
            <div className="flex justify-between items-center mb-2">
              <span 
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Step {step} of {totalSteps - 2}
              </span>
              <span 
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {Math.round((step / (totalSteps - 2)) * 100)}%
              </span>
            </div>
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${(step / (totalSteps - 2)) * 100}%`,
                  backgroundColor: 'var(--color-primary)',
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-8 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: 'tween',
                duration: 0.15,
                ease: 'easeOut',
              }}
              className="h-full w-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
