import { Skeleton } from './ui/Skeleton';

/** Matches WeeklyCalendar outer shell (week strip + day grid + detail panel). */
export function ProgressCalendarSkeleton() {
  return (
    <div
      className="mb-6 w-full rounded-3xl border p-6"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
      }}
      aria-busy
      aria-label="Loading calendar"
    >
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <Skeleton className="h-6 flex-1 max-w-[200px] mx-auto" />
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      </div>
      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-4 w-5" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        ))}
      </div>
      <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <Skeleton className="h-4 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-[72px] w-full rounded-2xl" />
          <Skeleton className="h-[72px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-9 w-24 mb-1" />
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-3 w-48 max-w-full" />
    </div>
  );
}

/** Three MetricCard-shaped placeholders. */
export function ProgressMetricsSkeleton() {
  return (
    <div className="mb-8 space-y-4" aria-busy aria-label="Loading metrics">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>
  );
}
