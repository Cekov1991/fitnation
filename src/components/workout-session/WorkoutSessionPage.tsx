import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IonPage, IonContent } from '@ionic/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSimpleTransition } from '../../utils/animations';
import { Plus, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession, useLogSet, useUpdateSet, useCompleteSession, useDeleteSet, useAddSessionExercise, useRemoveSessionExercise, useUpdateSessionExercise } from '../../hooks/useApi';
import { exercisesApi } from '../../services/api';
import { ExercisePickerPage } from '../ExercisePickerPage';
import { BackgroundGradients } from '../BackgroundGradients';
import { WorkoutHeader } from './WorkoutHeader';
import { ExerciseNavTabs } from './ExerciseNavTabs';
import { CurrentExerciseCard } from './CurrentExerciseCard';
import { MaxWeightChart } from './MaxWeightChart';
import { SetLogCard } from './SetLogCard';
import { SetEditCard } from './SetEditCard';
import { SetsList } from './SetsList';
import { WorkoutOptionsMenu } from './WorkoutOptionsMenu';
import { ExerciseOptionsMenu } from './ExerciseOptionsMenu';
import { SetOptionsMenu } from './SetOptionsMenu';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { mapSessionToExercises, getExerciseCompletionStatus } from './utils';
import type { Exercise, Set } from './types';

interface WorkoutSessionPageProps {
  sessionId: number;
  workoutName: string;
  onBack: () => void;
  onFinish: () => void;
  onViewExerciseDetail: (exerciseName: string) => void;
}

