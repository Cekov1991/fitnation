import React, { useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { WorkoutTemplateSelector } from './WorkoutTemplateSelector';
import { WorkoutCard } from '../WorkoutCard';
import { usePrograms, useStartSession, useTodayWorkout } from '../../hooks/useApi';
import type { ProgramResource, WorkoutTemplateResource } from '../../types/api';

interface ProgramDashboardProps {
  onStartWorkout: () => void;
}

export function ProgramDashboard({ onStartWorkout }: ProgramDashboardProps) {
  const history = useHistory();
  const { data: programs = [], isLoading: isProgramsLoading } = usePrograms();
  const startSession = useStartSession();
  const { data: todayWorkout } = useTodayWorkout();

  // Get active program
  const activeProgram = useMemo(() => {
    return programs.find((program: ProgramResource) => program.is_active) || null;
  }, [programs]);

  // Get workout templates for the current active week
  const activeWeekWorkouts = useMemo(() => {
    if (!activeProgram?.workout_templates) return [];
    
    const currentWeek = activeProgram.current_active_week ?? 1;
    
    // Filter templates for current week and sort by order_index
    return activeProgram.workout_templates
      .filter((template: WorkoutTemplateResource) => template.week_number === currentWeek)
      .sort((a: WorkoutTemplateResource, b: WorkoutTemplateResource) => a.order_index - b.order_index);
  }, [activeProgram]);

  // Default to first workout in active week, or next_workout if available
  const defaultSelectedId = useMemo(() => {
    if (activeProgram?.next_workout && activeWeekWorkouts.some((w: WorkoutTemplateResource) => w.id === activeProgram.next_workout?.id)) {
      return activeProgram.next_workout.id;
    }
    return activeWeekWorkouts.length > 0 ? activeWeekWorkouts[0].id : null;
  }, [activeProgram, activeWeekWorkouts]);

  // Use lazy initializer to ensure we get the latest defaultSelectedId on mount
  // The key prop on this component ensures remount when program/week changes
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(() => defaultSelectedId);

  // Get selected workout template
  const selectedWorkout = useMemo(() => {
    if (!selectedTemplateId) return null;
    return activeWeekWorkouts.find((w: WorkoutTemplateResource) => w.id === selectedTemplateId) || null;
  }, [activeWeekWorkouts, selectedTemplateId]);

  // Use selected workout for display
  const displayWorkout = selectedWorkout;

  // Get week info from active program
  const weekInfo = useMemo(() => {
    if (!activeProgram) return null;
    
    const currentWeek = activeProgram.current_active_week ?? 1;
    const totalWeeks = activeProgram.duration_weeks ?? 1;
    
    return {
      current: currentWeek,
      total: totalWeeks
    };
  }, [activeProgram]);

  const handleExerciseClick = (exerciseName: string) => {
    history.push(`/exercises/${encodeURIComponent(exerciseName)}`);
  };

  const handleEditWorkout = (templateId: number) => {
    history.push(`/workouts/${templateId}/exercises`, { returnPath: '/dashboard?type=programs' });
  };

  // Check if next_workout has an active session
  const nextWorkoutActiveSession = useMemo(() => {
    if (!activeProgram?.next_workout?.id || !todayWorkout?.session) return null;
    const session = todayWorkout.session;
    if (!session.completed_at && session.workout_template_id === activeProgram.next_workout.id) {
      return session;
    }
    return null;
  }, [activeProgram, todayWorkout]);

  const handleStartNextWorkout = async () => {
    // If there's an active session for next_workout, continue it
    if (nextWorkoutActiveSession?.id) {
      history.push(`/session/${nextWorkoutActiveSession.id}`);
      return;
    }

    if (!activeProgram?.next_workout?.id) {
      // Fallback to onStartWorkout if no next_workout
      onStartWorkout();
      return;
    }

    try {
      const response = await startSession.mutateAsync(activeProgram.next_workout.id);
      const session = response.data?.session || response.data;
      if (session?.id) {
        // Check if draft (performed_at is null)
        if (!session.performed_at) {
          // Navigate to preview page to continue setup
          history.push(`/generate-workout/preview/${session.id}`);
        } else {
          // Active session - continue workout
          history.push(`/session/${session.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to start next workout:', error);
    }
  };

  if (isProgramsLoading) {
    return (
      <div className="pb-32">
        <div className="flex flex-col items-center justify-center py-12">
          <div 
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!activeProgram) {
    return (
      <div className="pb-32">
        <div 
          className="text-center py-12 rounded-2xl"
          style={{ 
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <p className="mb-4">No active program</p>
          <button
            onClick={() => history.push('/plans?type=programs')}
            className="px-6 py-2 rounded-xl font-semibold"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-button)'
            }}
          >
            Browse Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Workout Template Selector - Shows workouts for active week */}
      {activeWeekWorkouts.length > 0 && (
        <div className="mb-6 -mx-1 px-1">
          <WorkoutTemplateSelector 
            templates={activeWeekWorkouts}
            selectedTemplateId={selectedTemplateId}
            onTemplateSelect={setSelectedTemplateId}
          />
        </div>
      )}

      {/* Week Indicator */}
      {weekInfo && (
        <div className="text-center mb-4">
          <p 
            className="font-semibold text-xs uppercase tracking-wider"
            style={{ color: 'var(--color-primary)' }}
          >
            Week {weekInfo.current}/{weekInfo.total}
            {activeProgram.name && ` - ${activeProgram.name}`}
          </p>
        </div>
      )}

      {/* Workout Card */}
      {displayWorkout ? (
        <div className="mb-6">
          <WorkoutCard
            template={displayWorkout}
            title={selectedWorkout?.name || "WORKOUT"}
            onStartNextWorkout={handleStartNextWorkout}
            showStartButton={true}
            startButtonText={
              nextWorkoutActiveSession 
                ? 'CONTINUE WORKOUT' 
                : activeProgram?.next_workout 
                  ? 'START WORKOUT' 
                  : 'NO WORKOUTS AVAILABLE'
            }
            startButtonDisabled={!activeProgram?.next_workout && !nextWorkoutActiveSession}
            onExerciseClick={handleExerciseClick}
            onEditWorkout={handleEditWorkout}
          />
        </div>
      ) : (
        <div 
          className="rounded-2xl p-6 mb-6 text-center"
          style={{ 
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <p>No workouts available for this week</p>
        </div>
      )}
    </div>
  );
}
