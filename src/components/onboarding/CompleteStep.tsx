import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useSlideTransition, useModalTransition } from '../../utils/animations';
import { OnboardingFormData } from '../../schemas/onboarding';
import { useUpdateProfile, useCompleteOnboarding } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useBranding } from '../../hooks/useBranding';

interface CompleteStepProps {
  formData: OnboardingFormData;
}

type Phase = 'saving-profile' | 'generating-plan' | 'plan-success' | 'error';

/** Minimum time (ms) to show the "generating plan" spinner, so it feels substantial */
const PLAN_GENERATION_MIN_DELAY_MS = 10_000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function CompleteStep({ formData }: CompleteStepProps) {
  const { user, refetchUser } = useAuth();
  const { partnerName } = useBranding();
  const history = useHistory();
  const slideProps = useSlideTransition('up');
  const updateProfile = useUpdateProfile();
  const completeOnboarding = useCompleteOnboarding();
  const [phase, setPhase] = useState<Phase>('saving-profile');
  const [error, setError] = useState<string | null>(null);

  const goalLabels: Record<string, string> = {
    fat_loss: 'Fat Loss',
    muscle_gain: 'Muscle Gain',
    strength: 'Strength',
    general_fitness: 'General Fitness',
  };

  const experienceLabels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  // Phase 1: Save profile
  const saveProfile = async () => {
    setPhase('saving-profile');
    setError(null);

    try {
      await updateProfile.mutateAsync({
        fitness_goal: formData.fitness_goal,
        age: formData.age ?? undefined,
        gender: formData.gender,
        height: formData.height ?? undefined,
        weight: formData.weight ?? undefined,
        training_experience: formData.training_experience,
        training_days_per_week: formData.training_days_per_week,
        workout_duration_minutes: formData.workout_duration_minutes,
      });

      // Move to phase 2: Generate plan
      setPhase('generating-plan');
      generatePlan();
    } catch (err: any) {
      setError(err.message || 'Failed to save your profile. Please try again.');
      setPhase('error');
    }
  };

  // Phase 2: Generate personalized plan
  const generatePlan = async () => {
    // Always wait at least PLAN_GENERATION_MIN_DELAY_MS so the spinner feels substantial
    const delayPromise = sleep(PLAN_GENERATION_MIN_DELAY_MS);

    try {
      await completeOnboarding.mutateAsync(undefined);
      // Wait for the minimum delay before showing the result
      await delayPromise;
      // DON'T refetchUser here — that would update onboarding_completed_at
      // and AuthGuard would immediately redirect away from /onboarding
      // Show success modal - user must click to continue
      setPhase('plan-success');
    } catch (err: any) {
      // Always wait for the minimum delay, even on errors
      await delayPromise;
      // Handle 409 Conflict (already completed) as success
      const errorMessage = err?.message || '';
      if (errorMessage.includes('already been completed') || errorMessage.includes('status: 409')) {
        setPhase('plan-success');
        return;
      }
      // Other errors
      setError(errorMessage || 'Failed to generate your personalized plan. Please try again.');
      setPhase('error');
    }
  };

  // Handle success modal dismissal — refetch user so AuthGuard redirects to dashboard
  const handleSuccessContinue = async () => {
    await refetchUser();
    history.push('/');
  };

  // Auto-start on mount
  useEffect(() => {
    saveProfile();
  }, []);

  const handleRetry = () => {
    if (phase === 'error') {
      // Retry from the beginning
      saveProfile();
    }
  };

  const modalTransition = useModalTransition();

  return (
    <>
      {/* Success Modal - appears after plan generation */}
      <AnimatePresence>
        {phase === 'plan-success' && (
          <>
            {/* Backdrop */}
            <motion.div
              {...modalTransition}
              className="fixed inset-0 bg-black/60"
              style={{ zIndex: 10000 }}
            />

            {/* Modal */}
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
                    style={{ backgroundColor: 'rgb(34 197 94 / 0.2)' }}
                  >
                    <CheckCircle
                      className="w-8 h-8"
                      style={{ color: '#4ade80' }}
                    />
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="text-xl font-bold text-center mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  You're All Set!
                </h3>

                {/* Message */}
                <p
                  className="text-center mb-4"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Congratulations {user?.name?.split(' ')[0]}! Your personalized plan is ready.
                </p>

                {/* Profile Summary */}
                <div
                  className="w-full p-4 rounded-xl border mb-5 text-left"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <h4
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Your Profile
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Goal</span>
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {goalLabels[formData.fitness_goal]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Experience</span>
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {experienceLabels[formData.training_experience]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Schedule</span>
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {formData.training_days_per_week} days/week
                      </span>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={handleSuccessContinue}
                  className="w-full py-3 px-4 rounded-xl font-bold text-lg transition-all shadow-lg"
                  style={{
                    background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                    color: 'white',
                  }}
                >
                  <span className="flex items-center justify-center">
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full justify-center items-center text-center py-6">
        {phase === 'saving-profile' ? (
        <motion.div {...slideProps} className="flex flex-col items-center gap-4">
          <Loader2 
            className="w-12 h-12 animate-spin" 
            style={{ color: 'var(--color-primary)' }} 
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Setting up your profile...
          </p>
        </motion.div>
      ) : phase === 'generating-plan' || phase === 'plan-success' ? (
        <motion.div {...slideProps} className="flex flex-col items-center gap-6 max-w-sm">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles 
              className="w-16 h-16" 
              style={{ color: 'var(--color-primary)' }} 
            />
          </motion.div>
          <div className="space-y-2">
            <h2 
              className="text-2xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Generating your personalized plan
            </h2>
            {partnerName && (
              <p 
                className="text-base"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Courtesy of <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{partnerName}</span>
              </p>
            )}
            <p 
              className="text-sm mt-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              This may take a moment...
            </p>
          </div>
        </motion.div>
      ) : phase === 'error' ? (
        <motion.div {...slideProps} className="w-full space-y-6">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6 mx-auto"
            style={{ backgroundColor: 'color-mix(in srgb, #ef4444 10%, transparent)' }}
          >
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          
          <div className="space-y-2 mb-8">
            <h2 
              className="text-3xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Oops! Something went wrong
            </h2>
            <p 
              className="max-w-xs mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {error}
            </p>
          </div>

          <button
            onClick={handleRetry}
            className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
            style={{
              background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
              color: 'white',
            }}
          >
            <span className="flex items-center justify-center">
              Try Again
              <ArrowRight className="ml-2 w-5 h-5" />
            </span>
          </button>
        </motion.div>
      ) : null}
      </div>
    </>
  );
}
