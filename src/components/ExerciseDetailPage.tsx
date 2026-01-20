import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, Play, Pause } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useExercises, useExerciseHistory } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
import { BackgroundGradients } from './BackgroundGradients';
import type { ExerciseResource, PerformanceDataPoint, MuscleGroupResource } from '../types/api';
import { useModalTransition } from '../utils/animations';

interface ExerciseDetailPageProps {
  exerciseName: string;
  onBack: () => void;
}

// Helper function to format ISO date string (YYYY-MM-DD) to display format (e.g., "Jan 15")
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Helper function to format progress percentage with +/- sign
function formatProgress(percentage: number): string {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(0)}%`;
}
export function ExerciseDetailPage({
  exerciseName,
  onBack
}: ExerciseDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'instructions' | 'muscles' | 'history'>('instructions');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalTransition = useModalTransition();
  const {
    data: exercises = []
  } = useExercises();
  const exercise = useMemo(() => {
    return exercises.find((item: ExerciseResource) => item.name.toLowerCase() === exerciseName.toLowerCase());
  }, [exerciseName, exercises]);

  // Fetch exercise history when history tab is active and exercise exists
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    error: historyError
  } = useExerciseHistory(
    exercise?.id || 0,
    undefined,
    {
      enabled: activeTab === 'history' && !!exercise?.id
    }
  );

  // Format performance data for chart
  const chartData = useMemo(() => {
    if (!historyData?.performance_data) return [];
    return historyData.performance_data.map((point: PerformanceDataPoint) => ({
      date: formatDateForDisplay(point.date),
      weight: point.weight,
      reps: point.reps,
      volume: point.volume,
      sets: point.sets
    }));
  }, [historyData]);

  // Get recent sessions (last 3, most recent first)
  const recentSessions = useMemo(() => {
    if (!historyData?.performance_data) return [];
    return [...historyData.performance_data]
      .reverse()
      .slice(0, 3);
  }, [historyData]);

  const primaryMuscles = useMemo(() => {
    if (!exercise?.muscle_groups) return [];
    return exercise.muscle_groups
      .filter((group: MuscleGroupResource) => group.is_primary === true)
      .map((group: MuscleGroupResource) => group.name);
  }, [exercise]);

  const secondaryMuscles = useMemo(() => {
    if (!exercise?.muscle_groups) return [];
    return exercise.muscle_groups
      .filter((group: MuscleGroupResource) => group.is_primary === false)
      .map((group: MuscleGroupResource) => group.name);
  }, [exercise]);

  const instructions = exercise?.description || 'No instructions available yet.';

  // Auto-play video when it loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !exercise?.video) return;

    const handleLoadedData = () => {
      video.play().catch(() => {
        // Autoplay may fail due to browser policies, that's okay
      });
      setIsVideoPlaying(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);

    // If video is already loaded, try to play
    if (video.readyState >= 2) {
      handleLoadedData();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [exercise?.video]);

  // Update play state when video ends or pauses
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsVideoPlaying(true);
    const handlePause = () => setIsVideoPlaying(false);
    const handleEnded = () => setIsVideoPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Handle video play/pause
  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };
  return <div>
      <div>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
        <BackgroundGradients />

      <main className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <motion.div {...modalTransition}
        className="flex items-center gap-4 p-6 pb-4">
          <button onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
          <h1 
            className="text-2xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            {exercise?.name || exerciseName}
          </h1>
        </motion.div>

        {/* Video Player Section - Always show, autoplay if video exists */}
        <motion.div {...modalTransition}
        className="mx-6 mb-6">
          <div 
            className="relative aspect-video bg-gradient-to-br rounded-2xl overflow-hidden border"
            style={{ 
              background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))',
              borderColor: 'var(--color-border)'
            }}
          >
            {exercise?.video ? (
              <>
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover" 
                  loop 
                  muted 
                  playsInline 
                  autoPlay
                  poster={exercise.image || undefined}
                >
                  <source src={exercise.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Play/Pause Overlay */}
                <button 
                  onClick={handleVideoToggle} 
                  className={`absolute inset-0 flex items-center justify-center transition-opacity group ${
                    isVideoPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                  } bg-black/20 hover:bg-black/30`}
                >
                  <div 
                    className="p-4 rounded-full transition-colors"
                    style={{ 
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 80%, transparent)'
                    }}
                  >
                    {isVideoPlaying ? <Pause className="text-white w-6 h-6" /> : <Play className="text-white w-6 h-6" />}
                  </div>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No video available</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div {...modalTransition} className="flex gap-2 px-6 mb-6">
          {(['instructions', 'muscles', 'history'] as const).map(tab => <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all relative"
              style={{ 
                color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
              }}
            >
              {activeTab === tab && <motion.div 
              {...modalTransition}
                layoutId="activeTab" 
                className="absolute inset-0 rounded-xl" 
                style={{ background: 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))' }}
                 />}
              <span className="relative z-10 capitalize">{tab}</span>
            </button>)}
        </motion.div>

        {/* Tab Content */}
        <div className="px-6">
          <AnimatePresence mode="wait">
            {activeTab === 'instructions' && <motion.div key="instructions" {...modalTransition}>
                <div className="space-y-6">
                  {/* Instructions/Description */}
                  <div 
                    className="  border rounded-2xl p-6"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                      Instructions
                    </h2>
                    <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-text-secondary)' }}>
                      {instructions}
                    </div>
                  </div>
                </div>
              </motion.div>}

            {activeTab === 'muscles' && <motion.div key="muscles" {...modalTransition}>
                <div className="space-y-6">
                  {/* Muscle Group Image */}
                  <div 
                    className="  border rounded-2xl overflow-hidden"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <ExerciseImage 
                      src={exercise?.muscle_group_image || null} 
                      alt={`${exercise?.name || 'Exercise'} muscle groups`} 
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Primary Muscles */}
                  <div 
                    className="  border rounded-2xl p-6"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Primary
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {primaryMuscles.length > 0 ? primaryMuscles.map((muscle: string) => <button key={muscle} className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors">
                          {muscle}
                        </button>) : <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No primary muscles available.</span>}
                    </div>
                  </div>

                  {/* Secondary Muscles */}
                  <div 
                    className="  border rounded-2xl p-6"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-subtle)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Secondary
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {secondaryMuscles.length > 0 ? secondaryMuscles.map((muscle: string) => <button key={muscle} className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-xl text-sm font-medium text-orange-400 hover:bg-orange-500/30 transition-colors">
                          {muscle}
                        </button>) : <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No secondary muscles available.</span>}
                    </div>
                  </div>
                </div>
              </motion.div>}

            {activeTab === 'history' && <motion.div key="history" {...modalTransition}>
                <div 
                  className="  border rounded-2xl p-6"
                  style={{ 
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border-subtle)'
                  }}
                >
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    Performance History
                  </h2>

                  {isLoadingHistory ? (
                    <div className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                      Loading history...
                    </div>
                  ) : historyError ? (
                    <div className="text-sm text-red-400 text-center py-8">
                      Error loading history. Please try again.
                    </div>
                  ) : !historyData || historyData.performance_data.length === 0 ? (
                    <div className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                      No history available yet.
                    </div>
                  ) : (
                    <>
                      {/* Stats Summary */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div 
                          className="rounded-xl p-3 text-center"
                          style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                        >
                          <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Current</p>
                          <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            {historyData.stats.current_weight} kg
                          </p>
                        </div>
                        <div 
                          className="rounded-xl p-3 text-center"
                          style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                        >
                          <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Best</p>
                          <p className="text-lg font-bold text-green-400">
                            {historyData.stats.best_weight} kg
                          </p>
                        </div>
                        <div 
                          className="rounded-xl p-3 text-center"
                          style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                        >
                          <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Progress</p>
                          <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                            {formatProgress(historyData.stats.progress_percentage)}
                          </p>
                        </div>
                      </div>

                      {/* Chart */}
                      {chartData.length > 0 && (
                        <div className="h-48 mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis 
                                dataKey="date" 
                                stroke="#9CA3AF" 
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis 
                                stroke="#9CA3AF" 
                                style={{ fontSize: '12px' }}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: '#1F2937',
                                  border: '1px solid #374151',
                                  borderRadius: '8px',
                                  color: '#fff'
                                }}
                                formatter={(value: number, name: string) => {
                                  if (name === 'weight') return [`${value} kg`, 'Weight'];
                                  if (name === 'reps') return [value, 'Reps'];
                                  if (name === 'volume') return [value, 'Volume'];
                                  return [value, name];
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="weight" 
                                stroke="#3B82F6" 
                                strokeWidth={2} 
                                dot={{
                                  fill: '#3B82F6',
                                  r: 4
                                }} 
                                activeDot={{
                                  r: 6
                                }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Recent Sessions */}
                      {recentSessions.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                            Recent Sessions
                          </h3>
                          <div className="space-y-2">
                            {recentSessions.map((session) => (
                              <div 
                                key={`${session.session_id}-${session.date}`} 
                                className="flex items-center justify-between p-3 rounded-lg"
                                style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                              >
                                <div>
                                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                    {formatDateForDisplay(session.date)}
                                  </p>
                                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    {session.weight} kg × {session.reps} reps
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                                    {session.volume}
                                  </p>
                                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>volume</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>}
          </AnimatePresence>
        </div>
      </main>
    </div>
      </div>
    </div>;
}