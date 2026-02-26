import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession, useLogSet, useUpdateSet, useCompleteSession, useCancelSession, useDeleteSet, useAddSessionExercise, useRemoveSessionExercise, useUpdateSessionExercise, useReorderSessionExercises } from '../../../hooks/useApi';
import { exercisesApi } from '../../../services/api';
import { useWorkoutTimer } from './useWorkoutTimer';
import { useExerciseNavigationState } from './useExerciseNavigationState';
import { mapSessionToExercises } from '../utils';
import type { Exercise, Set } from '../types';

interface UseWorkoutSessionStateProps {
  sessionId: number;
  onBack: () => void;
  onFinish: () => void;
  onViewExerciseDetail: (exerciseName: string) => void;
  initialExerciseName?: string | null;
}

interface UseWorkoutSessionStateReturn {
  // Core data
  exercises: Exercise[];
  currentExercise: Exercise | undefined;
  currentExerciseIndex: number;
  isLoading: boolean;
  formattedDuration: string;
  allExercisesCompleted: boolean;

  // Set logging
  currentSet: Set | undefined;
  completedSetsCount: number;
  editingWeight: number | null;
  editingReps: number | null;
  setEditingWeight: (w: number | null) => void;
  setEditingReps: (r: number | null) => void;
  handleDidIt: () => Promise<void>;
  handleStartTimer: () => void;

  // Set editing
  editingSetId: string | null;
  handleSaveEdit: () => Promise<void>;
  handleCancelEdit: () => void;

  // Exercise navigation
  handleSwitchExercise: (index: number) => void;

  // Set management
  handleAddSet: () => Promise<void>;
  handleOpenSetMenu: (setId: string) => void;
  handleEditSetFromMenu: () => void;
  handleRemoveSetFromMenu: () => void;

  // Exercise management
  handleAddExercise: () => void;
  handleSelectExercise: (exercise: { id: number; name: string; restTime: string; muscleGroups: string[]; imageUrl: string }) => Promise<void>;
  handleRemoveExercise: () => Promise<void>;
  handleSwapExercise: () => void;
  handleViewExercise: () => void;

  // Menus & dialogs state
  showExerciseMenu: boolean;
  setShowExerciseMenu: (v: boolean) => void;
  showSetMenu: boolean;
  setShowSetMenu: (v: boolean) => void;
  selectedSet: Set | null;
  selectedSetId: string | null;
  setSelectedSetId: (id: string | null) => void;
  isSelectedSetLast: boolean;
  showExercisePicker: boolean;
  setShowExercisePicker: (v: boolean) => void;
  exercisePickerMode: 'add' | 'swap';
  showCancelConfirm: boolean;
  setShowCancelConfirm: (v: boolean) => void;
  showFinishConfirm: boolean;
  setShowFinishConfirm: (v: boolean) => void;

  // Rest timer
  isRestTimerActive: boolean;
  restTimerSeconds: number | null;
  setIsRestTimerActive: (v: boolean) => void;

  // Session actions
  handleFinishWorkout: () => void;
  handleFinishWorkoutConfirm: () => Promise<void>;
  handleCancelWorkoutClick: () => void;
  handleCancelWorkoutConfirm: () => Promise<void>;
  showSummary: boolean;
  handleSummaryDismiss: () => void;

  // Loading states (for UI)
  isCancelLoading: boolean;
  isAddExerciseLoading: boolean;
  isRemoveExerciseLoading: boolean;
  isRemoveSetLoading: boolean;
  isCompleteLoading: boolean;
}

