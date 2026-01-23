import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle2, Circle, Dumbbell, Play, Check, TrendingUp } from 'lucide-react';
import { useSession, useCompleteSession, useTemplate } from '../hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import { useModalTransition } from '../utils/animations';
import { LoadingContent } from './ui/LoadingContent';
import { LoadingButton } from './ui/LoadingButton';
import { useWorkoutTimer } from './workout-session/hooks/useWorkoutTimer';
import { formatWeight } from './workout-session/utils';
import type { SessionExerciseDetail, SetLogResource } from '../types/api';

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number | null;
}

// Helper function to format ISO date string to display format (e.g., "Jan 15, 2025")
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Helper function to format duration from minutes
function formatDuration(minutes: number | null): string {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Helper function to calculate duration from performed_at and completed_at
function calculateDuration(performedAt: string, completedAt: string | null): number | null {
  if (!completedAt) return null;
  const start = new Date(performedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
}

export function SessionDetailModal({
  isOpen,
  onClose,
  sessionId,
}: SessionDetailModalProps) {
  const history = useHistory();
  const queryClient = useQueryClient();
  const modalTransition = useModalTransition();
  const { data: sessionData, isLoading, error } = useSession(sessionId || 0);
  const completeSession = useCompleteSession();
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  // Fetch workout template if session has a workout_template_id
  const { data: workoutTemplate, isLoading: isLoadingTemplate } = useTemplate(
    sessionData?.workout_template_id || 0
  );

  // Use workout timer for incomplete sessions to show live elapsed time
  const { duration: elapsedSeconds } = useWorkoutTimer(
    sessionData && !sessionData.completed_at ? sessionData.performed_at : undefined
  );

  // Calculate duration - for completed sessions use completed_at, for incomplete use elapsed time
  const isIncomplete = sessionData && !sessionData.completed_at;
  const duration = isIncomplete
    ? Math.floor(elapsedSeconds / 60) // Convert seconds to minutes for incomplete sessions
    : sessionData
    ? calculateDuration(sessionData.performed_at, sessionData.completed_at) || null
    : null;

  const formattedDuration = duration ? formatDuration(duration) : 'N/A';

  // Calculate total volume across all exercises
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
    if (sessionId) {
      history.push(`/session/${sessionId}`);
      onClose();
    }
  };

  const handleCompleteSession = async () => {
    if (!sessionId) return;
    
    try {
      await completeSession.mutateAsync({
        sessionId,
        notes: notes.trim() || undefined,
      });
      
      // Invalidate calendar queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'calendar'] });
      
      // Close modal and reset state
      setNotes('');
      setShowNotesInput(false);
      onClose();
    } catch (error) {
      console.error('Failed to complete session:', error);
      // Error handling could be improved with user feedback
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            {...modalTransition}
            onClick={onClose}
            className="fixed inset-0 bg-black/60"
            style={{ zIndex: 10000 }}
          />

          {/* Modal */}
          <motion.div
            {...modalTransition}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto"
            style={{ zIndex: 10001 }}
          >
            <div
              className="rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--color-bg-modal)' }}
            >
              {/* Header */}
              <div
                className="sticky top-0 border-b p-6 flex items-center justify-between rounded-t-3xl"
                style={{
                  backgroundColor: 'var(--color-bg-modal)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h2
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                  }}
                >
                  Session Details
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {isLoading ? (
                  <LoadingContent />
                ) : error || !sessionData ? (
                  <div className="text-center py-8">
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                      {error ? 'Failed to load session details' : 'No session data available'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Session Header Card */}
                    <div
                      className="rounded-2xl p-6 border"
                      style={{
                        background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3
                            className="text-xl font-bold mb-2"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {(() => {
                              // If no workout_template_id, it's a custom session
                              if (!sessionData.workout_template_id) {
                                return 'Custom Session';
                              }
                              
                              // If template is still loading, show fallback
                              if (isLoadingTemplate) {
                                return 'Workout Session';
                              }
                              
                              // If template is loaded, show plan name or template name as fallback
                              if (workoutTemplate) {
                                return workoutTemplate.plan?.name || workoutTemplate.name || 'Workout Session';
                              }
                              
                              // Fallback if template fetch failed
                              return 'Workout Session';
                            })()}
                          </h3>
                          <p
                            className="text-sm mb-3"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {formatDateForDisplay(sessionData.performed_at)}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                            sessionData.completed_at
                              ? 'bg-green-500/20'
                              : 'bg-amber-500/20'
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
                              color: sessionData.completed_at
                                ? '#10b981'
                                : '#f59e0b',
                            }}
                          >
                            {sessionData.completed_at ? 'Completed' : 'Incomplete'}
                          </span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div
                          className="rounded-xl p-3 border"
                          style={{
                            backgroundColor: 'var(--color-bg-surface)',
                            borderColor: 'var(--color-border-subtle)',
                          }}
                        >
                          <Clock className="w-4 h-4 mb-1" style={{ color: 'var(--color-primary)' }} />
                          <p
                            className="text-lg font-bold"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {formattedDuration}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
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
                          <p
                            className="text-lg font-bold"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {sessionData.exercises.length}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
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
                          <p
                            className="text-lg font-bold"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {formatWeight(totalVolume)}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Total Volume
                          </p>
                        </div>
                      </div>

                      {/* Progress */}
                      {sessionData.progress && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-sm font-medium"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              Progress
                            </span>
                            <span
                              className="text-sm font-bold"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
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

                    {/* Action Buttons - Only for incomplete sessions */}
                    {isIncomplete && (
                      <div className="space-y-3">
                        <button
                          onClick={handleResumeSession}
                          className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors border"
                          style={{
                            backgroundColor: 'var(--color-bg-surface)',
                            borderColor: 'var(--color-border-subtle)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
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
                            <p
                              className="text-sm font-bold"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              Resume Session
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              Continue logging sets and exercises
                            </p>
                          </div>
                        </button>

                        {!showNotesInput ? (
                          <button
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
                              <p
                                className="text-sm font-bold"
                                style={{ color: '#4ade80' }}
                              >
                                Complete Session
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: 'rgb(74 222 128 / 0.7)' }}
                              >
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
                              <p
                                className="text-xs mt-1"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                {notes.length} / 1000 characters
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
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
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
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

                    {/* Exercises List */}
                    {sessionData.exercises.length > 0 ? (
                      <div
                        className="rounded-xl p-4 border"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border-subtle)',
                        }}
                      >
                        <h3
                          className="text-sm font-bold mb-4"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          Exercises
                        </h3>
                        <div className="space-y-4">
                          {sessionData.exercises.map((exerciseDetail: SessionExerciseDetail, index: number) => {
                            const exercise = exerciseDetail.session_exercise.exercise;
                            const loggedSets = exerciseDetail.logged_sets || [];
                            const exerciseName = exercise?.name || 'Unknown Exercise';

                            return (
                              <div
                                key={exerciseDetail.session_exercise.id}
                                className="rounded-lg p-4 border"
                                style={{
                                  backgroundColor: 'var(--color-bg-elevated)',
                                  borderColor: 'var(--color-border-subtle)',
                                }}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="text-xs font-bold px-2 py-1 rounded"
                                      style={{
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'white',
                                      }}
                                    >
                                      {index + 1}
                                    </span>
                                    <h4
                                      className="text-sm font-bold"
                                      style={{ color: 'var(--color-text-primary)' }}
                                    >
                                      {exerciseName}
                                    </h4>
                                  </div>
                                  {exerciseDetail.is_completed && (
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
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
                                              <span
                                                className="text-lg font-bold"
                                                style={{ color: 'var(--color-text-primary)' }}
                                              >
                                                {formatWeight(set.weight)}
                                              </span>
                                              <span
                                                className="text-xs"
                                                style={{ color: 'var(--color-text-muted)' }}
                                              >
                                                kg
                                              </span>
                                            </div>
                                            <span style={{ color: 'var(--color-border)' }}>×</span>
                                            <div className="flex items-center gap-2">
                                              <span
                                                className="text-lg font-bold"
                                                style={{ color: 'var(--color-text-primary)' }}
                                              >
                                                {set.reps}
                                              </span>
                                              <span
                                                className="text-xs"
                                                style={{ color: 'var(--color-text-muted)' }}
                                              >
                                                reps
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div
                                              className="text-xs font-medium"
                                              style={{ color: 'var(--color-text-muted)' }}
                                            >
                                              {formatWeight(volume)} kg
                                            </div>
                                            <div
                                              className="text-[10px]"
                                              style={{ color: 'var(--color-text-muted)' }}
                                            >
                                              volume
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {/* Total Volume Summary */}
                                    {loggedSets.length > 1 && (
                                      <div
                                        className="mt-3 pt-3 border-t flex items-center justify-between"
                                        style={{ borderColor: 'var(--color-border-subtle)' }}
                                      >
                                        <span
                                          className="text-xs font-semibold"
                                          style={{ color: 'var(--color-text-secondary)' }}
                                        >
                                          Volume
                                        </span>
                                        <span
                                          className="text-sm font-bold"
                                          style={{ color: 'var(--color-primary)' }}
                                        >
                                          {formatWeight(
                                            loggedSets.reduce(
                                              (sum: number, set: SetLogResource) => sum + set.weight * set.reps,
                                              0
                                            )
                                          )}{' '}
                                          kg
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p
                                    className="text-xs italic"
                                    style={{ color: 'var(--color-text-muted)' }}
                                  >
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
                        <p
                          className="text-sm"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          No exercises in this session
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {sessionData.notes && (
                      <div
                        className="rounded-xl p-4 border"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border-subtle)',
                        }}
                      >
                        <h3
                          className="text-sm font-bold mb-2"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          Notes
                        </h3>
                        <p
                          className="text-sm whitespace-pre-wrap"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {sessionData.notes}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
