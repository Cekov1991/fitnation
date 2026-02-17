import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSimpleTransition } from '../../utils/animations';
import { ExerciseVideoCard } from './ExerciseVideoCard';
import { RestTimer } from './RestTimer';
import { SetsList } from './SetsList';
import type { Exercise, Set } from './types';

interface ExerciseContentProps {
  exercises: Exercise[];
  currentExercise: Exercise | undefined;
  currentSet: Set | undefined;
  editingSetId: string | null;
  editingWeight: number | null;
  editingReps: number | null;
  setEditingWeight: (w: number | null) => void;
  setEditingReps: (r: number | null) => void;
  isRestTimerActive: boolean;
  restTimerSeconds: number | null;
  setIsRestTimerActive: (v: boolean) => void;
  onAddExercise: () => void;
  onOpenSetMenu: (setId: string) => void;
  onAddSet: () => Promise<void>;
  onLogSet: () => Promise<void>;
  onStartTimer: () => void;
  onSaveEdit: () => Promise<void>;
  onCancelEdit: () => void;
  onViewExerciseDetail: (exerciseName: string) => void;
  onOpenExerciseMenu: () => void;
  isAddSetLoading: boolean;
}

export function ExerciseContent({
  exercises,
  currentExercise,
  currentSet,
  editingSetId,
  editingWeight,
  editingReps,
  setEditingWeight,
  setEditingReps,
  isRestTimerActive,
  restTimerSeconds,
  setIsRestTimerActive,
  onAddExercise,
  onOpenSetMenu,
  onAddSet,
  onLogSet,
  onStartTimer,
  onSaveEdit,
  onCancelEdit,
  onViewExerciseDetail,
  onOpenExerciseMenu,
  isAddSetLoading,
}: ExerciseContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const simpleTransition = useSimpleTransition();

  if (exercises.length === 0) {
    // Empty State
    return (
      <div className="px-6">
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
            Start your workout by adding exercises. Use the Add Exercise button below to get started.
          </p>
          <button
            onClick={onAddExercise}
            className="px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-lg"
            style={{
              background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
              boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 20%, transparent)'
            }}
          >
            Add Exercise
          </button>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return null;
  }

  return (
    <div className="px-6">
      <div className="space-y-6">
        {/* Exercise info and input cards - animated on exercise switch */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentExercise.id} 
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
            transition={simpleTransition}
            className="space-y-6"
          >
            <ExerciseVideoCard
              exercise={currentExercise}
              onOpenMenu={onOpenExerciseMenu}
              onViewExercise={() => onViewExerciseDetail(currentExercise.name)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Rest Timer - Outside keyed content to persist across exercise switches */}
        <AnimatePresence>
          {isRestTimerActive && (
            <RestTimer
              restSeconds={restTimerSeconds}
              isActive={isRestTimerActive}
              onDismiss={() => setIsRestTimerActive(false)}
            />
          )}
        </AnimatePresence>

        {/* Sets list with inline log/edit cards */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={`sets-${currentExercise.id}`}
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
            transition={simpleTransition}
            className="space-y-2"
          >
            <SetsList
              sets={currentExercise.sets}
              currentSet={currentSet}
              editingSetId={editingSetId}
              editingWeight={editingWeight}
              editingReps={editingReps}
              setEditingWeight={setEditingWeight}
              setEditingReps={setEditingReps}
              onOpenSetMenu={onOpenSetMenu}
              onAddSet={onAddSet}
              onLogSet={onLogSet}
              onStartTimer={onStartTimer}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              isRestTimerActive={isRestTimerActive}
              restSeconds={currentExercise.restSeconds}
              allowWeightLogging={currentExercise.allowWeightLogging}
              isAddSetLoading={isAddSetLoading}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
