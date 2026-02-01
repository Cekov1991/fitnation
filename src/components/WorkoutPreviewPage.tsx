import { useState } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { Check, RefreshCw, X, Edit2, Plus } from 'lucide-react';
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
  useAddSessionExercise
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
  
  const confirmDraft = useConfirmDraftSession();
  const regenerateDraft = useRegenerateDraftSession();
  const removeExercise = useRemoveSessionExercise();
  const cancelSession = useCancelSession();
  const updateExercise = useUpdateSessionExercise();
  const addExercise = useAddSessionExercise();
  
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
        // Remove current exercise first, then add new one
        await removeExercise.mutateAsync({
          sessionId: Number(sessionId),
          exerciseId: selectedExercise.session_exercise.id
        });
        // Add new exercise with same targets
        await addExercise.mutateAsync({
          sessionId: Number(sessionId),
          data: {
            exercise_id: exercise.id,
            target_sets: selectedExercise.session_exercise.target_sets || 3,
            target_reps: selectedExercise.session_exercise.target_reps || 10,
            target_weight: selectedExercise.session_exercise.target_weight || 0
          }
        });
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
        <LoadingContent message="Loading workout preview..." />
      </div>
    );
  }

  if (!draftSession) {
    return (
      <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <BackgroundGradients />
        <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
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

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <BackgroundGradients />
      <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Preview Workout
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Review and adjust your Fit Nation's Engine workout
            </p>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          {/* Rationale */}
          {draftSession.rationale && (
            <div 
              className="p-4 rounded-xl border"
              style={{ 
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {draftSession.rationale}
              </p>
            </div>
          )}

          {/* Exercise List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Exercises ({draftSession.exercises?.length || 0})
              </h2>
            </div>
            <div className="space-y-3">
              {draftSession.exercises?.map((exerciseDetail: SessionExerciseDetail) => {
                const sessionExercise = exerciseDetail.session_exercise;
                const exercise = sessionExercise?.exercise;
                if (!exercise) return null;
                
                return (
                  <div
                    key={sessionExercise.id}
                    className="rounded-3xl overflow-hidden shadow-sm"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                    }}
                  >
                    {/* Exercise Image - Top Section */}
                    <div 
                      className="w-full h-40 flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: 'var(--color-bg-base)' }}
                      onClick={() => handleViewExerciseDetail(exercise.name)}
                    >
                      <ExerciseImage 
                        src={exercise.image} 
                        alt={exercise.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Exercise Info - Bottom Section */}
                    <div className="flex items-center gap-3 px-4 py-4">
                      {/* Exercise Info */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleViewExerciseDetail(exercise.name)}
                      >
                        <h3 className="text-base font-bold mb-0.5 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                          {exercise.name}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                          <span style={{ color: 'var(--color-primary)' }}>{sessionExercise.target_sets} sets</span>
                          <span className="mx-1.5 opacity-40">×</span>
                          <span style={{ color: 'var(--color-primary)' }}>{sessionExercise.target_reps} reps</span>
                          {sessionExercise.target_weight && sessionExercise.target_weight > 0 && (
                            <>
                              <span className="mx-1.5 opacity-40">×</span>
                              <span style={{ color: 'var(--color-primary)' }}>{sessionExercise.target_weight} kg</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(exerciseDetail);
                        }}
                        className="flex-shrink-0 p-2.5 rounded-full transition-colors"
                        style={{ backgroundColor: 'var(--color-bg-base)' }}
                        title="Edit exercise"
                      >
                        <Edit2 className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Exercise Button */}
            <button
              onClick={handleAddExercise}
              className="w-full py-6 border-2 border-dashed rounded-2xl transition-all group mt-4"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <div 
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
                >
                  <Plus className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                </div>
                <span className="text-base font-semibold" style={{ color: 'var(--color-primary)' }}>
                  Add Exercise
                </span>
              </div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
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
