import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, Plus, Edit2, GripVertical } from 'lucide-react';
import { ExerciseEditMenu } from './ExerciseEditMenu';
import { EditSetsRepsModal } from './EditSetsRepsModal';
import { useTemplate, useAddTemplateExercise, useUpdateTemplateExercise, useRemoveTemplateExercise } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
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
  const { data: template, isLoading } = useTemplate(templateId);
  const addExercise = useAddTemplateExercise();
  const updateExercise = useUpdateTemplateExercise();
  const removeExercise = useRemoveTemplateExercise();

  const exercises = useMemo<Exercise[]>(() => {
    if (!template?.exercises) return [];
    return template.exercises.map((ex, index) => ({
      id: `ex-${ex.id}`,
      pivotId: ex.pivot.id,
      name: ex.name,
      sets: ex.pivot.target_sets || 0,
      reps: ex.pivot.target_reps ? String(ex.pivot.target_reps) : '0',
      weight: ex.pivot.target_weight ? `${ex.pivot.target_weight} kg` : '0 kg',
      muscleGroups: ex.muscle_groups?.map(mg => mg.name) || [],
      primaryMuscle: ex.muscle_groups?.[0]?.name || 'Unknown',
      imageUrl: ex.image || ''
    }));
  }, [template]);

  const [isEditMode, setIsEditMode] = useState(false);
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
  return <IonPage>
      <IonContent>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div 
            className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" 
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
          />
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" 
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
          />
        </div>

      <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex items-center gap-4 mb-8">
          <motion.button whileHover={{
          scale: 1.1,
          x: -2
        }} whileTap={{
          scale: 0.9
        }} onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
          </motion.button>
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            Edit Workout
          </h1>
        </motion.div>

        {/* Workout Info Card */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} 
        className="bg-gradient-to-br backdrop-blur-sm border rounded-3xl p-8 mb-8 text-center"
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
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }}>
          {/* Exercises Header with Edit Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Exercises</h3>
            <motion.button whileHover={{
            scale: 1.1
          }} whileTap={{
            scale: 0.9
          }} 
            onClick={() => setIsEditMode(!isEditMode)} 
            className="p-2 rounded-full transition-colors"
            style={isEditMode ? {
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
              color: 'var(--color-primary)'
            } : {
              color: 'var(--color-text-secondary)'
            }}
            onMouseEnter={(e) => {
              if (!isEditMode) {
                e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isEditMode) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
              <Edit2 className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Exercise List */}
          <div className="space-y-3 mb-4">
            {isLoading ? <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>Loading exercises...</div> : <AnimatePresence>
              {exercises.map((exercise, index) => <motion.div key={exercise.id} initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: 20
            }} transition={{
              delay: index * 0.1
            }} 
              onClick={() => handleExerciseClick(exercise)} 
              className={`backdrop-blur-sm border rounded-2xl p-4 transition-colors ${!isEditMode ? 'cursor-pointer' : ''}`}
              style={{ 
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-subtle)'
              }}
              onMouseEnter={(e) => {
                if (!isEditMode) e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
              }}
            >
                  <div className="flex items-center gap-4">
                    {/* Drag Handle (only visible in edit mode) */}
                    <AnimatePresence>
                      {isEditMode && <motion.button initial={{
                    opacity: 0,
                    scale: 0.8
                  }} animate={{
                    opacity: 1,
                    scale: 1
                  }} exit={{
                    opacity: 0,
                    scale: 0.8
                  }} className="flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing transition-colors" style={{ backgroundColor: 'var(--color-border-subtle)' }}>
                          <GripVertical className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                        </motion.button>}
                    </AnimatePresence>

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
                        {exercise.sets} sets × {exercise.reps} reps ×{' '}
                        {exercise.weight}
                      </p>
                    </div>

                    {/* Edit Button (only visible in edit mode) */}
                    <AnimatePresence>
                      {isEditMode && <motion.button initial={{
                    opacity: 0,
                    scale: 0.8
                  }} animate={{
                    opacity: 1,
                    scale: 1
                  }} exit={{
                    opacity: 0,
                    scale: 0.8
                  }} whileHover={{
                    scale: 1.1
                  }} whileTap={{
                    scale: 0.9
                  }} onClick={e => {
                    e.stopPropagation();
                    handleExerciseEditClick(exercise);
                  }} className="flex-shrink-0 p-2 rounded-full transition-colors" style={{ backgroundColor: 'var(--color-border-subtle)' }}>
                          <Edit2 className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                        </motion.button>}
                    </AnimatePresence>
                  </div>
                </motion.div>)}
            </AnimatePresence>}
          </div>

          {/* Add Exercise Button */}
          <motion.button initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3
        }} whileHover={{
          scale: 1.02
        }} whileTap={{
          scale: 0.98
        }} 
          onClick={onAddExercise} 
          className="w-full py-6 border-2 border-dashed rounded-2xl transition-all group"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-primary) 5%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 30%, transparent)';
            e.currentTarget.style.backgroundColor = 'transparent';
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
          </motion.button>
        </motion.div>
      </main>

      {/* Exercise Edit Menu */}
      <ExerciseEditMenu isOpen={isEditMenuOpen} onClose={() => setIsEditMenuOpen(false)} onEditSetsReps={handleEditSetsReps} onSwap={handleSwapExerciseClick} onRemove={handleRemoveExercise} />

      {/* Edit Sets/Reps Modal */}
      {editingExercise && <EditSetsRepsModal isOpen={isEditSetsRepsOpen} onClose={() => setIsEditSetsRepsOpen(false)} initialSets={editingExercise.sets} initialReps={editingExercise.reps} initialWeight={editingExercise.weight} onSave={handleSaveSetsReps} />}
    </div>
      </IonContent>
    </IonPage>;
}