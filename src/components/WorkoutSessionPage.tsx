import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IonPage, IonContent, IonInput } from '@ionic/react';
import { ArrowLeft, Clock, ChevronRight, TrendingUp, Check, Edit2, Info, Plus, Trash2, MoreVertical, X, Eye, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useSession, useLogSet, useUpdateSet, useCompleteSession, useDeleteSet, useAddSessionExercise, useRemoveSessionExercise, useUpdateSessionExercise } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
import { ExercisePickerPage } from './ExercisePickerPage';
import { BackgroundGradients } from './BackgroundGradients';
interface Set {
  id: string;
  setLogId?: number;
  reps: number;
  weight: number;
  completed: boolean;
}
interface Exercise {
  id: string;
  exerciseId: number;
  sessionExerciseId: number; // WorkoutSessionExercise ID for API calls
  name: string;
  type: string;
  muscleGroup: string;
  sets: Set[];
  targetReps: string;
  targetSets: number;
  suggestedWeight: number;
  maxWeightLifted: number;
  imageUrl: string;
  history: {
    date: string;
    weight: number;
  }[];
}
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
  const logSet = useLogSet();
  const updateSet = useUpdateSet();
  const completeSession = useCompleteSession();
  const deleteSet = useDeleteSet();
  const addSessionExercise = useAddSessionExercise();
  const removeSessionExercise = useRemoveSessionExercise();
  const updateSessionExercise = useUpdateSessionExercise();

  const exercises = useMemo<Exercise[]>(() => {
    if (!sessionData?.exercises) return [];
    return sessionData.exercises.map((exDetail, index) => {
      const exercise = exDetail.session_exercise.exercise;
      const loggedSets = exDetail.logged_sets || [];
      const targetSets = exDetail.session_exercise.target_sets || 0;
      
      // Create sets array - mix of logged and unlogged
      const sets: Set[] = [];
      for (let i = 0; i < targetSets; i++) {
        const loggedSet = loggedSets.find(s => s.set_number === i + 1);
        if (loggedSet) {
          sets.push({
            id: `set-${loggedSet.id}`,
            setLogId: loggedSet.id,
            reps: loggedSet.reps,
            weight: loggedSet.weight,
            completed: true
          });
        } else {
          sets.push({
            id: `set-${exDetail.session_exercise.id}-${i}`,
            reps: exDetail.session_exercise.target_reps || 0,
            weight: exDetail.session_exercise.target_weight || 0,
            completed: false
          });
        }
      }

      return {
        id: `ex-${exDetail.session_exercise.id}`,
        exerciseId: exDetail.session_exercise.exercise_id,
        sessionExerciseId: exDetail.session_exercise.id,
        name: exercise?.name || 'Unknown Exercise',
        type: exercise?.category?.type?.toUpperCase() || 'COMPOUND',
        muscleGroup: exercise?.primary_muscle_groups?.[0]?.name?.toUpperCase() || 'UNKNOWN',
        sets,
        targetReps: exDetail.session_exercise.target_reps ? String(exDetail.session_exercise.target_reps) : '0',
        targetSets: exDetail.session_exercise.target_sets || 0,
        suggestedWeight: exDetail.session_exercise.target_weight || 0,
        maxWeightLifted: Math.max(...loggedSets.map(s => s.weight), 0),
        imageUrl: exercise?.image || '',
        history: [] // Leave empty as requested
      };
    });
  }, [sessionData]);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutDuration, setWorkoutDuration] = useState(0);
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
  // Initialize editing values when current set changes
  useEffect(() => {
    if (currentSet && !editingSetId) {
      setEditingWeight(currentSet.weight);
      setEditingReps(currentSet.reps);
    }
  }, [currentSet?.id, editingSetId, currentSet]);
  // Timer - Calculate based on performed_at from database
  useEffect(() => {
    if (!sessionData?.session?.performed_at) return;
    
    // Calculate initial elapsed time from performed_at to now
    const calculateElapsedTime = () => {
      const performedAt = new Date(sessionData.session.performed_at).getTime();
      const now = Date.now();
      return Math.floor((now - performedAt) / 1000);
    };
    
    // Set initial duration
    setWorkoutDuration(calculateElapsedTime());
    
    // Update every second
    const interval = setInterval(() => {
      setWorkoutDuration(calculateElapsedTime());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [sessionData?.session?.performed_at]);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
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
  const getExerciseCompletionStatus = (exercise: Exercise) => {
    const completed = exercise.sets.filter(s => s.completed).length;
    const total = exercise.sets.length;
    return {
      completed,
      total,
      isComplete: completed === total
    };
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

  const selectedSet = selectedSetId
    ? currentExercise?.sets.find(s => s.id === selectedSetId)
    : null;

  const allExercisesCompleted = exercises.every(ex => ex.sets.every(s => s.completed));
  
  if (isLoading) {
    return <div 
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading session...</div>
    </div>;
  }

  // Don't return early - show empty state instead

  return <IonPage>
      <IonContent>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
        <BackgroundGradients />

      <main className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex items-center justify-between p-6 pb-4">
          <button 
            onClick={onBack} 
            className="text-sm font-semibold transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            Exit
          </button>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {formatTime(workoutDuration)}
            </span>
          </div>
          <button 
            onClick={() => setShowWorkoutOptionsMenu(true)} 
            className="text-sm font-semibold transition-colors"
            style={{ color: 'var(--color-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Options
          </button>
        </motion.div>

        {/* Exercise Navigation Tabs */}
        {exercises.length > 0 && (
          <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.1
          }} className="px-6 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {exercises.map((exercise, index) => {
                const status = getExerciseCompletionStatus(exercise);
                const isActive = index === currentExerciseIndex;
                return <motion.button key={exercise.id} onClick={() => handleSwitchExercise(index)} whileHover={{
                  scale: 1.02
                }} whileTap={{
                  scale: 0.98
                }} 
                  className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'shadow-lg' : status.isComplete ? 'bg-green-500/10 border border-green-500/20' : 'border'}`}
                  style={!isActive && !status.isComplete ? {
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)'
                  } : {}}
                  style={isActive ? {
                    background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                    boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 20%, transparent)'
                  } : {}}
                >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                        <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
                      </div>
                      <div className="text-left">
                        <h3 
                          className="text-sm font-bold"
                          style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
                        >
                          {exercise.name.length > 20 ? exercise.name.substring(0, 20) + '...' : exercise.name}
                        </h3>
                        <p 
                          className="text-xs"
                          style={{ color: isActive ? 'rgba(255, 255, 255, 0.9)' : '#6b7280' }}
                        >
                          {status.completed}/{status.total} sets
                        </p>
                      </div>
                      {status.isComplete && <div className="flex-shrink-0 p-1 bg-green-500/20 rounded-full">
                          <Check className="text-green-400 w-4 h-4" />
                        </div>}
                    </motion.button>;
              })}
            </div>
          </motion.div>
        )}

        {/* Exercise Content - with proper bottom padding */}
        <div className="px-6 pb-40">
          {exercises.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: 0.2
              }}
              className="flex flex-col items-center justify-center py-20"
            >
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
              <motion.button
                whileHover={{
                  scale: 1.02
                }}
                whileTap={{
                  scale: 0.98
                }}
                onClick={() => setShowWorkoutOptionsMenu(true)}
                className="px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-lg"
                style={{
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                  boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 20%, transparent)'
                }}
              >
                Add Exercise
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={currentExercise.id} initial={{
                opacity: 0,
                x: 100
              }} animate={{
                opacity: 1,
                x: 0
              }} exit={{
                opacity: 0,
                x: -100
              }} transition={{
                duration: 0.3
              }} className="space-y-6">
              {/* Exercise Header with Menu Button */}
              <div 
                className="relative flex items-start gap-4 p-4 border rounded-2xl"
                style={{ 
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)'
                }}
              >
                <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden">
                  <ExerciseImage src={currentExercise.imageUrl} alt={currentExercise.name} className="w-full h-full" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {currentExercise.name}
                  </h2>
                  <span className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-bold text-cyan-400">
                    {currentExercise.muscleGroup}
                  </span>
                </div>

                <button
                  onClick={() => setShowExerciseMenu(true)}
                  className="flex-shrink-0 p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                  }}
                >
                  <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>

              {/* Max Weight Chart */}
              <div 
                className="backdrop-blur-sm border rounded-2xl p-4"
                style={{ 
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                    Max Weight Lifted
                  </span>
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {currentExercise.maxWeightLifted} kg
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    10 reps • 02/10/2025
                  </p>
                </div>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentExercise.history}>
                      <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} dot={false} fill="url(#gradient)" />
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Editable Suggestion Card - Only show if not editing a completed set */}
              {currentSet && editingWeight !== null && editingReps !== null && !editingSetId && <motion.div initial={{
              scale: 0.95,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} 
              className="rounded-3xl p-6 shadow-2xl"
              style={{
                background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-secondary))',
                boxShadow: '0 20px 50px color-mix(in srgb, var(--color-primary) 20%, transparent)'
              }}
            >
                    <p className="text-sm font-bold mb-4" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Log Your Set
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      {/* Weight Input */}
                      <div className="flex-1">
                        <label className="text-xs font-semibold mb-2 block" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                          Weight
                        </label>
                        <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
                          <IonInput type="number" inputmode="numeric" pattern="[0-9]*" value={editingWeight?.toString() || ''} onIonInput={e => setEditingWeight(parseInt(e.detail.value!) || 0)} className="ionic-input-workout" />
                          <span className="text-sm font-semibold ml-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            kg
                          </span>
                        </div>
                      </div>

                      {/* Reps Input */}
                      <div className="flex-1">
                        <label className="text-xs font-semibold mb-2 block" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                          Reps
                        </label>
                        <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
                          <IonInput type="number" inputmode="numeric" pattern="[0-9]*" value={editingReps?.toString() || ''} onIonInput={e => setEditingReps(parseInt(e.detail.value!) || 0)} className="ionic-input-workout" />
                          <span className="text-sm font-semibold ml-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            reps
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Did It Button */}
                    <motion.button whileHover={{
                scale: 1.02
              }} whileTap={{
                scale: 0.98
              }} 
                onClick={handleDidIt} 
                className="w-full mt-4 px-6 py-4 bg-white rounded-2xl font-bold text-lg shadow-lg"
                style={{ color: 'var(--color-primary)' }}
              >
                      Log Set
                    </motion.button>
                  </motion.div>}

              {/* Edit Set Card - Show when editing a completed set */}
              {editingSetId && editingWeight !== null && editingReps !== null && <motion.div initial={{
              scale: 0.95,
              opacity: 0
            }} animate={{
              scale: 1,
              opacity: 1
            }} className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl p-6 shadow-2xl shadow-orange-500/20">
                    <p className="text-sm font-bold text-orange-100 mb-4">
                      Edit Set
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      {/* Weight Input */}
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-orange-100 mb-2 block">
                          Weight
                        </label>
                        <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
                          <IonInput type="number" inputmode="numeric" pattern="[0-9]*" value={editingWeight?.toString() || ''} onIonInput={e => setEditingWeight(parseInt(e.detail.value!) || 0)} className="ionic-input-workout" />
                          <span className="text-sm font-semibold text-orange-100 ml-2">
                            kg
                          </span>
                        </div>
                      </div>

                      {/* Reps Input */}
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-orange-100 mb-2 block">
                          Reps
                        </label>
                        <div className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 focus-within:border-white/40 transition-colors">
                          <IonInput type="number" inputmode="numeric" pattern="[0-9]*" value={editingReps?.toString() || ''} onIonInput={e => setEditingReps(parseInt(e.detail.value!) || 0)} className="ionic-input-workout" />
                          <span className="text-sm font-semibold text-orange-100 ml-2">
                            reps
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      <motion.button whileHover={{
                  scale: 1.02
                }} whileTap={{
                  scale: 0.98
                }} 
                  onClick={handleCancelEdit} 
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-lg" 
                  style={{ 
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 20%, transparent)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-text-primary) 30%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-text-primary) 20%, transparent)';
                  }}
                >
                        Cancel
                      </motion.button>
                      <motion.button whileHover={{
                  scale: 1.02
                }} whileTap={{
                  scale: 0.98
                }} 
                  onClick={handleSaveEdit} 
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-lg shadow-lg"
                  style={{ 
                    color: '#ea580c', // orange-600 - semantic color for save action
                    backgroundColor: 'var(--color-text-primary)'
                  }}
                >
                        Save
                      </motion.button>
                    </div>
                  </motion.div>}

              {/* All Sets List */}
              <div className="space-y-2">
                {currentExercise.sets.map((set, index) => (
                  <motion.div
                    key={set.id}
                    initial={{
                      opacity: 0,
                      x: -20,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay: index * 0.1,
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors border ${editingSetId === set.id ? 'bg-orange-500/20 border-2 border-orange-500/40' : set.completed ? 'bg-green-500/10 border border-green-500/20' : ''}`}
                    style={!editingSetId && !set.completed ? {
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border-subtle)'
                    } : {}}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                        Set {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {set.weight}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>kg</span>
                      </div>
                      <span style={{ color: 'var(--color-border)' }}>×</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {set.reps}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>reps</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenSetMenu(set.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                      }}
                    >
                      <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                  </motion.div>
                ))}

                {/* Add Set Button */}
                {!editingSetId && (
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={handleAddSet}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl transition-colors"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-primary) 20%, transparent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-primary) 10%, transparent)';
                    }}
                  >
                    <Plus className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                      Add Set
                    </span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          )}
        </div>
      </main>

      {/* Finish Workout Button - Fixed above bottom nav with more spacing */}
      <AnimatePresence>
        {allExercisesCompleted && <motion.div initial={{
        opacity: 0,
        y: 100
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: 100
      }} className="fixed bottom-28 left-0 right-0 px-6 max-w-md mx-auto z-20">
            <motion.button whileHover={{
          scale: 1.02
        }} whileTap={{
          scale: 0.98
        }} onClick={handleFinish} className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl font-bold text-lg shadow-2xl shadow-green-500/30 relative overflow-hidden group">
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Check className="w-6 h-6" />
                FINISH WORKOUT
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </motion.div>}
      </AnimatePresence>

      {/* Workout Options Menu */}
      <AnimatePresence>
        {showWorkoutOptionsMenu && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() => setShowWorkoutOptionsMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{
                y: '100%',
              }}
              animate={{
                y: 0,
              }}
              exit={{
                y: '100%',
              }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
            >
              <div 
                className="rounded-t-3xl shadow-2xl p-6 pb-32"
                style={{ backgroundColor: 'var(--color-bg-modal)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Workout Options
                  </h3>
                  <button
                    onClick={() => setShowWorkoutOptionsMenu(false)}
                    className="p-2 rounded-full transition-colors"
                    style={{ backgroundColor: 'var(--color-border-subtle)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-border)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
                    }}
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                </div>

                <div className="space-y-2">
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={handleAddExercise}
                    className="w-full flex items-center gap-4 p-4 border rounded-xl transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                    }}
                  >
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
                    >
                      <Plus className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Add Exercise
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Add a new exercise to workout
                      </p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={handleFinishWorkout}
                    className="w-full flex items-center gap-4 p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl transition-colors"
                  >
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Check className="text-green-400 w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-green-400">
                        Finish Workout
                      </p>
                      <p className="text-xs text-green-400/70">
                        Complete and save workout
                      </p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Exercise Menu Modal */}
      <AnimatePresence>
        {showExerciseMenu && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() => setShowExerciseMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{
                y: '100%',
              }}
              animate={{
                y: 0,
              }}
              exit={{
                y: '100%',
              }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
            >
              <div 
                className="rounded-t-3xl shadow-2xl p-6 pb-32"
                style={{ backgroundColor: 'var(--color-bg-modal)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Exercise Options
                  </h3>
                  <button
                    onClick={() => setShowExerciseMenu(false)}
                    className="p-2 rounded-full transition-colors"
                    style={{ backgroundColor: 'var(--color-border-subtle)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-border)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
                    }}
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                </div>

                <div className="space-y-2">
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={handleViewExercise}
                    className="w-full flex items-center gap-4 p-4 border rounded-xl transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                    }}
                  >
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
                    >
                      <Eye className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        View Exercise
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        See instructions and video
                      </p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={handleSwapExercise}
                    className="w-full flex items-center gap-4 p-4 border rounded-xl transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                    }}
                  >
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
                    >
                      <RefreshCw className="w-5 h-5" style={{ color: 'var(--color-secondary)' }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Swap Exercise
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Replace with another exercise
                      </p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={handleRemoveExercise}
                    className="w-full flex items-center gap-4 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors"
                  >
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Trash2 className="text-red-400 w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-red-400">
                        Remove Exercise
                      </p>
                      <p className="text-xs text-red-400/70">
                        Delete from workout
                      </p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Set Menu Modal */}
      <AnimatePresence>
        {showSetMenu && selectedSet && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() => setShowSetMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{
                y: '100%',
              }}
              animate={{
                y: 0,
              }}
              exit={{
                y: '100%',
              }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
              }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
            >
              <div 
                className="rounded-t-3xl shadow-2xl p-6 pb-32"
                style={{ backgroundColor: 'var(--color-bg-modal)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Set Options</h3>
                  <button
                    onClick={() => setShowSetMenu(false)}
                    className="p-2 rounded-full transition-colors"
                    style={{ backgroundColor: 'var(--color-border-subtle)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-border)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
                    }}
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedSet.completed && (
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                      }}
                      whileTap={{
                        scale: 0.98,
                      }}
                      onClick={handleEditSetFromMenu}
                      className="w-full flex items-center gap-4 p-4 border rounded-xl transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                    }}
                    >
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Edit2 className="text-orange-400 w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Edit Set</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Modify weight and reps
                        </p>
                      </div>
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={handleRemoveSetFromMenu}
                    className="w-full flex items-center gap-4 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors"
                  >
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Trash2 className="text-red-400 w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-red-400">
                        Remove Set
                      </p>
                      <p className="text-xs text-red-400/70">Delete this set</p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
      </IonContent>
    </IonPage>;
}