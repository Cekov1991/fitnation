import { Skeleton } from './ui/Skeleton';

interface ExercisePickerPageSkeletonProps {
  /** Hide trailing add/swap action column (browse mode). */
  isBrowse?: boolean;
  rowCount?: number;
}

function ExerciseRowSkeleton({ isBrowse }: { isBrowse: boolean }) {
  return (
    <div
      className="w-full flex items-center gap-4 p-2 border rounded-2xl"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2 py-1">
        <Skeleton className="h-4 w-[85%] max-w-[200px]" />
      </div>
      <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
      {!isBrowse && <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />}
    </div>
  );
}

export function ExercisePickerPageSkeleton({
  isBrowse = false,
  rowCount = 8,
}: ExercisePickerPageSkeletonProps) {
  return (
    <div className="space-y-2" aria-busy aria-label="Loading exercises">
      {Array.from({ length: rowCount }, (_, i) => (
        <ExerciseRowSkeleton key={i} isBrowse={isBrowse} />
      ))}
    </div>
  );
}
