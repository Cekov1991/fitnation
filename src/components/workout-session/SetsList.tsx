import { motion } from 'framer-motion';
import { Plus, MoreVertical } from 'lucide-react';
import type { Set } from './types';
import { formatWeight } from './utils';
import { useModalTransition } from '../../utils/animations';

interface SetsListProps {
  sets: Set[];
  editingSetId: string | null;
  onOpenSetMenu: (setId: string) => void;
  onAddSet: () => void;
  isAddSetLoading?: boolean;
}

export function SetsList({
  sets,
  editingSetId,
  onOpenSetMenu,
  onAddSet,
  isAddSetLoading = false,
}: SetsListProps) {
  const modalTransition = useModalTransition();
  return (
    <div className="space-y-2">
      {sets.map((set, index) => (
        <motion.div
          key={set.id}
        {...modalTransition}
          className={`flex items-center justify-between p-4 rounded-xl transition-colors border ${
            editingSetId === set.id 
              ? 'bg-orange-500/20 border-2 border-orange-500/40' 
              : set.completed 
                ? 'border border-2 border-green-500' 
                : ''
          }`}
          style={!editingSetId && !set.completed ? {
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border-subtle)'
          } : {
            backgroundColor: 'var(--color-bg-elevated)',
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
              Set {index + 1}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {set.completed ? formatWeight(set.weight) : '--'}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>kg</span>
            </div>
            <span style={{ color: 'var(--color-border)' }}>×</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {set.completed ? set.reps : '--'}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>reps</span>
            </div>
          </div>

          <button
            onClick={() => onOpenSetMenu(set.id)}
            className="p-2 rounded-lg bg-elevated-hover"
          >
            <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </motion.div>
      ))}

      {/* Add Set Button */}
      {!editingSetId && (
        <button
          onClick={onAddSet}
          disabled={isAddSetLoading}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl transition-colors border disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
          }}
        >
          {isAddSetLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-t-transparent border-current rounded-full animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                Adding...
              </span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                Add Set
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
