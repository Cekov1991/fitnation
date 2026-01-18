import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight } from 'lucide-react';
import { useExercises } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
import { BackgroundGradients } from './BackgroundGradients';
import type { ExerciseResource } from '../types/api';
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
    return exercises.map((exercise: ExerciseResource) => ({
      id: exercise.id,
      name: exercise.name,
      restTime: `${Math.round(exercise.default_rest_sec / 60)}m`,
      muscleGroups: (exercise.muscle_groups || []).map((group: { name: string }) => group.name),
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
  return <div 
    className="fixed inset-0 z-[100]"
    style={{ backgroundColor: 'var(--color-bg-base)' }}
  >
        <BackgroundGradients />

      <div className="relative z-10 h-full flex flex-col max-w-md mx-auto overflow-y-auto">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex items-center justify-between p-6 pb-4">
          <h1 
            className="text-2xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            {mode === 'add' ? 'Select Exercise' : 'Swap Exercise'}
          </h1>
          <motion.button whileHover={{
          scale: 1.1,
          rotate: 90
        }} whileTap={{
          scale: 0.9
        }} onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => handleSearch(e.target.value)} 
              placeholder="Search exercises..." 
              className="w-full pl-12 pr-4 py-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all"
              style={{ 
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }} 
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>
        </motion.div>

        {/* Exercise List */}
        <div className="flex-1 px-6 pb-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} className="flex flex-col items-center justify-center py-12 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                >
                  <Search className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading exercises...</p>
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
            }} 
              onClick={() => handleSelectExercise(exercise)} 
              className="w-full flex items-center gap-4 p-4 border rounded-2xl transition-colors text-left"
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
                    {/* Exercise Image/Muscle Diagram */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
                      <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
                    </div>

                    {/* Exercise Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold mb-1 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                        {exercise.name}
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Rest: {exercise.restTime}
                      </p>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="flex-shrink-0 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                  </motion.button>)}
              </div> : <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} className="flex flex-col items-center justify-center py-12 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                >
                  <Search className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No exercises found</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Try a different search term
                </p>
              </motion.div>}
          </AnimatePresence>
        </div>
      </div>
    </div>;
}