import { ArrowLeft } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';

function ExerciseBlockSkeleton() {
  return (
    <div
      className="rounded-lg p-4 border space-y-3"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Skeleton className="w-11 h-11 rounded-lg flex-shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[180px]" />
        </div>
        <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

export interface SessionDetailPageSkeletonProps {
  /** Real back control while loading (recommended so users can leave). */
  onBack?: () => void;
}

export function SessionDetailPageSkeleton({ onBack }: SessionDetailPageSkeletonProps) {
  return (
    <>
      <header
        className="sticky top-0 z-20 border-b px-4 py-4 flex items-center gap-3"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          borderColor: 'var(--color-border)',
        }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        ) : (
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        )}
        <Skeleton className="h-7 flex-1 max-w-[180px] rounded-lg" aria-hidden />
      </header>

      <div className="px-4 py-6 space-y-6" aria-busy aria-label="Loading session">
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48 max-w-full" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full flex-shrink-0" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl p-3 border"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <Skeleton className="h-4 w-4 mb-2 rounded" />
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>

        <div
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="space-y-4">
            <ExerciseBlockSkeleton />
            <ExerciseBlockSkeleton />
            <ExerciseBlockSkeleton />
          </div>
        </div>
      </div>
    </>
  );
}
