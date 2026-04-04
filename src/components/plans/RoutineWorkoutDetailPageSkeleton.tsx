import { Skeleton } from '../ui/Skeleton';

function ExerciseRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4 p-3 border rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function RoutineWorkoutDetailPageSkeleton() {
  return (
    <div aria-busy aria-label="Loading workout">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <Skeleton className="h-8 flex-1 max-w-[220px] rounded-lg" />
      </div>
      <Skeleton className="h-3 w-20 mb-4" />
      <div className="space-y-3">
        <ExerciseRowSkeleton />
        <ExerciseRowSkeleton />
        <ExerciseRowSkeleton />
      </div>
    </div>
  );
}
