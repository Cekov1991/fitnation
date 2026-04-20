import { motion } from 'framer-motion';
import { Clock, X, Check } from 'lucide-react';

interface WorkoutHeaderProps {
  formattedDuration: string;
  onFinish: () => void;
  onCancel: () => void;
  isCancelLoading?: boolean;
}

export function WorkoutHeader({ 
  formattedDuration, 
  onFinish,
  onCancel,
  isCancelLoading = false
}: WorkoutHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-6 pb-4"
    >
      {/* Cancel Button */}
      <button 
        onClick={onCancel} 
        disabled={isCancelLoading}
        className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ 
          color: '#ef4444',
        }}
      >
        <X className="w-4 h-4" />
        {isCancelLoading ? 'Cancelling...' : 'Cancel'}
      </button>

      {/* Timer - Centered */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {formattedDuration}
        </span>
      </div>

      {/* Finish Button */}
      <button 
        onClick={onFinish} 
        className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ 
          color: '#4ade80',
        }}
      >
        <Check className="w-4 h-4" />
        Finish
      </button>
    </motion.div>
  );
}
