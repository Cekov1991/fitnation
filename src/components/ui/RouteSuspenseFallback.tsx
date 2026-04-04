import { Skeleton } from './Skeleton';

/**
 * Shown by React Suspense while a lazy route chunk is loading.
 * Matches skeleton styling used after mount (data fetching) so navigation
 * does not flash a spinner then a skeleton.
 */
export function RouteSuspenseFallback() {
  return (
    <div
      className="min-h-screen w-full pb-24"
      style={{ backgroundColor: 'var(--color-bg-base)' }}
      aria-busy
      aria-label="Loading page"
    >
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    </div>
  );
}
