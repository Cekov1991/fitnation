import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, ChevronRight, TrendingUp, Check, Edit2, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useSession, useLogSet, useUpdateSet, useCompleteSession } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
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
  name: string;
  type: string;
  muscleGroup: string;
  sets: Set[];
  targetReps: string;
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
        name: exercise?.name || 'Unknown Exercise',
        type: exercise?.category?.type?.toUpperCase() || 'COMPOUND',
        muscleGroup: exercise?.primary_muscle_groups?.[0]?.name?.toUpperCase() || 'UNKNOWN',
        sets,
        targetReps: exDetail.session_exercise.target_reps ? String(exDetail.session_exercise.target_reps) : '0',
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

  const allExercisesCompleted = exercises.every(ex => ex.sets.every(s => s.completed));
  
  if (isLoading) {
    return <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading session...</div>
    </div>;
  }

  if (!currentExercise) {
    return <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-gray-400 text-sm">No exercises in this session</div>
    </div>;
  }

  return <div className="min-h-screen w-full bg-[#0a0a0a] text-white pb-32">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-30" />
      </div>

      <main className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex items-center justify-between p-6 pb-4">
          <button onClick={onBack} className="text-sm font-semibold text-gray-400 hover:text-gray-300 transition-colors">
            Exit
          </button>
          <div className="flex items-center gap-2">
            <Clock className="text-gray-500 w-4 h-4" />
            <span className="text-sm text-gray-400">
              {formatTime(workoutDuration)}
            </span>
          </div>
          <button onClick={handleFinish} className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            Finish
          </button>
        </motion.div>

        {/* Exercise Navigation Tabs */}
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
            }} className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20' : status.isComplete ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-800/40 border border-white/5'}`}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                    <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {exercise.name.length > 20 ? exercise.name.substring(0, 20) + '...' : exercise.name}
                    </h3>
                    <p className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
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

        {/* Exercise Content - with proper bottom padding */}
        <div className="px-6 pb-40">
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
              {/* Exercise Header - Clickable */}
              <motion.button onClick={() => onViewExerciseDetail(currentExercise.name)} whileHover={{
              scale: 1.01
            }} whileTap={{
              scale: 0.99
            }} className="w-full flex items-start gap-4 p-4 bg-gray-800/40 hover:bg-gray-800/60 border border-white/5 rounded-2xl transition-colors group">
                <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden">
                  <ExerciseImage src={currentExercise.imageUrl} alt={currentExercise.name} className="w-full h-full" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {currentExercise.name}
                  </h2>
                  <span className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-bold text-cyan-400">
                    {currentExercise.muscleGroup}
                  </span>
                </div>
                <div className="flex-shrink-0 p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <Info className="text-blue-400 w-5 h-5" />
                </div>
              </motion.button>

              {/* Max Weight Chart */}
              <div className="bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-blue-400">
                    Max Weight Lifted
                  </span>
                  <TrendingUp className="text-blue-400 w-4 h-4" />
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-white">
                    {currentExercise.maxWeightLifted} kg
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
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
            }} className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-6 shadow-2xl shadow-blue-500/20">
                    <p className="text-sm font-bold text-blue-100 mb-4">
                      Log Your Set
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      {/* Weight Input */}
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-blue-100 mb-2 block">
                          Weight
                        </label>
                        <div className="relative">
                          <input type="number" value={editingWeight} onChange={e => setEditingWeight(parseInt(e.target.value) || 0)} className="w-full text-4xl font-black text-white bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-white/40 transition-colors" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-100">
                            kg
                          </span>
                        </div>
                      </div>

                      {/* Reps Input */}
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-blue-100 mb-2 block">
                          Reps
                        </label>
                        <div className="relative">
                          <input type="number" value={editingReps} onChange={e => setEditingReps(parseInt(e.target.value) || 0)} className="w-full text-4xl font-black text-white bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-white/40 transition-colors" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-100">
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
              }} onClick={handleDidIt} className="w-full mt-4 px-6 py-4 bg-white rounded-2xl font-bold text-lg text-blue-600 shadow-lg">
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
                        <div className="relative">
                          <input type="number" value={editingWeight} onChange={e => setEditingWeight(parseInt(e.target.value) || 0)} className="w-full text-4xl font-black text-white bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-white/40 transition-colors" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-orange-100">
                            kg
                          </span>
                        </div>
                      </div>

                      {/* Reps Input */}
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-orange-100 mb-2 block">
                          Reps
                        </label>
                        <div className="relative">
                          <input type="number" value={editingReps} onChange={e => setEditingReps(parseInt(e.target.value) || 0)} className="w-full text-4xl font-black text-white bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-white/40 transition-colors" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-orange-100">
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
                }} onClick={handleCancelEdit} className="flex-1 px-6 py-4 bg-white/20 rounded-2xl font-bold text-lg text-white">
                        Cancel
                      </motion.button>
                      <motion.button whileHover={{
                  scale: 1.02
                }} whileTap={{
                  scale: 0.98
                }} onClick={handleSaveEdit} className="flex-1 px-6 py-4 bg-white rounded-2xl font-bold text-lg text-orange-600 shadow-lg">
                        Save
                      </motion.button>
                    </div>
                  </motion.div>}

              {/* All Sets List */}
              <div className="space-y-2">
                {currentExercise.sets.map((set, index) => <motion.button key={set.id} initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: index * 0.1
              }} onClick={() => set.completed && handleEditSet(set)} disabled={!set.completed} className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${editingSetId === set.id ? 'bg-orange-500/20 border-2 border-orange-500/40' : set.completed ? 'bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 cursor-pointer' : 'bg-gray-800/30 border border-white/5'}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-400">
                        Set {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {set.weight}
                        </span>
                        <span className="text-xs text-gray-500">kg</span>
                      </div>
                      <span className="text-gray-600">×</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {set.reps}
                        </span>
                        <span className="text-xs text-gray-500">reps</span>
                      </div>
                    </div>
                    {editingSetId === set.id ? <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Edit2 className="text-orange-400 w-5 h-5" />
                      </div> : set.completed ? <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Check className="text-green-400 w-5 h-5" />
                        </div>
                        <Edit2 className="text-gray-500 w-4 h-4" />
                      </div> : <ChevronRight className="text-gray-600 w-5 h-5" />}
                  </motion.button>)}
              </div>
            </motion.div>
          </AnimatePresence>
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>;
}