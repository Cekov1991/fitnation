import { Skeleton } from '../ui/Skeleton';

function WorkoutRowSkeleton() {
  return (
    <div
      className="flex items-center justify-between p-4 border rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="w-6 h-6 rounded-full" />
    </div>
  );
}

/** Active plan card + workout list (CustomPlansView top section). */
export function CustomPlansActivePlanSkeleton() {
  return (
    <div aria-busy aria-label="Loading active plan">
      <div
        className="relative bg-gradient-to-br border rounded-3xl p-6 shadow-xl"
        style={{
          background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full max-w-[240px]" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        </div>
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-6" />
        <div className="space-y-3">
          <WorkoutRowSkeleton />
          <WorkoutRowSkeleton />
          <WorkoutRowSkeleton />
        </div>
      </div>
    </div>
  );
}

function PlanCardSkeleton() {
  return (
    <div
      className="relative border rounded-2xl p-6"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="w-9 h-9 rounded-full" />
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4" />
      <div className="space-y-2">
        <WorkoutRowSkeleton />
        <WorkoutRowSkeleton />
      </div>
    </div>
  );
}

/** All plans list (CustomPlansView bottom section). */
export function CustomPlansAllPlansSkeleton() {
  return (
    <div className="space-y-4 mb-6" aria-busy aria-label="Loading plans">
      <PlanCardSkeleton />
      <PlanCardSkeleton />
    </div>
  );
}
