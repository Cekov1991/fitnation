import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Loader2 } from 'lucide-react';
import { useExercises } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
import type { ExerciseResource } from '../types/api';
import { useModalTransition, useSlideTransition } from '../utils/animations';

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
  isLoading?: boolean;
}
export function ExercisePickerPage({
  mode,
  onClose,
  onSelectExercise,
  isLoading: isSelecting = false
}: ExercisePickerPageProps) {
  const modalTransition = useModalTransition();
  const slideTransition = useSlideTransition();
  const {
    data: exercises = [],
    isLoading
  } = useExercises();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
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
    if (isSelecting) return;
    setSelectedExerciseId(exercise.id);
    onSelectExercise(exercise);
    // Don't call onClose here - let the parent handle closing after async operations complete
  };
  return <div 
    className="fixed inset-0 z-[100]"
    style={{ backgroundColor: 'var(--color-bg-base)' }}
  >

      <div className="relative z-10 h-full flex flex-col max-w-md mx-auto overflow-y-auto">
        {/* Header */}
        <motion.div {...slideTransition} className="flex items-center justify-between p-6 pb-4">
          <h1 
            className="text-2xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            {mode === 'add' ? 'Select Exercise' : 'Swap Exercise'}
          </h1>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div {...modalTransition} className="px-6 pb-4">
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
            {isLoading ? <motion.div {...modalTransition} className="flex flex-col items-center justify-center py-12 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                >
                  <Search className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading exercises...</p>
              </motion.div> : filteredExercises.length > 0 ? <div className="space-y-2">
                {filteredExercises.map((exercise) => {
                  const isThisLoading = isSelecting && selectedExerciseId === exercise.id;
                  return (
                    <button 
                      key={exercise.id} 
                      {...modalTransition}
                      onClick={() => handleSelectExercise(exercise)} 
                      disabled={isSelecting}
                      className="w-full flex items-center gap-4 p-4 border rounded-2xl transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border-subtle)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelecting) {
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                      }}
                    >
                      {/* Exercise Image/Muscle Diagram */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden relative">
                        <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
                        {isThisLoading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
                          </div>
                        )}
                      </div>

                      {/* Exercise Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold mb-1 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                          {isThisLoading ? 'Adding...' : exercise.name}
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Rest: {exercise.restTime}
                        </p>
                      </div>

                      {/* Chevron or nothing when loading */}
                      {!isThisLoading && (
                        <ChevronRight className="flex-shrink-0 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      )}
                    </button>
                  );
                })}
              </div> : <motion.div {...modalTransition} className="flex flex-col items-center justify-center py-12 text-center">
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