import { Skeleton } from '../ui/Skeleton';

function WorkoutCardSkeleton() {
  return (
    <div
      className="border rounded-2xl p-4"
      style={{
        borderColor: 'var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)',
      }}
    >
      <div className="space-y-2 mb-3">
        <Skeleton className="h-5 w-44 max-w-full" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function BrowsableRoutineDetailPageSkeleton() {
  return (
    <div aria-busy aria-label="Loading routine">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <Skeleton className="h-8 flex-1 max-w-[220px]" />
      </div>
      <div
        className="border rounded-2xl overflow-hidden mb-6 min-h-[140px]"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Skeleton className="w-full h-[140px] rounded-none" />
        <div className="p-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-3 w-24 mb-4" />
      <div className="space-y-3">
        <WorkoutCardSkeleton />
        <WorkoutCardSkeleton />
      </div>
    </div>
  );
}
