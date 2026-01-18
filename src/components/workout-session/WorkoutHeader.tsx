import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface WorkoutHeaderProps {
  formattedDuration: string;
  onExit: () => void;
  onOpenOptions: () => void;
}

export function WorkoutHeader({ 
  formattedDuration, 
  onExit, 
  onOpenOptions 
}: WorkoutHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-6 pb-4"
    >
      <button 
        onClick={onExit} 
        className="text-sm font-semibold transition-colors text-hover-primary"
      >
        Exit
      </button>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {formattedDuration}
        </span>
      </div>
      <button 
        onClick={onOpenOptions} 
        className="text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ color: 'var(--color-primary)' }}
      >
        Options
      </button>
    </motion.div>
  );
}
