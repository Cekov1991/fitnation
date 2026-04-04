import { Skeleton } from '../ui/Skeleton';

function RoutineCardSkeleton() {
  return (
    <div
      className="w-[200px] min-w-[200px] flex-shrink-0 rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: 'var(--color-bg-surface)' }}
    >
      <Skeleton className="w-full h-28 rounded-none rounded-t-2xl" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function WorkoutCardSmallSkeleton() {
  return (
    <div
      className="w-[180px] min-w-[180px] flex-shrink-0 rounded-2xl p-5 shadow-sm flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-surface)' }}
    >
      <Skeleton className="w-10 h-10 rounded-full mb-4" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-4/5 mb-3" />
      <Skeleton className="h-3 w-full mb-4" />
      <Skeleton className="h-10 w-full rounded-xl mt-auto" />
    </div>
  );
}

export function CustomPlansDashboardSkeleton() {
  return (
    <div className="pb-24" aria-busy aria-label="Loading plans">
      <div className="space-y-8">
        {/* AIGeneratorCard */}
        <div
          className="rounded-2xl p-6 shadow-lg mb-8"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4 rounded-md bg-white/20" />
            <Skeleton className="h-3 w-28 rounded-md bg-white/20" />
          </div>
          <Skeleton className="h-7 w-4/5 max-w-xs mb-2 rounded-lg bg-white/20" />
          <Skeleton className="h-4 w-full max-w-sm mb-2 rounded-lg bg-white/20" />
          <Skeleton className="h-4 w-3/4 max-w-sm mb-6 rounded-lg bg-white/20" />
          <Skeleton className="h-11 w-full max-w-xs rounded-xl bg-white/25" />
        </div>

        {/* Recomended Workouts row */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            <RoutineCardSkeleton />
            <RoutineCardSkeleton />
            <RoutineCardSkeleton />
          </div>
        </div>

        {/* My Custom Plans row */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            <WorkoutCardSmallSkeleton />
            <WorkoutCardSmallSkeleton />
          </div>
        </div>

        {/* QuickStartCard */}
        <div
          className="mb-8 rounded-2xl p-6 border"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-12 w-full rounded-xl mt-6" />
        </div>
      </div>
    </div>
  );
}
