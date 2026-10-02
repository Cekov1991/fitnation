import { Zap, ChevronRight } from 'lucide-react';

interface WorkoutGeneratorCardProps {
  onGenerate: () => void;
}

export function WorkoutGeneratorCard({ onGenerate }: WorkoutGeneratorCardProps) {
  return (
    <div 
      className="rounded-2xl p-6 shadow-lg text-white relative overflow-hidden mb-8"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      />

      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-3">
          <Zap 
            size={16} 
            style={{ color: 'var(--color-secondary)', fill: 'var(--color-secondary)' }}
          />
          <span 
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: 'var(--color-secondary)' }}
          >
            Fit Nation Engine
          </span>
        </div>

        <h3 className="text-xl font-bold mb-2">Not sure what to do?</h3>
        <p 
          className="text-sm mb-6 leading-relaxed opacity-80"
          style={{ color: 'var(--color-text-button)' }}
        >
          Let Fit Nation build a workout around your recovery and goals.
        </p>

        <button 
          onClick={onGenerate}
          className="w-full py-3 px-4 rounded-xl border flex items-center justify-between transition-colors group"
          style={{ 
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <span className="font-semibold text-sm">Generate Smart Workout</span>
          <ChevronRight
            size={16}
            className="opacity-70 group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
  );
}
