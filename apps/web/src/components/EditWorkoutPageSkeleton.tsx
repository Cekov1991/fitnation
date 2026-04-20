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
    <div aria-busy aria-label="Loading workout">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <Skeleton className="h-9 flex-1 max-w-[min(280px,100%)] rounded-xl" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>
      <div className="space-y-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <ExerciseRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
