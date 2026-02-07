import { Play } from 'lucide-react';

interface QuickStartCardProps {
  onStartBlankSession: () => void;
}

export function QuickStartCard({ onStartBlankSession }: QuickStartCardProps) {
  return (
    <div 
      className="mb-8 rounded-2xl p-6 border relative overflow-hidden"
      style={{ 
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 
            className="text-xl font-bold"
            style={{ color: 'var(--color-primary)' }}
          >
            Quick Start
          </h2>
          <p 
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Start a blank session without a plan
          </p>
        </div>
      </div>

      <button 
        onClick={onStartBlankSession}
        className="w-full mt-6 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-sm active:scale-[0.98] transition-transform"
        style={{ 
          background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))',
          color: 'var(--color-text-button)'
        }}
      >
        <Play size={18} className="mr-2" style={{ fill: 'var(--color-text-button)' }} />
        Start Blank Session
      </button>
    </div>
  );
}
