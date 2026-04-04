import { Skeleton } from './ui/Skeleton';

function ExerciseRowSkeleton() {
  return (
    <div
      className="w-full flex items-center gap-4 p-1 border rounded-2xl"
      style={{
        borderColor: 'var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)',
      }}
    >
      <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-[85%] max-w-[200px]" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
    </div>
  );
}

export function EditWorkoutPageSkeleton() {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading workout">
      {[1, 2, 3, 4].map((i) => (
        <ExerciseRowSkeleton key={i} />
      ))}
    </div>
  );
}
