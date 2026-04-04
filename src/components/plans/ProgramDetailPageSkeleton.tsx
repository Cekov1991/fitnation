import { Skeleton } from '../ui/Skeleton';

function WeekCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-3 pl-5 pt-5 border-2 overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div className="flex items-center mb-4">
        <Skeleton className="w-1 h-6 rounded-full mr-3" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

export function ProgramDetailPageSkeleton() {
  return (
    <div aria-busy aria-label="Loading program">
      {/* Matches ProgramDetailPage header (back + title) */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <Skeleton className="h-8 w-48 max-w-[min(200px,100%)] rounded-lg" />
      </div>

      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Skeleton className="w-full min-h-[140px] rounded-none" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-7 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-48 max-w-full" />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className="absolute left-[9px] top-8 bottom-8 w-0.5"
          style={{ backgroundColor: 'var(--color-border)' }}
        />
        <div className="space-y-4 relative">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start">
              <div className="relative z-10 mt-6 mr-4">
                <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
              </div>
              <div className="flex-1 min-w-0 max-w-full">
                <WeekCardSkeleton />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