export function WorkoutSessionPage({
  sessionId,
  workoutName,
  onBack,
  onFinish,
  onViewExerciseDetail
}: WorkoutSessionPageProps) {
  const { data: sessionData, isLoading } = useSession(sessionId);
  const queryClient = useQueryClient();
  const logSet = useLogSet();
  const updateSet = useUpdateSet();
  const completeSession = useCompleteSession();
  const deleteSet = useDeleteSet();
  const addSessionExercise = useAddSessionExercise();
  const removeSessionExercise = useRemoveSessionExercise();
  const updateSessionExercise = useUpdateSessionExercise();

  const exercises = useMemo<Exercise[]>(() => mapSessionToExercises(sessionData), [sessionData]);
  const { formattedDuration } = useWorkoutTimer(sessionData?.session?.performed_at);
  const shouldReduceMotion = useReducedMotion();
  const simpleTransition = useSimpleTransition();

  // Prefetch exercise history for all exercises when session loads
  useEffect(() => {
    if (exercises.length > 0) {
      exercises.forEach((exercise) => {
        if (exercise.exerciseId) {
          queryClient.prefetchQuery({
            queryKey: ['exercises', exercise.exerciseId, 'history', { limit: 10 }],
            queryFn: async () => {
              const response = await exercisesApi.getExerciseHistory(exercise.exerciseId, { limit: 10 });
              return response.data;
            },
          });
        }
      });
    }
  }, [exercises, queryClient]);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [editingWeight, setEditingWeight] = useState<number | null>(null);
  const [editingReps, setEditingReps] = useState<number | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [showWorkoutOptionsMenu, setShowWorkoutOptionsMenu] = useState(false);
  const [showExerciseMenu, setShowExerciseMenu] = useState(false);
  const [showSetMenu, setShowSetMenu] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exercisePickerMode, setExercisePickerMode] = useState<'add' | 'swap'>('add');
  
  const currentExercise = exercises[currentExerciseIndex];
  const currentSet = currentExercise?.sets.find(s => !s.completed);
  const completedSetsCount = currentExercise?.sets.filter(s => s.completed).length || 0;
  const selectedSet = selectedSetId
    ? currentExercise?.sets.find(s => s.id === selectedSetId)
    : null;

  // Initialize editing values when current set changes
  useEffect(() => {
    if (currentSet && !editingSetId) {
      setEditingWeight(currentSet.weight);
      setEditingReps(currentSet.reps);
    }
  }, [currentSet?.id, editingSetId, currentSet]);

  const handleDidIt = async () => {
    if (currentSet && editingWeight !== null && editingReps !== null && currentExercise) {
      const setNumber = currentExercise.sets.findIndex(s => s.id === currentSet.id) + 1;
      try {
        await logSet.mutateAsync({
          sessionId,
          data: {
            exercise_id: currentExercise.exerciseId,
            set_number: setNumber,
            weight: editingWeight,
            reps: editingReps
          }
        });
        // Auto-advance to next exercise if all sets completed
        if (completedSetsCount + 1 === currentExercise.sets.length) {
          if (currentExerciseIndex < exercises.length - 1) {
            setTimeout(() => setCurrentExerciseIndex(currentExerciseIndex + 1), 500);
          }
        }
      } catch (error) {
        console.error('Failed to log set:', error);
      }
    }
  };

  const handleEditSet = (set: Set) => {
    setEditingSetId(set.id);
    setEditingWeight(set.weight);
    setEditingReps(set.reps);
  };

  const handleSaveEdit = async () => {
    if (editingSetId && editingWeight !== null && editingReps !== null && currentExercise) {
      const set = currentExercise.sets.find(s => s.id === editingSetId);
      if (set?.setLogId) {
        try {
          await updateSet.mutateAsync({
            sessionId,
            setLogId: set.setLogId,
            data: {
              weight: editingWeight,
              reps: editingReps
            }
          });
          setEditingSetId(null);
        } catch (error) {
          console.error('Failed to update set:', error);
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingSetId(null);
    if (currentSet) {
      setEditingWeight(currentSet.weight);
      setEditingReps(currentSet.reps);
    }
  };

  const handleSwitchExercise = (index: number) => {
    setCurrentExerciseIndex(index);
    setEditingSetId(null);
  };

  const handleFinish = async () => {
    try {
      await completeSession.mutateAsync({
        sessionId,
        notes: undefined
      });
      onFinish();
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleAddSet = async () => {
    if (!currentExercise) return;
    try {
      await updateSessionExercise.mutateAsync({
        sessionId,
        exerciseId: currentExercise.sessionExerciseId,
        data: { target_sets: currentExercise.targetSets + 1 }
      });
    } catch (error) {
      console.error('Failed to add set:', error);
    }
  };

  const handleRemoveSet = async (setId: string) => {
    if (!currentExercise) return;
    
    const set = currentExercise.sets.find(s => s.id === setId);
    if (!set) return;

    // Check if it's the last set
    if (currentExercise.sets.length <= 1) {
      alert('Cannot remove the last set. Remove the exercise instead.');
      return;
    }

    try {
      if (set.completed && set.setLogId) {
        // Remove logged set
        await deleteSet.mutateAsync({
          sessionId,
          setLogId: set.setLogId
        });
      } else {
        // Remove unlogged set by decreasing target_sets
        await updateSessionExercise.mutateAsync({
          sessionId,
          exerciseId: currentExercise.sessionExerciseId,
          data: { target_sets: currentExercise.targetSets - 1 }
        });
      }
      setShowSetMenu(false);
      setSelectedSetId(null);
    } catch (error) {
      console.error('Failed to remove set:', error);
    }
  };

  const handleOpenSetMenu = (setId: string) => {
    setSelectedSetId(setId);
    setShowSetMenu(true);
  };

  const handleEditSetFromMenu = () => {
    if (selectedSetId && currentExercise) {
      const set = currentExercise.sets.find(s => s.id === selectedSetId);
      if (set) {
        setEditingSetId(set.id);
        setEditingWeight(set.weight);
        setEditingReps(set.reps);
      }
    }
    setShowSetMenu(false);
    setSelectedSetId(null);
  };

  const handleRemoveSetFromMenu = () => {
    if (selectedSetId) {
      handleRemoveSet(selectedSetId);
    }
  };

  const handleAddExercise = () => {
    setShowWorkoutOptionsMenu(false);
    setExercisePickerMode('add');
    setShowExercisePicker(true);
  };

  const handleSelectExercise = async (exercise: { id: number; name: string; restTime: string; muscleGroups: string[]; imageUrl: string }) => {
    if (exercisePickerMode === 'add') {
      try {
        await addSessionExercise.mutateAsync({
          sessionId,
          data: {
            exercise_id: exercise.id,
            target_sets: 3,
            target_reps: 10,
            target_weight: 0
          }
        });
        setShowExercisePicker(false);
      } catch (error) {
        console.error('Failed to add exercise:', error);
      }
    } else if (exercisePickerMode === 'swap') {
      // Remove current exercise first, then add new one
      if (currentExercise) {
        try {
          await removeSessionExercise.mutateAsync({
            sessionId,
            exerciseId: currentExercise.sessionExerciseId
          });
          // Add new exercise
          await addSessionExercise.mutateAsync({
            sessionId,
            data: {
              exercise_id: exercise.id,
              target_sets: currentExercise.targetSets,
              target_reps: parseInt(currentExercise.targetReps) || 10,
              target_weight: currentExercise.suggestedWeight
            }
          });
          setShowExercisePicker(false);
          setShowExerciseMenu(false);
          // Adjust index if needed
          if (currentExerciseIndex >= exercises.length - 1 && exercises.length > 1) {
            setCurrentExerciseIndex(exercises.length - 2);
          }
        } catch (error) {
          console.error('Failed to swap exercise:', error);
        }
      }
    }
  };

  const handleRemoveExercise = async () => {
    if (!currentExercise) return;
    
    if (exercises.length <= 1) {
      alert('Cannot remove the last exercise.');
      return;
    }

    try {
      await removeSessionExercise.mutateAsync({
        sessionId,
        exerciseId: currentExercise.sessionExerciseId
      });
      setShowExerciseMenu(false);
      
      // Adjust current exercise index
      const newExercises = exercises.filter(ex => ex.id !== currentExercise.id);
      if (currentExerciseIndex >= newExercises.length) {
        setCurrentExerciseIndex(newExercises.length - 1);
      }
    } catch (error) {
      console.error('Failed to remove exercise:', error);
    }
  };

  const handleSwapExercise = () => {
    setShowExerciseMenu(false);
    setExercisePickerMode('swap');
    setShowExercisePicker(true);
  };

  const handleViewExercise = () => {
    setShowExerciseMenu(false);
    onViewExerciseDetail(currentExercise.name);
  };

  const handleFinishWorkout = () => {
    setShowWorkoutOptionsMenu(false);
    handleFinish();
  };

  const allExercisesCompleted = exercises.every(ex => ex.sets.every(s => s.completed));
  
  if (isLoading) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading session...</div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
          <BackgroundGradients />

          <main className="relative z-10 max-w-md mx-auto">
            <WorkoutHeader
              formattedDuration={formattedDuration}
              onExit={onBack}
              onOpenOptions={() => setShowWorkoutOptionsMenu(true)}
            />

            <ExerciseNavTabs
              exercises={exercises}
              currentIndex={currentExerciseIndex}
              onSelectExercise={handleSwitchExercise}
              getCompletionStatus={getExerciseCompletionStatus}
            />

            {/* Exercise Content */}
            <div className="px-6 pb-40">
              {exercises.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20">
                  <div 
                    className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
                    style={{ 
                      background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 20%, transparent), color-mix(in srgb, var(--color-secondary) 20%, transparent))' 
                    }}
                  >
                    <Plus className="w-12 h-12" strokeWidth={2} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-center" style={{ color: 'var(--color-text-primary)' }}>
                    No Exercises Yet
                  </h2>
                  <p className="text-center mb-8 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Start your workout by adding exercises. Tap the Options button above to get started.
                  </p>
                  <button
                    onClick={() => setShowWorkoutOptionsMenu(true)}
                    className="px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-lg"
                    style={{
                      background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                      boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 20%, transparent)'
                    }}
                  >
                    Add Exercise
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentExercise.id} 
                    initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
                    transition={simpleTransition}
                    className="space-y-6"
                  >
                    <CurrentExerciseCard
                      exercise={currentExercise}
                      onOpenMenu={() => setShowExerciseMenu(true)}
                    />

                    <MaxWeightChart exercise={currentExercise} />

                    {/* Set Log Card - Only show if not editing a completed set */}
                    {currentSet && editingWeight !== null && editingReps !== null && !editingSetId && (
                      <SetLogCard
                        weight={editingWeight}
                        reps={editingReps}
                        onWeightChange={setEditingWeight}
                        onRepsChange={setEditingReps}
                        onLogSet={handleDidIt}
                      />
                    )}

                    {/* Edit Set Card - Show when editing a completed set */}
                    {editingSetId && editingWeight !== null && editingReps !== null && (
                      <SetEditCard
                        weight={editingWeight}
                        reps={editingReps}
                        onWeightChange={setEditingWeight}
                        onRepsChange={setEditingReps}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                      />
                    )}

                    <SetsList
                      sets={currentExercise.sets}
                      editingSetId={editingSetId}
                      onOpenSetMenu={handleOpenSetMenu}
                      onAddSet={handleAddSet}
                    />
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </main>

          {/* Finish Workout Button - Fixed above bottom nav */}
          {allExercisesCompleted && (
            <div className="fixed bottom-28 left-0 right-0 px-6 max-w-md mx-auto z-20">
              <button 
                onClick={handleFinish} 
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl font-bold text-lg shadow-2xl shadow-green-500/30 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Check className="w-6 h-6" />
                  FINISH WORKOUT
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          )}

          {/* Menus */}
          <WorkoutOptionsMenu
            isOpen={showWorkoutOptionsMenu}
            onClose={() => setShowWorkoutOptionsMenu(false)}
            onAddExercise={handleAddExercise}
            onFinishWorkout={handleFinishWorkout}
          />

          <ExerciseOptionsMenu
            isOpen={showExerciseMenu}
            onClose={() => setShowExerciseMenu(false)}
            onViewExercise={handleViewExercise}
            onSwapExercise={handleSwapExercise}
            onRemoveExercise={handleRemoveExercise}
          />

          <SetOptionsMenu
            isOpen={showSetMenu}
            selectedSet={selectedSet}
            onClose={() => {
              setShowSetMenu(false);
              setSelectedSetId(null);
            }}
            onEditSet={handleEditSetFromMenu}
            onRemoveSet={handleRemoveSetFromMenu}
          />

          {/* Exercise Picker */}
          {showExercisePicker && (
            <ExercisePickerPage
              mode={exercisePickerMode}
              onClose={() => setShowExercisePicker(false)}
              onSelectExercise={handleSelectExercise}
            />
          )}

          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