export function useWorkoutSessionState({
  sessionId,
  onBack,
  onFinish,
  onViewExerciseDetail,
  initialExerciseName
}: UseWorkoutSessionStateProps): UseWorkoutSessionStateReturn {
  const { data: sessionData, isLoading } = useSession(sessionId);
  const queryClient = useQueryClient();
  const logSet = useLogSet();
  const updateSet = useUpdateSet();
  const completeSession = useCompleteSession();
  const cancelSession = useCancelSession();
  const deleteSet = useDeleteSet();
  const addSessionExercise = useAddSessionExercise();
  const removeSessionExercise = useRemoveSessionExercise();
  const updateSessionExercise = useUpdateSessionExercise();
  const reorderSessionExercises = useReorderSessionExercises();

  const exercises = useMemo<Exercise[]>(() => mapSessionToExercises(sessionData), [sessionData]);
  
  // Determine initial exercise index from navigation state (preserves active tab on back navigation)
  const initialExerciseIndex = useExerciseNavigationState(exercises, initialExerciseName);

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

  // Initialize state with the calculated index
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(() => initialExerciseIndex);
  const [editingWeight, setEditingWeight] = useState<number | null>(null);
  const [editingReps, setEditingReps] = useState<number | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [showExerciseMenu, setShowExerciseMenu] = useState(false);
  const [showSetMenu, setShowSetMenu] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exercisePickerMode, setExercisePickerMode] = useState<'add' | 'swap'>('add');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  // Stop timer when summary is shown or session is completed
  const { formattedDuration } = useWorkoutTimer(
    showSummary || sessionData?.completed_at ? undefined : sessionData?.performed_at
  );
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const isAddingExercise = useRef(false);
  const previousExercisesLength = useRef(exercises.length);
  const hasInitializedFromState = useRef(false);
  
  const currentExercise = exercises[currentExerciseIndex];
  const currentSet = currentExercise?.sets.find(s => !s.completed);
  const completedSetsCount = currentExercise?.sets.filter(s => s.completed).length || 0;
  const selectedSet = selectedSetId && currentExercise
    ? (currentExercise.sets.find(s => s.id === selectedSetId) ?? null)
    : null;
  const isSelectedSetLast = selectedSet && currentExercise
    ? currentExercise.sets.findIndex(s => s.id === selectedSet.id) === currentExercise.sets.length - 1
    : false;
  const allExercisesCompleted = exercises.every(ex => ex.sets.every(s => s.completed));

  // Update exercise index when exercises load and we have initialExerciseName from navigation state
  // This handles the case where exercises load asynchronously after component mount
  // Only apply once when returning from navigation, not on every render
  useEffect(() => {
    if (initialExerciseName && exercises.length > 0 && !hasInitializedFromState.current) {
      // Only set the index once when we have initialExerciseName and exercises are loaded
      setCurrentExerciseIndex(initialExerciseIndex);
      hasInitializedFromState.current = true;
    } else if (!initialExerciseName) {
      // Reset the ref when we don't have initialExerciseName (fresh navigation, not returning)
      hasInitializedFromState.current = false;
    }
  }, [exercises.length, initialExerciseName, initialExerciseIndex]);

  // Reset editing values when current set changes (use null to show placeholders)
  useEffect(() => {
    if (currentSet && !editingSetId) {
      setEditingWeight(null);
      setEditingReps(null);
    }
  }, [currentSet?.id, editingSetId, currentSet]);

  // Auto-switch to newly added exercise
  useEffect(() => {
    if (isAddingExercise.current && exercises.length > previousExercisesLength.current) {
      // Switch to the last exercise (newly added)
      setCurrentExerciseIndex(exercises.length - 1);
      isAddingExercise.current = false;
    }
    previousExercisesLength.current = exercises.length;
  }, [exercises.length]);

  const handleDidIt = async () => {
    if (currentSet && currentExercise) {
      const setNumber = currentExercise.sets.findIndex(s => s.id === currentSet.id) + 1;
      // Use entered values, or fall back to defaults from currentSet
      const weightToLog = editingWeight ?? currentSet.weight;
      const repsToLog = editingReps ?? currentSet.reps;
      
      try {
        await logSet.mutateAsync({
          sessionId,
          data: {
            exercise_id: currentExercise.exerciseId,
            set_number: setNumber,
            weight: weightToLog,
            reps: repsToLog
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

  const handleStartTimer = () => {
    if (currentExercise?.restSeconds) {
      setRestTimerSeconds(currentExercise.restSeconds);
      setIsRestTimerActive(true);
    }
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
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleSummaryDismiss = () => {
    setShowSummary(false);
    onFinish();
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
        // Remove logged set AND decrease target_sets
        await deleteSet.mutateAsync({
          sessionId,
          setLogId: set.setLogId
        });
        // Also decrease target_sets to fully remove the set slot
        await updateSessionExercise.mutateAsync({
          sessionId,
          exerciseId: currentExercise.sessionExerciseId,
          data: { target_sets: currentExercise.targetSets - 1 }
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
    setExercisePickerMode('add');
    setShowExercisePicker(true);
  };

  const handleSelectExercise = async (exercise: { id: number; name: string; restTime: string; muscleGroups: string[]; imageUrl: string }) => {
    if (exercisePickerMode === 'add') {
      isAddingExercise.current = true;
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
        isAddingExercise.current = false;
      }
    } else if (exercisePickerMode === 'swap') {
      // Replace current exercise in place: remove, add at same position, reorder if needed, stay on same index
      if (currentExercise) {
        const swapIndex = currentExerciseIndex;
        try {
          await removeSessionExercise.mutateAsync({
            sessionId,
            exerciseId: currentExercise.sessionExerciseId
          });
          await addSessionExercise.mutateAsync({
            sessionId,
            data: {
              exercise_id: exercise.id,
              order: swapIndex,
              target_sets: currentExercise.targetSets,
              target_reps: parseInt(currentExercise.targetReps) || 10,
              target_weight: currentExercise.suggestedWeight
            }
          });
          setShowExercisePicker(false);
          setShowExerciseMenu(false);

          // Refetch session; if backend appended the new exercise, reorder so it's at swapIndex
          await queryClient.refetchQueries({ queryKey: ['sessions', sessionId] });
          const session = queryClient.getQueryData<{ exercises?: Array<{ session_exercise: { id: number; exercise_id: number } }> }>(['sessions', sessionId]);
          const sessionExercises = session?.exercises ?? [];
          const newEntry = sessionExercises.find((ex) => ex.session_exercise.exercise_id === exercise.id);
          const newSessionExerciseId = newEntry?.session_exercise.id;
          const currentOrder = sessionExercises.map((ex) => ex.session_exercise.id);

          if (newSessionExerciseId != null && currentOrder.length > 1) {
            const newIndex = currentOrder.indexOf(newSessionExerciseId);
            if (newIndex !== -1 && newIndex !== swapIndex) {
              const reorderIds = [...currentOrder];
              reorderIds.splice(newIndex, 1);
              reorderIds.splice(swapIndex, 0, newSessionExerciseId);
              await reorderSessionExercises.mutateAsync({ sessionId, exerciseIds: reorderIds });
            }
          }

          setCurrentExerciseIndex(swapIndex);
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
    setShowFinishConfirm(true);
  };

  const handleFinishWorkoutConfirm = async () => {
    setShowFinishConfirm(false);
    await handleFinish();
  };

  const handleCancelWorkoutClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelWorkoutConfirm = async () => {
    try {
      await cancelSession.mutateAsync(sessionId);
      setShowCancelConfirm(false);
      onBack();
    } catch (error) {
      console.error('Failed to cancel session:', error);
    }
  };

  return {
    // Core data
    exercises,
    currentExercise,
    currentExerciseIndex,
    isLoading,
    formattedDuration,
    allExercisesCompleted,

    // Set logging
    currentSet,
    completedSetsCount,
    editingWeight,
    editingReps,
    setEditingWeight,
    setEditingReps,
    handleDidIt,
    handleStartTimer,

    // Set editing
    editingSetId,
    handleSaveEdit,
    handleCancelEdit,

    // Exercise navigation
    handleSwitchExercise,

    // Set management
    handleAddSet,
    handleOpenSetMenu,
    handleEditSetFromMenu,
    handleRemoveSetFromMenu,

    // Exercise management
    handleAddExercise,
    handleSelectExercise,
    handleRemoveExercise,
    handleSwapExercise,
    handleViewExercise,

    // Menus & dialogs state
    showExerciseMenu,
    setShowExerciseMenu,
    showSetMenu,
    setShowSetMenu,
    selectedSet,
    selectedSetId,
    setSelectedSetId,
    isSelectedSetLast,
    showExercisePicker,
    setShowExercisePicker,
    exercisePickerMode,
    showCancelConfirm,
    setShowCancelConfirm,
    showFinishConfirm,
    setShowFinishConfirm,

    // Rest timer
    isRestTimerActive,
    restTimerSeconds,
    setIsRestTimerActive,

    // Session actions
    handleFinishWorkout,
    handleFinishWorkoutConfirm,
    handleCancelWorkoutClick,
    handleCancelWorkoutConfirm,
    showSummary,
    handleSummaryDismiss,

    // Loading states
    isCancelLoading: cancelSession.isPending,
    isAddExerciseLoading: addSessionExercise.isPending,
    isRemoveExerciseLoading: removeSessionExercise.isPending && !addSessionExercise.isPending,
    isRemoveSetLoading: deleteSet.isPending || updateSessionExercise.isPending,
    isCompleteLoading: completeSession.isPending,
  };
}
