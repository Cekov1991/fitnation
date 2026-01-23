import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ExerciseImage } from '../ExerciseImage';
import type { Exercise, ExerciseCompletionStatus } from './types';
import { useModalTransition } from '../../utils/animations';

interface ExerciseNavTabsProps {
  exercises: Exercise[];
  currentIndex: number;
  onSelectExercise: (index: number) => void;
  getCompletionStatus: (exercise: Exercise) => ExerciseCompletionStatus;
}

export function ExerciseNavTabs({
  exercises,
  currentIndex,
  onSelectExercise,
  getCompletionStatus,
}: ExerciseNavTabsProps) {
  const modalTransition = useModalTransition();
  const tabRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());
  
  // Auto-scroll to active tab when currentIndex changes
  useEffect(() => {
    const activeButton = tabRefs.current.get(currentIndex);
    if (activeButton) {
      // Use setTimeout to ensure DOM has updated after exercises array changes
      setTimeout(() => {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }, 100);
    }
    
    // Cleanup: remove refs for exercises that no longer exist
    const currentIndices = new Set(exercises.map((_, idx) => idx));
    tabRefs.current.forEach((_, index) => {
      if (!currentIndices.has(index)) {
        tabRefs.current.delete(index);
      }
    });
  }, [currentIndex, exercises.length]);
  
  if (exercises.length === 0) return null;

  return (
    <motion.div
    {...modalTransition}
      className="px-6 pb-4"
    >
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {exercises.map((exercise, index) => {
          const status = getCompletionStatus(exercise);
          const isActive = index === currentIndex;
          
          return (
            <button
              key={exercise.id}
              ref={(el) => { tabRefs.current.set(index, el); }}
              onClick={() => onSelectExercise(index)}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                isActive 
                  ? 'shadow-lg' 
                  : status.isComplete 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'border'
              }`}
              style={isActive ? {
                background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 20%, transparent)'
              } : !status.isComplete ? {
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-subtle)'
              } : {}}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold" style={{ 
                  color: isActive ? 'white' : 'var(--color-text-secondary)' 
                }}>
                  {exercise.name.length > 20 ? `${exercise.name.substring(0, 20)}...` : exercise.name}
                </h3>
                <p className="text-xs" style={{ 
                  color: isActive ? 'rgba(255, 255, 255, 0.9)' : '#6b7280' 
                }}>
                  {status.completed}/{status.total} sets
                </p>
              </div>
              {status.isComplete && (
                <div className="flex-shrink-0 p-1 bg-green-500/20 rounded-full">
                  <Check className="text-green-400 w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
