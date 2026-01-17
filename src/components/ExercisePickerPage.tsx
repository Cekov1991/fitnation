import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight } from 'lucide-react';
import { useExercises } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
interface Exercise {
  id: number;
  name: string;
  restTime: string;
  muscleGroups: string[];
  imageUrl: string;
}
interface ExercisePickerPageProps {
  mode: 'add' | 'swap';
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}
export function ExercisePickerPage({
  mode,
  onClose,
  onSelectExercise
}: ExercisePickerPageProps) {
  const {
    data: exercises = [],
    isLoading
  } = useExercises();
  const [searchQuery, setSearchQuery] = useState('');
  const availableExercises = useMemo<Exercise[]>(() => {
    return exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      restTime: `${Math.round(exercise.default_rest_sec / 60)}m`,
      muscleGroups: (exercise.muscle_groups || []).map(group => group.name),
      imageUrl: exercise.image || ''
    }));
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    if (searchQuery.trim() === '') {
      return availableExercises;
    }
    const query = searchQuery.toLowerCase();
    return availableExercises.filter(exercise => exercise.name.toLowerCase().includes(query) || exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(query)));
  }, [availableExercises, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise);
    onClose();
  };
  return <div className="fixed inset-0 bg-[#0a0a0a] text-white z-50">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-30" />
      </div>

      <div className="relative z-10 h-full flex flex-col max-w-md mx-auto">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex items-center justify-between p-6 pb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {mode === 'add' ? 'Select Exercise' : 'Swap Exercise'}
          </h1>
          <motion.button whileHover={{
          scale: 1.1,
          rotate: 90
        }} whileTap={{
          scale: 0.9
        }} onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="text-gray-400 w-6 h-6" />
          </motion.button>
        </motion.div>

        {/* Search Bar */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
            <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="Search exercises..." className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
        </motion.div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <Search className="text-gray-500 w-8 h-8" />
                </div>
                <p className="text-gray-400 text-sm">Loading exercises...</p>
              </motion.div> : filteredExercises.length > 0 ? <div className="space-y-2">
                {filteredExercises.map((exercise, index) => <motion.button key={exercise.id} initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: 20
            }} transition={{
              delay: index * 0.05
            }} whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }} onClick={() => handleSelectExercise(exercise)} className="w-full flex items-center gap-4 p-4 bg-gray-800/40 hover:bg-gray-800/60 border border-white/5 rounded-2xl transition-colors text-left">
                    {/* Exercise Image/Muscle Diagram */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
                      <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
                    </div>

                    {/* Exercise Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white mb-1 leading-tight">
                        {exercise.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Rest: {exercise.restTime}
                      </p>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="flex-shrink-0 text-gray-500 w-5 h-5" />
                  </motion.button>)}
              </div> : <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <Search className="text-gray-500 w-8 h-8" />
                </div>
                <p className="text-gray-400 text-sm">No exercises found</p>
                <p className="text-gray-500 text-xs mt-1">
                  Try a different search term
                </p>
              </motion.div>}
          </AnimatePresence>
        </div>
      </div>
    </div>;
}