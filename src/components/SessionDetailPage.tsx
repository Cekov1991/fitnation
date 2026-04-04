import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, Circle, Dumbbell, Play, Check, TrendingUp } from 'lucide-react';
import { useSession, useCompleteSession, useTemplate } from '../hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import { ExerciseImage } from './ExerciseImage';
import { LoadingButton } from './ui/LoadingButton';
import { useWorkoutTimer } from './workout-session/hooks/useWorkoutTimer';
import { formatWeight } from './workout-session/utils';
import type { SessionExerciseDetail, SetLogResource } from '../types/api';

interface SessionDetailPageProps {
  sessionId: number;
  onBack: () => void;
}

function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function calculateDuration(performedAt: string, completedAt: string | null): number | null {
  if (!completedAt) return null;
  const start = new Date(performedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  return Math.floor(diffMs / (1000 * 60));
}

export function SessionDetailPage({ sessionId, onBack }: SessionDetailPageProps) {
  const history = useHistory();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading, error } = useSession(sessionId);
  const completeSession = useCompleteSession();
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const { data: workoutTemplate, isLoading: isLoadingTemplate } = useTemplate(
    sessionData?.workout_template_id || 0
  );

  const { duration: elapsedSeconds } = useWorkoutTimer(
    sessionData && !sessionData.completed_at ? sessionData.performed_at : undefined
  );

  const isIncomplete = sessionData && !sessionData.completed_at;
  const duration = isIncomplete
    ? Math.floor(elapsedSeconds / 60)
    : sessionData
      ? calculateDuration(sessionData.performed_at, sessionData.completed_at) || null
      : null;

  const formattedDuration = duration ? formatDuration(duration) : 'N/A';

  const totalVolume = sessionData
    ? sessionData.exercises.reduce((total: number, exerciseDetail: SessionExerciseDetail) => {
        const exerciseVolume = exerciseDetail.logged_sets.reduce(
          (sum: number, set: SetLogResource) => sum + set.weight * set.reps,
          0
        );
        return total + exerciseVolume;
      }, 0)
    : 0;

  const handleResumeSession = () => {
    history.push(`/session/${sessionId}`);
  };

  const handleCompleteSession = async () => {
    try {
      await completeSession.mutateAsync({
        sessionId,
        notes: notes.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'calendar'] });

      setNotes('');
      setShowNotesInput(false);
      onBack();
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  return (
    <div
      className="min-h-screen w-full pb-32 max-w-md mx-auto"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <header
        className="sticky top-0 z-20 border-b px-4 py-4 flex items-center gap-3"
        style={{
          backgroundColor: 'var(--color-bg-base)',
          borderColor: 'var(--color-border)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <h1
          className="text-xl font-bold bg-clip-text text-transparent flex-1"
          style={{
            backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
          }}
        >
          Session Details
        </h1>
      </header>

      <div className="px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Loading...
            </p>
          </div>
        ) : error || !sessionData ? (
          <div className="text-center py-8">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {error ? 'Failed to load session details' : 'No session data available'}
            </p>
          </div>
        ) : (
          <>
            <div
              className="rounded-2xl p-6 border"
              style={{
                background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {(() => {
                      if (!sessionData.workout_template_id) {
                        return 'Custom Session';
                      }
                      if (isLoadingTemplate) {
                        return 'Workout Session';
                      }
                      if (workoutTemplate) {
                        return workoutTemplate.plan?.name || workoutTemplate.name || 'Workout Session';
                      }
                      return 'Workout Session';
                    })()}
                  </h2>
                  <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatDateForDisplay(sessionData.performed_at)}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    sessionData.completed_at ? 'bg-green-500/20' : 'bg-amber-500/20'
                  }`}
                >
                  {sessionData.completed_at ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-amber-400" />
                  )}
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: sessionData.completed_at ? '#10b981' : '#f59e0b',
                    }}
                  >
                    {sessionData.completed_at ? 'Completed' : 'Incomplete'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div
                  className="rounded-xl p-3 border"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <Clock className="w-4 h-4 mb-1" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {formattedDuration}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Duration
                  </p>
                </div>
                <div
                  className="rounded-xl p-3 border"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <Dumbbell className="w-4 h-4 mb-1" style={{ color: 'var(--color-secondary)' }} />
                  <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {sessionData.exercises.length}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Exercises
                  </p>
                </div>
                <div
                  className="rounded-xl p-3 border"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <TrendingUp className="w-4 h-4 mb-1" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {formatWeight(totalVolume)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Total Volume
                  </p>
                </div>
              </div>

              {sessionData.progress && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Progress
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {sessionData.progress.completed_exercises} / {sessionData.progress.total_exercises}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${sessionData.progress.progress_percent}%`,
                        background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {isIncomplete && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResumeSession}
                  className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors border"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
                    }}
                  >
                    <Play className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      Resume Session
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Continue logging sets and exercises
                    </p>
                  </div>
                </button>

                {!showNotesInput ? (
                  <button
                    type="button"
                    onClick={() => setShowNotesInput(true)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors border bg-green-500/10 hover:bg-green-500/20"
                    style={{
                      borderColor: 'rgba(34, 197, 94, 0.2)',
                    }}
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: 'rgb(34 197 94 / 0.2)',
                      }}
                    >
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold" style={{ color: '#4ade80' }}>
                        Complete Session
                      </p>
                      <p className="text-xs" style={{ color: 'rgb(74 222 128 / 0.7)' }}>
                        Mark this session as completed
                      </p>
                    </div>
                  </button>
                ) : (
                  <div
                    className="rounded-xl p-4 border space-y-3"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)',
                    }}
                  >
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        Notes (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes about this session..."
                        rows={3}
                        maxLength={1000}
                        className="w-full p-3 rounded-lg border resize-none"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: 'var(--color-border-subtle)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {notes.length} / 1000 characters
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotesInput(false);
                          setNotes('');
                        }}
                        className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: 'var(--color-border-subtle)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Cancel
                      </button>
                      <LoadingButton
                        onClick={handleCompleteSession}
                        isLoading={completeSession.isPending}
                        className="flex-1 px-4 py-2 rounded-lg font-bold text-white transition-colors"
                        style={{
                          background: 'linear-gradient(to right, #10b981, #059669)',
                        }}
                      >
                        Complete
                      </LoadingButton>
                    </div>
                  </div>
                )}
              </div>
            )}

            {sessionData.exercises.length > 0 ? (
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Exercises
                </h3>
                <div className="space-y-4">
                  {sessionData.exercises.map((exerciseDetail: SessionExerciseDetail) => {
                    const exercise = exerciseDetail.session_exercise.exercise;
                    const loggedSets = exerciseDetail.logged_sets || [];
                    const exerciseName = exercise?.name || 'Unknown Exercise';
                    const imageSrc = exercise?.image ?? exercise?.muscle_group_image ?? null;

                    return (
                      <div
                        key={exerciseDetail.session_exercise.id}
                        className="rounded-lg p-4 border"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          borderColor: 'var(--color-border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border"
                              style={{
                                borderColor: 'var(--color-border-subtle)',
                                backgroundColor: 'var(--color-bg-surface)',
                              }}
                            >
                              <ExerciseImage src={imageSrc} alt={exerciseName} className="w-full h-full" />
                            </div>
                            <h4
                              className="text-sm font-bold min-w-0 truncate"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {exerciseName}
                            </h4>
                          </div>
                          {exerciseDetail.is_completed && (
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          )}
                        </div>

                        {loggedSets.length > 0 ? (
                          <div className="space-y-2">
                            {loggedSets.map((set: SetLogResource) => {
                              const volume = set.weight * set.reps;
                              return (
                                <div
                                  key={set.id}
                                  className="flex items-center justify-between p-3 rounded-lg border"
                                  style={{
                                    backgroundColor: 'var(--color-bg-surface)',
                                    borderColor: 'var(--color-border-subtle)',
                                  }}
                                >
                                  <div className="flex items-center gap-4 flex-1">
                                    <span
                                      className="text-sm font-bold min-w-[50px]"
                                      style={{ color: 'var(--color-text-secondary)' }}
                                    >
                                      Set {set.set_number}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                        {formatWeight(set.weight)}
                                      </span>
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                        kg
                                      </span>
                                    </div>
                                    <span style={{ color: 'var(--color-border)' }}>×</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                        {set.reps}
                                      </span>
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                        reps
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                      {formatWeight(volume)} kg
                                    </div>
                                    <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                      volume
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {loggedSets.length > 1 && (
                              <div
                                className="mt-3 pt-3 border-t flex items-center justify-between"
                                style={{ borderColor: 'var(--color-border-subtle)' }}
                              >
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                  Volume
                                </span>
                                <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                                  {formatWeight(
                                    loggedSets.reduce(
                                      (sum: number, s: SetLogResource) => sum + s.weight * s.reps,
                                      0
                                    )
                                  )}{' '}
                                  kg
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
                            No sets logged
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl p-4 border text-center"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  No exercises in this session
                </p>
              </div>
            )}

            {sessionData.notes && (
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Notes
                </h3>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                  {sessionData.notes}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
