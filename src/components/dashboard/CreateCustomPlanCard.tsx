import { Plus } from 'lucide-react';

interface CreateCustomPlanCardProps {
  onClick: () => void;
}

export function CreateCustomPlanCard({ onClick }: CreateCustomPlanCardProps) {
  return (
    <button 
      onClick={onClick}
      className="rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center h-full min-h-[140px] w-full border-2 border-dashed transition-all group"
      style={{ 
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors group-hover:bg-white"
        style={{ backgroundColor: 'var(--color-border-subtle)' }}
      >
        <Plus 
          size={24} 
          style={{ 
            color: 'var(--color-text-secondary)'
          }}
          className="group-hover:transition-colors"
        />
      </div>
      <span 
        className="font-medium text-sm transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Create New
      </span>
    </button>
  );
}
