import { useState } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Check, RefreshCw, X, Edit2, Plus, Clock, Target, Dumbbell, Activity, Info } from 'lucide-react';
import { ExerciseImage } from './ExerciseImage';
import { LoadingButton } from './ui/LoadingButton';
import { LoadingContent } from './ui/LoadingContent';
import { BackgroundGradients } from './BackgroundGradients';
import { ExerciseEditMenu } from './ExerciseEditMenu';
import { EditSetsRepsModal } from './EditSetsRepsModal';
import { ExercisePickerPage } from './ExercisePickerPage';
import {
  useConfirmDraftSession,
  useRegenerateDraftSession,
  useRemoveSessionExercise,
  useCancelSession,
  useSession,
  useUpdateSessionExercise,
  useAddSessionExercise,
  useReorderSessionExercises
} from '../hooks/useApi';
import { SessionExerciseDetail, GenerateWorkoutInput } from '../types/api';

interface LocationState {
  generationParams?: GenerateWorkoutInput;
}

export function WorkoutPreviewPage() {
  const history = useHistory();
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation<LocationState>();
  
  // Get generation params from route state (passed from GenerateWorkoutPage)
  const [generationParams] = useState<GenerateWorkoutInput | undefined>(
    location.state?.generationParams
  );
  
  const queryClient = useQueryClient();
  const confirmDraft = useConfirmDraftSession();
  const regenerateDraft = useRegenerateDraftSession();
  const removeExercise = useRemoveSessionExercise();
  const cancelSession = useCancelSession();
  const updateExercise = useUpdateSessionExercise();
  const addExercise = useAddSessionExercise();
  const reorderSessionExercises = useReorderSessionExercises();

  const { data: draftSession, isLoading } = useSession(Number(sessionId));

  // Exercise management state
  const [selectedExercise, setSelectedExercise] = useState<SessionExerciseDetail | null>(null);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isEditSetsRepsOpen, setIsEditSetsRepsOpen] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exercisePickerMode, setExercisePickerMode] = useState<'add' | 'swap'>('add');

  const handleConfirm = async () => {
    if (!sessionId) return;

    try {
      await confirmDraft.mutateAsync(Number(sessionId));
      history.push(`/session/${sessionId}`);
    } catch (error) {
      console.error('Failed to confirm workout:', error);
    }
  };

  const handleRegenerate = async () => {
    if (!sessionId) return;

    try {
      const response = await regenerateDraft.mutateAsync({
        sessionId: Number(sessionId),
        data: generationParams || {} // Use same parameters as original generation
      });
      const newSessionId = response.data?.id;
      if (newSessionId) {
        // Pass generation params to the new preview page
        history.replace(`/generate-workout/preview/${newSessionId}`, { generationParams });
      }
    } catch (error) {
      console.error('Failed to regenerate workout:', error);
    }
  };

  const handleViewExerciseDetail = (exerciseName: string) => {
    history.push(`/exercises/${encodeURIComponent(exerciseName)}`, {
      from: 'preview',
      sessionId: sessionId
    });
  };

  const handleCancel = async () => {
    if (!sessionId) return;

    try {
      await cancelSession.mutateAsync(Number(sessionId));
      history.push('/generate-workout');
    } catch (error) {
      console.error('Failed to cancel workout:', error);
    }
  };

  const handleBack = () => {
    history.push('/generate-workout');
  };

  // Exercise management handlers
  const handleEditClick = (exerciseDetail: SessionExerciseDetail) => {
    setSelectedExercise(exerciseDetail);
    setIsEditMenuOpen(true);
  };

  const handleEditSetsReps = () => {
    setIsEditSetsRepsOpen(true);
  };

  const handleSaveSetsReps = async (sets: number, reps: string, weight: string) => {
    if (!selectedExercise || !sessionId) return;

    try {
      const repsNum = parseInt(reps.split('-')[0]) || 0;
      const weightNum = parseFloat(weight.replace(' kg', '')) || 0;

      await updateExercise.mutateAsync({
        sessionId: Number(sessionId),
        exerciseId: selectedExercise.session_exercise.id,
        data: {
          target_sets: sets,
          target_reps: repsNum,
          target_weight: weightNum
        }
      });
      setIsEditSetsRepsOpen(false);
      setIsEditMenuOpen(false);
    } catch (error) {
      console.error('Failed to update exercise:', error);
    }
  };

  const handleSwap = () => {
    setIsEditMenuOpen(false);
    setExercisePickerMode('swap');
    setShowExercisePicker(true);
  };

  const handleAddExercise = () => {
    setExercisePickerMode('add');
    setShowExercisePicker(true);
  };

  const handleSelectExercise = async (exercise: { id: number; name: string; restTime: string; muscleGroups: string[]; imageUrl: string }) => {
    if (!sessionId) return;

    try {
      if (exercisePickerMode === 'add') {
        // Add new exercise to the workout
        await addExercise.mutateAsync({
          sessionId: Number(sessionId),
          data: {
            exercise_id: exercise.id,
            target_sets: 3,
            target_reps: 10,
            target_weight: 0
          }
        });
        setShowExercisePicker(false);
      } else if (exercisePickerMode === 'swap' && selectedExercise) {
        const sessionIdNum = Number(sessionId);
        const swapIndex =
          draftSession?.exercises?.findIndex(
            (ex: SessionExerciseDetail) =>
              ex.session_exercise.id === selectedExercise.session_exercise.id
          ) ?? -1;

        await removeExercise.mutateAsync({
          sessionId: sessionIdNum,
          exerciseId: selectedExercise.session_exercise.id
        });
        await addExercise.mutateAsync({
          sessionId: sessionIdNum,
          data: {
            exercise_id: exercise.id,
            order: swapIndex >= 0 ? swapIndex : undefined,
            target_sets: selectedExercise.session_exercise.target_sets || 3,
            target_reps: selectedExercise.session_exercise.target_reps || 10,
            target_weight: selectedExercise.session_exercise.target_weight || 0
          }
        });

        if (swapIndex >= 0) {
          await queryClient.refetchQueries({ queryKey: ['sessions', sessionIdNum] });
          const session = queryClient.getQueryData<{
            exercises?: Array<{ session_exercise: { id: number; exercise_id: number } }>;
          }>(['sessions', sessionIdNum]);
          const sessionExercises = session?.exercises ?? [];
          const newEntry = sessionExercises.find((ex) => ex.session_exercise.exercise_id === exercise.id);
          const newSessionExerciseId = newEntry?.session_exercise.id;
          const currentOrder = sessionExercises.map((ex) => ex.session_exercise.id);

          if (newSessionExerciseId != null && currentOrder.length > 1) {
            const newIndex = currentOrder.indexOf(newSessionExerciseId);
            if (newIndex !== -1 && newIndex !== swapIndex) {
              const reorderIds = [...currentOrder];
              reorderIds.splice(newIndex, 1);
              reorderIds.splice(swapIndex, 0, newSessionExerciseId);
              await reorderSessionExercises.mutateAsync({
                sessionId: sessionIdNum,
                exerciseIds: reorderIds
              });
            }
          }
        }

        setShowExercisePicker(false);
        setIsEditMenuOpen(false);
      }
    } catch (error) {
      console.error('Failed to add/swap exercise:', error);
    }
  };

  const handleRemoveExerciseFromMenu = async () => {
    if (!selectedExercise || !sessionId) return;

    try {
      await removeExercise.mutateAsync({
        sessionId: Number(sessionId),
        exerciseId: selectedExercise.session_exercise.id
      });
      setIsEditMenuOpen(false);
    } catch (error) {
      console.error('Failed to remove exercise:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <BackgroundGradients />
        <LoadingContent
          isLoading
          loadingFallback={
            <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
              Loading workout preview...
            </div>
          }
          children={null}
        />
      </div>
    );
  }

  if (!draftSession) {
    return (
      <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <BackgroundGradients />
        <main className="relative z-10 max-w-md mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p style={{ color: 'var(--color-text-secondary)' }}>Draft session not found</p>
            <button
              onClick={handleBack}
              className="mt-4 px-6 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              Back to Generate
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Derive summary data from generation params or from exercises
  const durationMinutes = generationParams?.duration_minutes ?? null;
  const durationLabel = durationMinutes != null ? `${durationMinutes} min` : null;
  const targets =
    generationParams?.target_regions?.length
      ? generationParams.target_regions
      : Array.from(
          new Set(
            (draftSession.exercises ?? [])
              .map((e: SessionExerciseDetail) => e.session_exercise?.exercise?.target_region?.name)
              .filter(Boolean) as string[]
          )
        );
  const equipment =
    generationParams?.equipment_types?.length
      ? generationParams.equipment_types
      : Array.from(
          new Set(
            (draftSession.exercises ?? [])
              .map((e: SessionExerciseDetail) => e.session_exercise?.exercise?.equipment_type?.name)
              .filter(Boolean) as string[]
          )
        );
  const movements =
    generationParams?.movement_patterns?.length
      ? generationParams.movement_patterns
      : Array.from(
          new Set(
            (draftSession.exercises ?? [])
              .map((e: SessionExerciseDetail) => e.session_exercise?.exercise?.movement_pattern?.name)
              .filter(Boolean) as string[]
          )
        );
  const note = draftSession.rationale ?? null;

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <BackgroundGradients />
      <main className="relative z-10 max-w-md mx-auto px-4 py-8 flex justify-center items-start">
        <div className="w-full space-y-6">
          {/* Summary card (design: WorkoutSummary) */}
          <div
            className="w-full mx-auto rounded-2xl shadow-sm border overflow-hidden"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            {/* Header */}
            <div
              className="p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  Workout Preview
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Review and adjust your Fit Nation's Engine workout
                </p>
              </div>
              {durationLabel && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm self-start sm:self-center shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Clock className="w-4 h-4" />
                  <span>{durationLabel}</span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-8">
              {/* Target Focus */}
              {(targets.length > 0) && (
                <section>
                  <div className="flex items-center gap-2 mb-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    <Target className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    <h3>Target Focus</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {targets.map((target) => (
                      <span
                        key={target}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          color: 'var(--color-text-secondary)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        {target}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Equipment */}
                <section>
                  <div className="flex items-center gap-2 mb-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    <Dumbbell className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    <h3>Equipment Needed</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(equipment.length > 0 ? equipment : ['—']).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-sm border transition-colors cursor-default"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          color: 'var(--color-text-secondary)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Movement Patterns */}
                <section>
                  <div className="flex items-center gap-2 mb-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    <Activity className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    <h3>Movement Patterns</h3>
                  </div>
                  <ul className="grid grid-cols-1 gap-2">
                    {(movements.length > 0 ? movements : ['—']).map((movement) => (
                      <li key={movement} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <div
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        />
                        {movement}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Exercise List */}
              <div>
                <div className="flex items-center gap-2 mb-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  <h3>Exercises ({draftSession.exercises?.length || 0})</h3>
                </div>
                <div className="space-y-3">
                  {draftSession.exercises?.map((exerciseDetail: SessionExerciseDetail) => {
                    const sessionExercise = exerciseDetail.session_exercise;
                    const exercise = sessionExercise?.exercise;
                    if (!exercise) return null;

                    const sets = sessionExercise.target_sets ?? 0;
                    const reps = sessionExercise.target_reps ?? 0;
                    const weight = sessionExercise.target_weight ?? 0;
                    const hasWeight = weight > 0;
                    const specs = hasWeight
                      ? `${sets} sets · ${reps} reps · ${weight} kg`
                      : `${sets} sets · ${reps} reps`;

                    return (
                      <div
                        key={sessionExercise.id}
                        className="w-full flex items-center gap-4 p-4 border rounded-2xl transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.99]"
                        style={{
                          borderColor: 'var(--color-border-subtle)',
                          backgroundColor: 'var(--color-bg-surface)',
                        }}
                        onClick={() => handleViewExerciseDetail(exercise.name)}
                      >
                        <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden relative ring-1 ring-black/5">
                          <ExerciseImage
                            src={exercise.image}
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-bold mb-1.5 leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                            {exercise.name}
                          </h3>
                          <p className="text-sm font-medium tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                            {specs}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(exerciseDetail);
                          }}
                          className="flex-shrink-0 p-2.5 rounded-full transition-colors hover:opacity-80"
                          style={{ color: 'var(--color-text-muted)' }}
                          title="Edit exercise"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleAddExercise}
                  className="w-full py-6 border-2 border-dashed rounded-2xl transition-all group mt-5 hover:opacity-90"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--color-primary) 35%, transparent)',
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 4%, transparent)',
                  }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className="p-2 rounded-xl transition-transform group-hover:scale-105"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
                    >
                      <Plus className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span className="text-base font-semibold" style={{ color: 'var(--color-primary)' }}>
                      Add Exercise
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer note (rationale) */}
            {note && (
              <div
                className="p-4 border-t"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <div className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                  <p className="leading-relaxed">{note}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons below card */}
          <div className="space-y-4">
            <LoadingButton
              onClick={handleConfirm}
              isLoading={confirmDraft.isPending}
              loadingText="STARTING..."
              className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg"
              style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', color: 'var(--color-text-button)' }}
            >
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                START WORKOUT
              </span>
            </LoadingButton>

            <button
              onClick={handleRegenerate}
              disabled={regenerateDraft.isPending}
              className="w-full py-4 rounded-2xl font-bold text-lg border-2 transition-all"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" />
                {regenerateDraft.isPending ? 'REGENERATING...' : 'REGENERATE'}
              </span>
            </button>

            <button
              onClick={handleCancel}
              disabled={cancelSession.isPending}
              className="w-full py-4 rounded-2xl font-bold text-lg border-2 transition-all"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
                backgroundColor: 'transparent',
                color: 'var(--color-danger)',
                opacity: cancelSession.isPending ? 0.6 : 1,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <X className="w-5 h-5" />
                {cancelSession.isPending ? 'CANCELLING...' : 'CANCEL'}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Exercise Edit Menu */}
      <ExerciseEditMenu 
        isOpen={isEditMenuOpen} 
        onClose={() => setIsEditMenuOpen(false)} 
        onEditSetsReps={handleEditSetsReps} 
        onSwap={handleSwap} 
        onRemove={handleRemoveExerciseFromMenu} 
        isRemoveLoading={removeExercise.isPending} 
        exerciseName={selectedExercise?.session_exercise.exercise?.name}
      />

      {/* Edit Sets/Reps Modal */}
      {selectedExercise && (
        <EditSetsRepsModal 
          isOpen={isEditSetsRepsOpen} 
          onClose={() => setIsEditSetsRepsOpen(false)} 
          initialSets={selectedExercise.session_exercise.target_sets || 0} 
          initialReps={String(selectedExercise.session_exercise.target_reps || 0)} 
          initialWeight={String(selectedExercise.session_exercise.target_weight || 0)} 
          onSave={handleSaveSetsReps} 
          isLoading={updateExercise.isPending} 
          exerciseName={selectedExercise.session_exercise.exercise?.name}
        />
      )}

      {/* Exercise Picker */}
      {showExercisePicker && (
        <ExercisePickerPage
          mode={exercisePickerMode}
          onClose={() => setShowExercisePicker(false)}
          onSelectExercise={handleSelectExercise}
          isLoading={addExercise.isPending || removeExercise.isPending}
        />
      )}
    </div>
  );
}
