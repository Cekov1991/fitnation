import React from 'react';
import { MoreVertical } from 'lucide-react';
import { ExerciseImage } from '../ExerciseImage';
import type { Exercise } from './types';

interface CurrentExerciseCardProps {
  exercise: Exercise;
  onOpenMenu: () => void;
}

export function CurrentExerciseCard({ exercise, onOpenMenu }: CurrentExerciseCardProps) {
  return (
    <div 
      className="relative flex items-start gap-4 p-4 border rounded-2xl"
      style={{ 
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden">
        <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
      </div>
      <div className="flex-1 text-left">
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {exercise.name}
        </h2>
        <span className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-bold text-cyan-400">
          {exercise.muscleGroup}
        </span>
      </div>

      <button
        onClick={onOpenMenu}
        className="flex-shrink-0 p-2 rounded-lg bg-elevated-hover"
      >
        <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
      </button>
    </div>
  );
}
