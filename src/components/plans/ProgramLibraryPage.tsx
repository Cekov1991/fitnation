import { useState } from 'react';
import { ArrowLeft, Calendar, Info } from 'lucide-react';
import { LoadingContent, ConfirmDialog } from '../ui';
import { useProgramLibrary, useCloneProgram } from '../../hooks/useApi';
import type { LibraryProgramResource } from '../../types/api';

interface ProgramLibraryPageProps {
  onBack: () => void;
}

export function ProgramLibraryPage({ onBack }: ProgramLibraryPageProps) {
  const [selectedProgram, setSelectedProgram] = useState<LibraryProgramResource | null>(null);
  const [showCloneConfirm, setShowCloneConfirm] = useState(false);

  const {
    data: libraryPrograms = [],
    isLoading,
    isError,
    error,
    refetch
  } = useProgramLibrary();

  const cloneProgram = useCloneProgram();

  const handleCloneClick = (program: LibraryProgramResource) => {
    setSelectedProgram(program);
    setShowCloneConfirm(true);
  };

  const handleCloneConfirm = async () => {
    if (!selectedProgram) return;
    try {
      await cloneProgram.mutateAsync(selectedProgram.id);
      setShowCloneConfirm(false);
      onBack(); // Navigate back to plans page after successful clone
    } catch (error) {
      console.error('Failed to clone program:', error);
    }
  };

  return (
    <div>
      <div>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
          <main className="relative z-10 max-w-md mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={onBack}
                className="p-2 rounded-full transition-colors"
                style={{ backgroundColor: 'var(--color-border-subtle)' }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
              </button>
              <h1 
                className="text-3xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
              >
                Program Library
              </h1>
            </div>

            {/* Info Banner */}
            <div 
              className="flex gap-3 p-4 rounded-xl mb-6"
              style={{ backgroundColor: 'var(--color-bg-elevated)' }}
            >
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Browse professionally designed programs from your gym. Clone a program to add it to your personal collection.
              </p>
            </div>

            {/* Library Programs */}
            <LoadingContent
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRetry={refetch}
            >
              <div className="space-y-4">
                {libraryPrograms.length === 0 ? (
                  <div 
                    className="text-center py-12 border rounded-2xl"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      No programs available in the library yet.
                    </p>
                  </div>
                ) : (
                  libraryPrograms.map((program: LibraryProgramResource) => (
                    <div
                      key={program.id}
                      className="border rounded-2xl p-6 transition-all hover:shadow-lg overflow-hidden relative min-h-[200px] bg-cover bg-top"
                      style={{ 
                        backgroundColor: program.cover_image ? undefined : 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border)',
                        ...(program.cover_image && {
                          backgroundImage: `url(${program.cover_image})`
                        })
                      }}
                    >
                      {program.cover_image && (
                        <div
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1 }}
                          aria-hidden
                        />
                      )}
                      <div className="relative z-10">
                        <div className="mb-4">
                          <h3 
                            className="text-xl font-bold mb-2"
                            style={{ color: program.cover_image ? 'white' : 'var(--color-text-primary)' }}
                          >
                            {program.name}
                          </h3>
                          <p 
                            className="text-sm leading-relaxed"
                            style={{ color: program.cover_image ? 'rgba(255,255,255,0.9)' : 'var(--color-text-secondary)' }}
                          >
                            {program.description || 'No description available.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                        <div 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
                          }}
                        >
                          <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'white' }} />
                          <span className="text-xs font-bold" style={{ color: 'white' }}>
                            {program.duration_weeks} WEEKS
                          </span>
                        </div>
                        {program.workout_templates && (
                          <div 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: 'white' }}>
                              {program.workout_templates.length} WORKOUTS
                            </span>
                          </div>
                        )}
                        </div>

                        <button
                          onClick={() => handleCloneClick(program)}
                          disabled={cloneProgram.isPending}
                          className="w-full py-3 rounded-xl font-bold transition-all"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            opacity: cloneProgram.isPending ? 0.7 : 1
                          }}
                        >
                          {cloneProgram.isPending ? 'Cloning...' : 'Clone Program'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </LoadingContent>
          </main>
        </div>
      </div>

      {/* Clone Confirmation */}
      <ConfirmDialog
        isOpen={showCloneConfirm}
        onClose={() => setShowCloneConfirm(false)}
        onConfirm={handleCloneConfirm}
        title="Clone Program"
        message={`Clone "${selectedProgram?.name}" to your programs? This will create a copy with all workouts and exercises.`}
        confirmText="Clone"
        variant="success"
        isLoading={cloneProgram.isPending}
      />
    </div>
  );
}
