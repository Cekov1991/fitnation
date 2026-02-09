import { motion } from 'framer-motion';
import { Plus, MoreVertical } from 'lucide-react';
import type { Set } from './types';
import { formatWeight } from './utils';
import { SetLogCard } from './SetLogCard';
import { SetEditCard } from './SetEditCard';

interface SetsListProps {
  sets: Set[];
  currentSet: Set | undefined;
  editingSetId: string | null;
  editingWeight: number | null;
  editingReps: number | null;
  setEditingWeight: (w: number | null) => void;
  setEditingReps: (r: number | null) => void;
  onOpenSetMenu: (setId: string) => void;
  onAddSet: () => void;
  onLogSet: () => void;
  onStartTimer?: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isRestTimerActive: boolean;
  restSeconds: number | null;
  allowWeightLogging: boolean;
  isAddSetLoading?: boolean;
}

export function SetsList({
  sets,
  currentSet,
  editingSetId,
  editingWeight,
  editingReps,
  setEditingWeight,
  setEditingReps,
  onOpenSetMenu,
  onAddSet,
  onLogSet,
  onStartTimer,
  onSaveEdit,
  onCancelEdit,
  isRestTimerActive,
  restSeconds,
  allowWeightLogging,
  isAddSetLoading = false,
}: SetsListProps) {
  return (
    <div className="space-y-2">
      {sets.map((set, index) => {
        const isCurrentLoggingSet = currentSet?.id === set.id && !editingSetId;
        const isCurrentEditingSet = editingSetId === set.id;

        // Render SetLogCard inline for the current set being logged
        if (isCurrentLoggingSet) {
          return (
            <SetLogCard
              key={set.id}
              weight={editingWeight}
              reps={editingReps}
              defaultWeight={set.weight}
              defaultReps={set.reps}
              onWeightChange={setEditingWeight}
              onRepsChange={setEditingReps}
              onLogSet={onLogSet}
              onStartTimer={onStartTimer}
              setNumber={index + 1}
              showTimerButton={!isRestTimerActive && !!restSeconds}
              allowWeightLogging={allowWeightLogging}
            />
          );
        }

        // Render SetEditCard inline for the set being edited
        if (isCurrentEditingSet && editingWeight !== null && editingReps !== null) {
          return (
            <SetEditCard
              key={set.id}
              weight={editingWeight}
              reps={editingReps}
              onWeightChange={setEditingWeight}
              onRepsChange={setEditingReps}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
              setNumber={index + 1}
              allowWeightLogging={allowWeightLogging}
            />
          );
        }

        // Regular set row (completed or future)
        return (
          <motion.div
            key={set.id}
            className={`flex items-center justify-between p-4 rounded-xl transition-colors border ${
              set.completed ? 'border-2 border-green-500' : ''
            }`}
            style={!set.completed ? {
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
              {allowWeightLogging && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {set.completed ? formatWeight(set.weight) : '--'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>kg</span>
                  </div>
                  <span style={{ color: 'var(--color-border)' }}>×</span>
                </>
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {set.completed ? set.reps : '--'}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>reps</span>
              </div>
            </div>

            <button
              onClick={() => onOpenSetMenu(set.id)}
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-surface)' }}
            >
              <MoreVertical className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </motion.div>
        );
      })}

      {/* Add Set Button */}
      {!editingSetId && (
        <button
          onClick={onAddSet}
          disabled={isAddSetLoading}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl transition-colors border active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
            WebkitTapHighlightColor: 'transparent'
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
