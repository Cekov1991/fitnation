import { Skeleton } from '../ui/Skeleton';

/** Active program card with optional cover strip. */
export function ProgramPlansActiveSectionSkeleton() {
  return (
    <div aria-busy aria-label="Loading active program">
      <div
        className="relative border rounded-3xl shadow-xl overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
          borderColor: 'var(--color-border)',
        }}
      >
        <Skeleton className="w-full min-h-[140px] rounded-none rounded-t-3xl" />
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-full max-w-[260px]" />
              <Skeleton className="h-4 w-52 max-w-full" />
            </div>
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function InactiveProgramCardSkeleton() {
  return (
    <div
      className="relative border rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <Skeleton className="w-full min-h-[140px] rounded-none rounded-t-2xl" />
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-full max-w-[240px]" />
          </div>
          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        </div>
        <Skeleton className="h-3 w-24 mb-4" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Inactive programs list. */
export function ProgramPlansAllProgramsSkeleton() {
  return (
    <div className="space-y-4 mb-6" aria-busy aria-label="Loading programs">
      <InactiveProgramCardSkeleton />
      <InactiveProgramCardSkeleton />
    </div>
  );
}
