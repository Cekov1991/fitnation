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
      <LibraryProgramCardSkeleton />
      <LibraryProgramCardSkeleton />
      <LibraryProgramCardSkeleton />
    </div>
  );
}
