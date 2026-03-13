import { ArrowLeft } from 'lucide-react';
import { LoadingContent } from '../ui';
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

  if (isLoading || isError || !routine) {
    return (
      <div
        className="min-h-screen w-full pb-32"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <main className="relative z-10 max-w-md mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: 'var(--color-border-subtle)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
            </button>
          </div>
          <LoadingContent
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
          >
            <div />
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
