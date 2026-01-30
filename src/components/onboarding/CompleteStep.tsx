import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useSlideTransition } from '../../utils/animations';
import { OnboardingFormData } from '../../schemas/onboarding';
import { useUpdateProfile } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';

interface CompleteStepProps {
  formData: OnboardingFormData;
}

export function CompleteStep({ formData }: CompleteStepProps) {
  const { user } = useAuth();
  const history = useHistory();
  const slideProps = useSlideTransition('up');
  const updateProfile = useUpdateProfile();
  const [isSaving, setIsSaving] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
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

  const saveProfile = async () => {
    setIsSaving(true);
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

      // Mark as saved and stop loading - show success screen
      setIsSaved(true);
      setIsSaving(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save your profile. Please try again.');
      setIsSaving(false);
    }
  };

  // Auto-save on mount
  useEffect(() => {
    saveProfile();
  }, []);

  const handleGoToDashboard = () => {
    history.push('/');
  };

  return (
    <div className="flex flex-col h-full justify-center items-center text-center py-6">
      {isSaving ? (
        <motion.div {...slideProps} className="flex flex-col items-center gap-4">
          <Loader2 
            className="w-12 h-12 animate-spin" 
            style={{ color: 'var(--color-primary)' }} 
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Setting up your profile...
          </p>
        </motion.div>
      ) : error ? (
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
            onClick={saveProfile}
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
      ) : isSaved ? (
        <>
          <motion.div
            {...slideProps}
            transition={{ ...slideProps.transition, delay: 0 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: 'color-mix(in srgb, #10b981 10%, transparent)' }}
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>

          <motion.div
            {...slideProps}
            transition={{ ...slideProps.transition, delay: 0.1 }}
            className="space-y-2 mb-8"
          >
            <h2 
              className="text-3xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              You're All Set!
            </h2>
            <p 
              className="max-w-xs mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Thanks {user?.name?.split(' ')[0]}! We've created a personalized
              plan based on your goals.
            </p>
          </motion.div>

          <motion.div
            {...slideProps}
            transition={{ ...slideProps.transition, delay: 0.2 }}
            className="w-full p-6 rounded-2xl shadow-sm border mb-8 text-left"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <h3 
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Your Profile Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Goal</span>
                <span 
                  className="font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {goalLabels[formData.fitness_goal]}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Experience</span>
                <span 
                  className="font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {experienceLabels[formData.training_experience]}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Schedule</span>
                <span 
                  className="font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {formData.training_days_per_week} days/week
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...slideProps}
            transition={{ ...slideProps.transition, delay: 0.3 }}
            className="w-full mt-auto"
          >
            <button
              onClick={handleGoToDashboard}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
              style={{
                background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
                color: 'white',
              }}
            >
              <span className="flex items-center justify-center">
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </span>
            </button>
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
