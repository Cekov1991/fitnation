import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { LoadingContent } from '../ui';
import { BrowsableRoutineDetailPageSkeleton } from './BrowsableRoutineDetailPageSkeleton';
import { useBrowsableRoutine } from '../../hooks/useApi';
import { BrowsableRoutineDetailView } from './BrowsableRoutineDetailView';

interface BrowsableRoutineDetailPageProps {
  routineId: number;
  onBack: () => void;
}

export function BrowsableRoutineDetailPage({ routineId, onBack }: BrowsableRoutineDetailPageProps) {
  const {
    data: routine,
    isLoading,
    isError,
    error,
    refetch
  } = useBrowsableRoutine(routineId);

  const errorMessage = error instanceof Error ? error.message : error || 'Something went wrong';

  const backRow = (
    <div className="flex items-center gap-4 mb-8">
      <button
        type="button"
        onClick={onBack}
        className="p-2 rounded-full transition-colors"
        style={{ backgroundColor: 'var(--color-border-subtle)' }}
      >
        <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
      </button>
    </div>
  );

  if (isLoading || isError || !routine) {
    return (
      <div
        className="min-h-screen w-full pb-32"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <main className="relative z-10 max-w-md mx-auto px-4 py-8">
          <LoadingContent
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            loadingFallback={<BrowsableRoutineDetailPageSkeleton />}
            errorFallback={
              <>
                {backRow}
                <div
                  className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border"
                  style={{
                    backgroundColor: 'color-mix(in srgb, #ef4444 10%, transparent)',
                    borderColor: 'color-mix(in srgb, #ef4444 30%, transparent)',
                  }}
                >
                  <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                  <p className="text-sm text-red-400 text-center mb-4">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: 'color-mix(in srgb, #ef4444 20%, transparent)',
                      color: '#f87171',
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              </>
            }
          >
            {!routine && !isLoading && !isError ? (
              <>
                {backRow}
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Routine not found.</p>
                </div>
              </>
            ) : (
              <div />
            )}
          </LoadingContent>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <BrowsableRoutineDetailView
        routine={routine}
        onBack={onBack}
      />
    </div>
  );
}
