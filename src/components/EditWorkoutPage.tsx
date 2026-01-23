import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { ArrowLeft, Plus, Edit2, GripVertical } from 'lucide-react';
import { ExerciseEditMenu } from './ExerciseEditMenu';
import { EditSetsRepsModal } from './EditSetsRepsModal';
import { BackgroundGradients } from './BackgroundGradients';
import { LoadingContent } from './ui';
import { useTemplate, useUpdateTemplateExercise, useRemoveTemplateExercise, useReorderTemplateExercises } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
import { useModalTransition } from '../utils/animations';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { TemplateExercise, MuscleGroupResource } from '../types/api';

const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

interface Exercise {
  id: string;
  pivotId: number;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  muscleGroups: string[];
  primaryMuscle: string;
  imageUrl: string;
}

// Separate component for draggable exercise item to use its own useDragControls hook
interface DraggableExerciseItemProps {
  exercise: Exercise;
  onEditClick: (exercise: Exercise) => void;
  onDragEnd: () => void;
  skipDragAnimation?: boolean;
}

function DraggableExerciseItem({ exercise, onEditClick, onDragEnd, skipDragAnimation }: DraggableExerciseItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      key={exercise.id}
      value={exercise}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="border rounded-2xl p-4"
      style={{ 
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)'
      }}
      // iOS-friendly: use only transform (scale) and avoid expensive boxShadow animation
      whileDrag={skipDragAnimation ? undefined : { 
        scale: 1.02,
        cursor: 'grabbing'
      }}
      // Use tween instead of spring for smoother iOS performance
      transition={{
        type: 'tween',
        duration: 0.15,
        ease: 'easeOut'
      }}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle - only this triggers drag */}
        <div 
          onPointerDown={(e) => controls.start(e)}
          className="flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing transition-colors touch-none" 
          style={{ backgroundColor: 'var(--color-border-subtle)' }}
        >
          <GripVertical className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
        </div>

        {/* Exercise Image */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
          <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
        </div>

        {/* Exercise Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold mb-1 leading-tight break-words" style={{ color: 'var(--color-text-primary)' }}>
            {exercise.name}
          </h4>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {exercise.sets} sets × {exercise.reps} reps × {exercise.weight} kg
          </p>
        </div>

        {/* Edit Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(exercise);
          }} 
          className="flex-shrink-0 p-2 rounded-full transition-colors" 
          style={{ backgroundColor: 'var(--color-border-subtle)' }}
        >
          <Edit2 className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>
    </Reorder.Item>
  );
}
interface EditWorkoutPageProps {
  templateId: number;
  workoutName: string;
  workoutDescription?: string;
  onBack: () => void;
  onAddExercise: () => void;
  onSwapExercise: () => void;
  onViewExerciseDetail: (exerciseName: string) => void;
}
export function EditWorkoutPage({
  templateId,
  workoutName,
  workoutDescription,
  onBack,
  onAddExercise,
  onSwapExercise,
  onViewExerciseDetail
}: EditWorkoutPageProps) {
  const { data: template, isLoading, isFetching, isError, error, refetch } = useTemplate(templateId);
  const updateExercise = useUpdateTemplateExercise();
  const removeExercise = useRemoveTemplateExercise();
  const reorderExercises = useReorderTemplateExercises();
  const modalTransition = useModalTransition();
  const shouldReduceMotion = useReducedMotion();
  const skipDragAnimation = shouldReduceMotion || isIOS;

  const exercisesFromTemplate = useMemo<Exercise[]>(() => {
    if (!template?.exercises) return [];
    return template.exercises.map((ex: TemplateExercise) => ({
      id: `pivot-${ex.pivot.id}`,
      pivotId: ex.pivot.id,
      name: ex.name,
      sets: ex.pivot.target_sets || 0,
      reps: ex.pivot.target_reps ? String(ex.pivot.target_reps) : '0',
      weight: ex.pivot.target_weight ? String(ex.pivot.target_weight) : '0',
      muscleGroups: ex.muscle_groups?.map((mg: MuscleGroupResource) => mg.name) || [],
      primaryMuscle: ex.muscle_groups?.[0]?.name || 'Unknown',
      imageUrl: ex.image || ''
    }));
  }, [template]);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isEditMode, setIsEditMode] = useState(true);
  const pendingOrderRef = useRef<Exercise[] | null>(null);
  const isDraggingRef = useRef(false);

  // Sync local state with template data
  useEffect(() => {
    setExercises(exercisesFromTemplate);
  }, [exercisesFromTemplate]);

  // Update local state immediately during drag (for visual feedback)
  const handleReorder = (newOrder: Exercise[]) => {
    setExercises(newOrder);
    pendingOrderRef.current = newOrder;
    isDraggingRef.current = true;
  };

  // Make API call only when drag ends
  const handleDragEnd = async () => {
    if (!pendingOrderRef.current || !isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    const finalOrder = pendingOrderRef.current;
    pendingOrderRef.current = null;
    
    // Get the pivot IDs in the new order
    const pivotIds = finalOrder.map(ex => ex.pivotId);
    
    try {
      await reorderExercises.mutateAsync({
        templateId,
        order: pivotIds
      });
    } catch (error) {
      // Revert to original order on error
      setExercises(exercisesFromTemplate);
      console.error('Failed to reorder exercises:', error);
    }
  };
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isEditSetsRepsOpen, setIsEditSetsRepsOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const handleExerciseClick = (exercise: Exercise) => {
    if (!isEditMode) {
      onViewExerciseDetail(exercise.name);
    }
  };
  const handleExerciseEditClick = (exercise: Exercise) => {
    setSelectedExerciseId(exercise.id);
    setEditingExercise(exercise);
    setIsEditMenuOpen(true);
  };
  const handleEditSetsReps = () => {
    setIsEditSetsRepsOpen(true);
  };
  const handleSaveSetsReps = async (sets: number, reps: string, weight: string) => {
    if (editingExercise) {
      // Parse reps (could be "8-10" or "10")
      const repsNum = parseInt(reps.split('-')[0]) || 0;
      // Parse weight (remove "kg" suffix)
      const weightNum = parseFloat(weight.replace(' kg', '')) || 0;
      
      await updateExercise.mutateAsync({
        templateId,
        pivotId: editingExercise.pivotId,
        data: {
          target_sets: sets,
          target_reps: repsNum,
          target_weight: weightNum
        }
      });
      setIsEditSetsRepsOpen(false);
    }
  };
  const handleSwapExerciseClick = () => {
    onSwapExercise();
  };
  const handleRemoveExercise = async () => {
    if (selectedExerciseId) {
      const exercise = exercises.find(ex => ex.id === selectedExerciseId);
      if (exercise) {
        await removeExercise.mutateAsync({
          templateId,
          pivotId: exercise.pivotId
        });
        setIsEditMenuOpen(false);
      }
    }
  };
  return <div>
      <div>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
        <BackgroundGradients />

      <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
        {/* Header */}
        <motion.div {...modalTransition} className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            Edit Workout
          </h1>
        </motion.div>

        {/* Workout Info Card */}
        <motion.div 
        {...modalTransition}  
        className="bg-gradient-to-br   border rounded-3xl p-8 mb-8 text-center"
        style={{ 
          background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
          borderColor: 'var(--color-border)'
        }}
      >
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{workoutName}</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {workoutDescription || 'New Workout'}
          </p>
        </motion.div>

        {/* Exercises Section */}
        <motion.div {...modalTransition}>
          {/* Exercises Header with Edit Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Exercises</h3>
            <button 
            onClick={() => setIsEditMode(!isEditMode)} 
            className="p-2 rounded-full transition-colors"
            style={isEditMode ? {
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
              color: 'var(--color-primary)'
            } : {
              color: 'var(--color-text-secondary)'
            }}
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>

          {/* Exercise List */}
          <div className="mb-4">
            {/* Loading indicator when refetching */}
            
            <LoadingContent
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRetry={() => refetch()}
            >
              {exercises.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                  No exercises in this workout yet.
                </div>
              ) : isEditMode ? (
                <Reorder.Group 
                  axis="y" 
                  values={exercises} 
                  onReorder={handleReorder}
                  className="space-y-3"
                >
                  {exercises.map((exercise) => (
                    <DraggableExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      onEditClick={handleExerciseEditClick}
                      onDragEnd={handleDragEnd}
                      skipDragAnimation={skipDragAnimation}
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <div className="space-y-3">
                  {exercises.map((exercise) => (
                    <motion.div 
                      key={exercise.id} 
                      {...modalTransition}
                      onClick={() => handleExerciseClick(exercise)} 
                      className="border rounded-2xl p-4 transition-colors cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border-subtle)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Exercise Image */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
                          <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
                        </div>

                        {/* Exercise Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold mb-1 leading-tight break-words" style={{ color: 'var(--color-text-primary)' }}>
                            {exercise.name}
                          </h4>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {exercise.sets} sets × {exercise.reps} reps × {exercise.weight} kg
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </LoadingContent>
          </div>

          {/* Add Exercise Button */}
          <button
          onClick={onAddExercise} 
          className="w-full py-6 border-2 border-dashed rounded-2xl transition-all group"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
          }}
        >
            <div className="flex items-center justify-center gap-3">
              <div 
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
              >
                <Plus className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-base font-semibold" style={{ color: 'var(--color-primary)' }}>
                Add Exercise
              </span>
            </div>
          </button>
        </motion.div>
      </main>

      {/* Exercise Edit Menu */}
      <ExerciseEditMenu isOpen={isEditMenuOpen} onClose={() => setIsEditMenuOpen(false)} onEditSetsReps={handleEditSetsReps} onSwap={handleSwapExerciseClick} onRemove={handleRemoveExercise} isRemoveLoading={removeExercise.isPending} exerciseName={editingExercise?.name} />

      {/* Edit Sets/Reps Modal */}
      {editingExercise && <EditSetsRepsModal isOpen={isEditSetsRepsOpen} onClose={() => setIsEditSetsRepsOpen(false)} initialSets={editingExercise.sets} initialReps={editingExercise.reps} initialWeight={editingExercise.weight} onSave={handleSaveSetsReps} isLoading={updateExercise.isPending} exerciseName={editingExercise.name} />}
    </div>
      </div>
    </div>;
}