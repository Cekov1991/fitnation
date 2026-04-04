import { Skeleton } from './ui/Skeleton';

function PreviewExerciseRowSkeleton() {
  return (
    <div
      className="w-full flex items-center gap-4 p-1 border rounded-2xl"
      style={{
        borderColor: 'var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)',
      }}
    >
      <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-[80%] max-w-[200px]" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
    </div>
  );
}

export function WorkoutPreviewPageSkeleton() {
  return (
    <main className="relative z-10 max-w-md mx-auto px-4 py-8" aria-busy aria-label="Loading workout preview">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div>
          <Skeleton className="h-4 w-40 mb-3" />
          <div className="space-y-3">
            <PreviewExerciseRowSkeleton />
            <PreviewExerciseRowSkeleton />
            <PreviewExerciseRowSkeleton />
            <PreviewExerciseRowSkeleton />
          </div>
          <div
            className="w-full py-6 rounded-2xl mt-4 border-2 border-dashed flex items-center justify-center gap-3"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
            }}
          >
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </div>
    </main>
  );
}
