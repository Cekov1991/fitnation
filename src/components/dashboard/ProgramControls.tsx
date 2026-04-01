import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, RefreshCw } from 'lucide-react';
import { useProfile, useRegeneratePlan, useUpdateProfile } from '../../hooks/useApi';
import type { FitnessGoal, ProgramResource, TrainingExperience, UpdateProfileInput } from '../../types/api';
import { ConfirmDialog, PlanGeneratingOverlay } from '../ui';

const DURATION_OPTIONS = [
  { label: '20-30 min', value: 30 },
  { label: '30-45 min', value: 45 },
  { label: '45-60 min', value: 60 },
  { label: '60-90 min', value: 90 },
  { label: '90+ min', value: 120 },
];

const GOAL_OPTIONS: Array<{ value: FitnessGoal; label: string }> = [
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'strength', label: 'Strength' },
  { value: 'general_fitness', label: 'General Fitness' },
];

const EXPERIENCE_OPTIONS: Array<{ value: TrainingExperience; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const MIN_LOADING_DELAY_MS = 1200;

interface ProgramControlsProps {
  activeProgram: ProgramResource | null;
}

interface ProfileControlsState {
  fitness_goal: FitnessGoal | '';
  training_experience: TrainingExperience | '';
  training_days_per_week: number | '';
  workout_duration_minutes: number | '';
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function ProgramControls({ activeProgram }: ProgramControlsProps) {
  const history = useHistory();
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();
  const updateProfile = useUpdateProfile();
  const regeneratePlan = useRegeneratePlan();
  const pendingActionRef = useRef<null | (() => Promise<void>)>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const profile = profileData?.profile ?? null;
  const [values, setValues] = useState<ProfileControlsState>({
    fitness_goal: '',
    training_experience: '',
    training_days_per_week: '',
    workout_duration_minutes: '',
  });

  useEffect(() => {
    if (!profile) return;
    setValues({
      fitness_goal: profile.fitness_goal ?? '',
      training_experience: profile.training_experience ?? '',
      training_days_per_week: profile.training_days_per_week ?? '',
      workout_duration_minutes: profile.workout_duration_minutes ?? '',
    });
  }, [profile]);

  const hasCompletedWorkouts = (activeProgram?.progress_percentage ?? 0) > 0;

  const isProfileComplete = useMemo(() => {
    return Boolean(
      values.fitness_goal &&
      values.training_experience &&
      values.training_days_per_week &&
      values.workout_duration_minutes
    );
  }, [values]);

  const isBusy = isRegenerating || updateProfile.isPending || regeneratePlan.isPending;

  const withWarningIfNeeded = async (action: () => Promise<void>) => {
    if (!hasCompletedWorkouts) {
      await action();
      return;
    }
    pendingActionRef.current = action;
    setShowWarning(true);
  };

  const executeRegenerate = async () => {
    setIsRegenerating(true);
    const delayPromise = sleep(MIN_LOADING_DELAY_MS);
    try {
      await regeneratePlan.mutateAsync();
      // Refetch the new plan data before hiding the overlay so the UI is
      // already updated when the loading screen fades out.
      await queryClient.refetchQueries({ queryKey: ['programs'] });
      await delayPromise;
    } catch (error) {
      await delayPromise;
      throw error;
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRefreshClick = async () => {
    if (isBusy || !isProfileComplete) return;
    try {
      await withWarningIfNeeded(async () => {
        await executeRegenerate();
      });
    } catch (error) {
      console.error('Failed to regenerate plan:', error);
    }
  };

  const handleProfileChange = async (
    key: keyof ProfileControlsState,
    value: FitnessGoal | TrainingExperience | number | ''
  ) => {
    if (isBusy) return;
    const nextValues = { ...values, [key]: value } as ProfileControlsState;
    setValues(nextValues);

    const updatePayload: UpdateProfileInput = {
      fitness_goal: nextValues.fitness_goal || undefined,
      training_experience: nextValues.training_experience || undefined,
      training_days_per_week: nextValues.training_days_per_week || undefined,
      workout_duration_minutes: nextValues.workout_duration_minutes || undefined,
    };

    try {
      await updateProfile.mutateAsync(updatePayload);
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (profile) {
        setValues({
          fitness_goal: profile.fitness_goal ?? '',
          training_experience: profile.training_experience ?? '',
          training_days_per_week: profile.training_days_per_week ?? '',
          workout_duration_minutes: profile.workout_duration_minutes ?? '',
        });
      }
    }
  };

  const handleWarningConfirm = async () => {
    if (!pendingActionRef.current) return;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setShowWarning(false);
    try {
      await action();
    } catch (error) {
      console.error('Regenerate flow failed:', error);
    }
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {activeProgram?.is_active && (
          <button
            onClick={() => history.push(`/programs/${activeProgram.id}`, { from: '/dashboard?type=programs' })}
            disabled={isBusy}
            className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <Calendar size={15} />
            
          </button>
        )}

        <select
          value={values.fitness_goal}
          onChange={(e) => handleProfileChange('fitness_goal', e.target.value as FitnessGoal)}
          disabled={isBusy}
          className="flex-shrink-0 min-w-[130px] px-3 py-2 rounded-xl text-sm font-semibold border"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <option value="" disabled>Goal</option>
          {GOAL_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          value={values.training_experience}
          onChange={(e) => handleProfileChange('training_experience', e.target.value as TrainingExperience)}
          disabled={isBusy}
          className="flex-shrink-0 min-w-[130px] px-3 py-2 rounded-xl text-sm font-semibold border"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <option value="" disabled>Experience</option>
          {EXPERIENCE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          value={values.training_days_per_week}
          onChange={(e) => handleProfileChange('training_days_per_week', Number(e.target.value))}
          disabled={isBusy}
          className="flex-shrink-0 min-w-[110px] px-3 py-2 rounded-xl text-sm font-semibold border"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <option value="" disabled>Days/week</option>
          {[1, 2, 3, 4, 5, 6, 7].map(days => (
            <option key={days} value={days}>{days} day{days > 1 ? 's' : ''}</option>
          ))}
        </select>

        <select
          value={values.workout_duration_minutes}
          onChange={(e) => handleProfileChange('workout_duration_minutes', Number(e.target.value))}
          disabled={isBusy}
          className="flex-shrink-0 min-w-[120px] px-3 py-2 rounded-xl text-sm font-semibold border"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <option value="" disabled>Duration</option>
          {DURATION_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <button
          onClick={handleRefreshClick}
          disabled={isBusy || !isProfileComplete}
          className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <RefreshCw size={15} className={isBusy ? 'animate-spin' : ''} />
          Refresh Program
        </button>
      </div>

      {isRegenerating && <PlanGeneratingOverlay partnerName={profileData?.partner?.name} fullscreen />}

      <ConfirmDialog
        isOpen={showWarning}
        onClose={() => {
          setShowWarning(false);
          pendingActionRef.current = null;
        }}
        onConfirm={handleWarningConfirm}
        title="Refresh personalized plan?"
        message="Your current personalized plan has completed workouts. Refreshing will create a new plan and you will start from scratch."
        confirmText="Refresh Plan"
        variant="warning"
        isLoading={isBusy}
      />
    </>
  );
}
