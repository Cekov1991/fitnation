import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Dumbbell, TrendingUp, Target, Award } from 'lucide-react';
import { useModalTransition, useSlideTransition } from '../../utils/animations';
import { formatWeight } from './utils';
import type { Exercise } from './types';

interface WorkoutSummaryScreenProps {
  exercises: Exercise[];
  formattedDuration: string;
  onDone: () => void;
}

interface SummaryStats {
  duration: string;
  exercisesCount: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
}

function calculateStats(exercises: Exercise[], formattedDuration: string): SummaryStats {
  const completedSets = exercises.flatMap(ex => ex.sets.filter(s => s.completed));
  const totalSets = completedSets.length;
  const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
  const totalVolume = completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0);

  return {
    duration: formattedDuration,
    exercisesCount: exercises.length,
    totalSets,
    totalReps,
    totalVolume,
  };
}

function getBestSet(exercise: Exercise): { weight: number; reps: number } | null {
  const completedSets = exercise.sets.filter(s => s.completed);
  if (completedSets.length === 0) return null;

  // Find set with highest volume (weight * reps)
  const bestSet = completedSets.reduce((best, current) => {
    const currentVolume = current.weight * current.reps;
    const bestVolume = best.weight * best.reps;
    return currentVolume > bestVolume ? current : best;
  });

  return { weight: bestSet.weight, reps: bestSet.reps };
}

export function WorkoutSummaryScreen({
  exercises,
  formattedDuration,
  onDone,
}: WorkoutSummaryScreenProps) {
  const modalTransition = useModalTransition();
  const slideTransition = useSlideTransition('up');
  const stats = useMemo(() => calculateStats(exercises, formattedDuration), [exercises, formattedDuration]);

  return (
    <AnimatePresence>
      <motion.div
        {...modalTransition}
        className="min-h-screen w-full pb-32"
        style={{ backgroundColor: 'var(--color-bg-base)' }}
      >
        <main className="relative z-10 max-w-md mx-auto px-4 py-8">
            {/* Congratulations Header */}
            <motion.div
              {...slideTransition}
              className="text-center mb-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                }}
              >
                <Award className="w-10 h-10 text-white" />
              </motion.div>
              <h1
                className="text-4xl font-bold mb-2 bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                }}
              >
                Great Work!
              </h1>
              <p
                className="text-lg"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Workout completed successfully
              </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              {...slideTransition}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              <div
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <Clock className="w-5 h-5 mb-2" style={{ color: 'var(--color-primary)' }} />
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {stats.duration}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Duration
                </p>
              </div>

              <div
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <Dumbbell className="w-5 h-5 mb-2" style={{ color: 'var(--color-secondary)' }} />
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {stats.exercisesCount}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Exercises
                </p>
              </div>

              <div
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <Target className="w-5 h-5 mb-2" style={{ color: 'var(--color-primary)' }} />
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {stats.totalSets}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Total Sets
                </p>
              </div>

              <div
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-subtle)',
                }}
              >
                <TrendingUp className="w-5 h-5 mb-2" style={{ color: 'var(--color-secondary)' }} />
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {formatWeight(stats.totalVolume)}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Total Volume (kg)
                </p>
              </div>
            </motion.div>

            {/* Total Reps Card */}
            <motion.div
              {...slideTransition}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6 mb-8 border"
              style={{
                background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
                borderColor: 'var(--color-border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Total Reps
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {stats.totalReps}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
                  }}
                >
                  <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
                </div>
              </div>
            </motion.div>

            {/* Exercise Breakdown */}
            {exercises.length > 0 && (
              <motion.div
                {...slideTransition}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <h2
                  className="text-xl font-bold mb-4"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Exercise Summary
                </h2>
                <div className="space-y-3">
                  {exercises.map((exercise, index) => {
                    const completedSets = exercise.sets.filter(s => s.completed);
                    const bestSet = getBestSet(exercise);
                    const exerciseVolume = completedSets.reduce(
                      (sum, set) => sum + set.weight * set.reps,
                      0
                    );

                    return (
                      <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="rounded-xl p-4 border"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border-subtle)',
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: 'var(--color-primary)',
                                  color: 'white',
                                }}
                              >
                                {index + 1}
                              </span>
                              <h3
                                className="text-sm font-bold"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                {exercise.name}
                              </h3>
                            </div>
                            <p
                              className="text-xs"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              {completedSets.length} set{completedSets.length !== 1 ? 's' : ''} completed
                            </p>
                          </div>
                          {bestSet && (
                            <div className="text-right">
                              <p
                                className="text-sm font-bold"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                {formatWeight(bestSet.weight)} kg × {bestSet.reps}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                Best set
                              </p>
                            </div>
                          )}
                        </div>
                        {exerciseVolume > 0 && (
                          <div
                            className="mt-2 pt-2 border-t"
                            style={{ borderColor: 'var(--color-border-subtle)' }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="text-xs"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                Volume
                              </span>
                              <span
                                className="text-xs font-bold"
                                style={{ color: 'var(--color-primary)' }}
                              >
                                {formatWeight(exerciseVolume)} kg
                              </span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Done Button */}
            <motion.div
              {...slideTransition}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <button
                onClick={onDone}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl font-bold text-lg shadow-2xl shadow-green-500/30 relative overflow-hidden group active:opacity-90"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                  <CheckCircle2 className="w-6 h-6" />
                  Done
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </motion.div>
          </main>
      </motion.div>
    </AnimatePresence>
  );
}
