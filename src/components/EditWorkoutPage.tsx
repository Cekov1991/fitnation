import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { ArrowLeft, Plus, Edit2, GripVertical } from 'lucide-react';
import { ExerciseEditMenu } from './ExerciseEditMenu';
import { EditSetsRepsModal } from './EditSetsRepsModal';
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
  onClick?: (exercise: Exercise) => void;
  skipDragAnimation?: boolean;
}

function DraggableExerciseItem({ exercise, onEditClick, onDragEnd, onClick, skipDragAnimation }: DraggableExerciseItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      key={exercise.id}
      value={exercise}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="w-full flex items-center gap-4 p-1 border rounded-2xl transition-colors cursor-pointer"
      style={{ 
        borderColor: 'var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)',
      }}
      onClick={(e: React.MouseEvent) => {
        if (onClick && !(e.target as HTMLElement).closest('[data-drag-handle], [data-edit-button]')) {
          onClick(exercise);
        }
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
      {/* Exercise Image - Left Section */}
      <div 
        className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden relative"
        onClick={(e) => {
          if (onClick && !(e.target as HTMLElement).closest('[data-drag-handle], [data-edit-button]')) {
            onClick(exercise);
          }
        }}
      >
        <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
      </div>

      {/* Exercise Info - Middle Section */}
      <div 
        className="flex-1 min-w-0"
        onClick={(e) => {
          if (onClick && !(e.target as HTMLElement).closest('[data-drag-handle], [data-edit-button]')) {
            onClick(exercise);
          }
        }}
      >
        <h4 className="text-sm font-bold mb-1 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          {exercise.name}
        </h4>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <span style={{ color: 'var(--color-primary)' }}>{exercise.sets} sets</span>
          <span className="mx-1 opacity-40">×</span>
          <span style={{ color: 'var(--color-primary)' }}>{exercise.reps} reps</span>
          <span className="mx-1 opacity-40">×</span>
          <span style={{ color: 'var(--color-primary)' }}>{exercise.weight} kg</span>
        </p>
      </div>

      {/* Edit Button */}
      <button 
        data-edit-button
        onClick={(e) => {
          e.stopPropagation();
          onEditClick(exercise);
        }} 
        className="flex-shrink-0 p-1 rounded-full transition-colors" 

      >
        <Edit2 className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
      </button>

      {/* Drag Handle - Right Side */}
      <div 
        data-drag-handle
        onPointerDown={(e) => {
          e.stopPropagation();
          controls.start(e);
        }}
        className="flex-shrink-0 p-1 rounded-lg cursor-grab active:cursor-grabbing transition-colors touch-none" 

      >
        <GripVertical className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
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
  const { data: template, isLoading, isError, error, refetch } = useTemplate(templateId);
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
    onViewExerciseDetail(exercise.name);
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

      <main className="relative z-10 max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <motion.div {...modalTransition} className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            {workoutName}
          </h1>
        </motion.div>

        {/* Workout Info Card */}
        {/* <motion.div 
        {...modalTransition}  
        className="border rounded-3xl p-4 mb-8 text-center"
        style={{ 
          background: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)'
        }}
      >
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{workoutName}</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {workoutDescription || 'New Workout'}
          </p>
        </motion.div> */}

        {/* Exercises Section */}
        <motion.div {...modalTransition}>
          {/* Exercises Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Exercises</h3>
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
              ) : (
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
                      onClick={handleExerciseClick}
                      skipDragAnimation={skipDragAnimation}
                    />
                  ))}
                </Reorder.Group>
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