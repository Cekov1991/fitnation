import { Skeleton } from '../ui/Skeleton';

function LibraryProgramCardSkeleton() {
  return (
    <div
      className="w-full border rounded-2xl p-6 overflow-hidden relative min-h-[200px]"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="space-y-3 mb-4">
        <Skeleton className="h-7 w-52 max-w-full" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-4 w-48 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function ProgramLibraryPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading program library">
      {/* Matches ProgramLibraryPage header + info banner */}
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <Skeleton className="h-9 w-56 max-w-[min(240px,100%)] rounded-xl" />
      </div>
      <div
        className="flex gap-3 p-4 rounded-xl mb-6"
        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
      >
        <Skeleton className="w-5 h-5 rounded flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[92%]" />
          <Skeleton className="h-3 w-[70%]" />
        </div>
      </div>

      <LibraryProgramCardSkeleton />
      <LibraryProgramCardSkeleton />
      <LibraryProgramCardSkeleton />
    </div>
  );
}
