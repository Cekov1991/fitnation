import { Skeleton } from '../ui/Skeleton';

function ExerciseRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4 rounded-xl p-2"
      style={{ backgroundColor: 'var(--color-bg-elevated)' }}
    >
      <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Program tab body only — use inside DashboardPage (below header + PlanTypeSwitcher). */
export function ProgramDashboardContentSkeleton() {
  return (
    <div className="pb-32" aria-busy aria-label="Loading program">
      {/* ProgramControls — horizontal scroll of controls */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1 mb-2">
        <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
        <Skeleton className="h-10 w-[7.5rem] rounded-xl flex-shrink-0" />
        <Skeleton className="h-10 w-[7.5rem] rounded-xl flex-shrink-0" />
        <Skeleton className="h-10 w-[5.5rem] rounded-xl flex-shrink-0" />
        <Skeleton className="h-10 w-[6.5rem] rounded-xl flex-shrink-0" />
        <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
      </div>

      {/* Week label */}
      <Skeleton className="h-5 w-40 mb-3" />

      {/* WorkoutTemplateSelector — day pills */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide mb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-full flex-shrink-0 mt-2" />
        ))}
      </div>

      {/* WorkoutCard */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>

        <div className="flex items-center gap-6 mb-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="h-px mb-4" style={{ backgroundColor: 'var(--color-border-subtle)' }} />

        <Skeleton className="h-3 w-28 mb-3" />
        <div className="space-y-3">
          <ExerciseRowSkeleton />
          <ExerciseRowSkeleton />
          <ExerciseRowSkeleton />
        </div>

        <Skeleton className="h-12 w-full rounded-xl mt-6" />
      </div>
    </div>
  );
}

/**
 * Full dashboard chrome + program tab — Suspense fallback while the dashboard chunk loads.
 * Matches DashboardPage layout (main, header, PlanTypeSwitcher, program body).
 */
export function ProgramDashboardSkeleton() {
  return (
    <main className="relative z-10 max-w-md mx-auto px-4 py-8" aria-busy aria-label="Loading dashboard">
      <header className="flex flex-col items-center mb-8">
        <Skeleton className="w-16 h-16 rounded-2xl mb-4" />
        <Skeleton className="h-9 w-48 rounded-xl mb-2" />
        <Skeleton className="h-4 w-44 rounded-lg" />
      </header>

      <div className="flex gap-2 justify-center mb-8">
        <Skeleton className="h-10 flex-1 max-w-[9rem] rounded-xl" />
        <Skeleton className="h-10 flex-1 max-w-[9rem] rounded-xl" />
      </div>

      <ProgramDashboardContentSkeleton />
    </main>
  );
}
