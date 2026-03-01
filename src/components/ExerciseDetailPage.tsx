import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Maximize } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useExercises, useExerciseHistory } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
import type { ExerciseResource, PerformanceDataPoint, MuscleGroupResource } from '../types/api';
import { useModalTransition } from '../utils/animations';

interface ExerciseDetailPageProps {
  exerciseName: string;
  onBack: () => void;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
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
  onBack,
  primaryAction
}: ExerciseDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'guidance' | 'performance'>('guidance');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const modalTransition = useModalTransition();
  const {
    data: exercises = []
  } = useExercises();
  const exercise = useMemo(() => {
    return exercises.find((item: ExerciseResource) => item.name.toLowerCase() === exerciseName.toLowerCase());
  }, [exerciseName, exercises]);

  // Check if exercise allows weight logging (non-bodyweight exercises)
  const allowWeightLogging = exercise?.equipment_type?.code !== 'BODYWEIGHT';

  // Fetch exercise history when performance tab is active and exercise exists
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    error: historyError
  } = useExerciseHistory(
    exercise?.id || 0,
    undefined,
    {
      enabled: activeTab === 'performance' && !!exercise?.id
    }
  );

  // Format performance data for chart
  const chartData = useMemo(() => {
    if (!historyData?.performance_data) return [];
    return historyData.performance_data.map((point: PerformanceDataPoint) => ({
      date: formatDateForDisplay(point.date),
      weight: point.weight,
      bestSetReps: point.best_set_reps,
      reps: point.reps,
      volume: point.volume,
      sets: point.sets,
      // Use weight for weighted exercises, best_set_reps for bodyweight
      value: allowWeightLogging ? point.weight : point.best_set_reps
    }));
  }, [historyData, allowWeightLogging]);

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

  // Handle fullscreen exit to unlock orientation
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Exited fullscreen, unlock orientation
        type ScreenOrientationLock = ScreenOrientation & { unlock?: () => void };
        try {
          const orientation = screen.orientation as ScreenOrientationLock;
          if (orientation?.unlock) {
            orientation.unlock();
          }
        } catch {
          // Orientation unlock not supported
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
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

  const handleFullscreen = async () => {
    const video = videoRef.current;
    const container = videoContainerRef.current;
    if (!video || !container) return;

    // Type for Screen Orientation API
    type ScreenOrientationLock = ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
      unlock?: () => void;
    };

    // Check if we're already in fullscreen
    if (document.fullscreenElement) {
      // Exit fullscreen and unlock orientation
      try {
        const orientation = screen.orientation as ScreenOrientationLock;
        if (orientation?.unlock) {
          orientation.unlock();
        }
      } catch {
        // Orientation unlock not supported
      }
      document.exitFullscreen();
      return;
    }

    // iOS Safari - use video element's native fullscreen
    // This is the only way to get fullscreen working on iOS
    if ((video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
      try {
        (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
        return;
      } catch {
        // Fall through to standard approach
      }
    }

    // Standard Fullscreen API (desktop and Android)
    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if ((container as HTMLDivElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
        (container as HTMLDivElement & { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
      
      // Lock to landscape on mobile after entering fullscreen
      const orientation = screen.orientation as ScreenOrientationLock;
      if (orientation?.lock) {
        try {
          await orientation.lock('landscape');
        } catch {
          // Orientation lock not supported or failed (common on iOS)
        }
      }
    } catch {
      // Fullscreen request failed
    }
  };

  return (
    <div 
      className="min-h-screen w-full pb-32"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <main className="relative z-10 max-w-md mx-auto">
        {/* Header - Original design with back arrow and gradient title */}
        <motion.div 
          {...modalTransition}
          className="flex items-center gap-4 p-6 pb-4"
        >
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

        {/* Tabs - Pill style */}
        <motion.div 
          {...modalTransition} 
          className="px-6 mb-4"
        >
          <div 
            className="flex p-1 rounded-full"
            style={{ backgroundColor: 'var(--color-bg-elevated)' }}
          >
            {(['guidance', 'performance'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className="flex-1 py-3 px-6 rounded-full font-medium text-sm transition-all relative"
                style={{ 
                  color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: activeTab === tab ? 'var(--color-bg-surface)' : 'transparent'
                }}
              >
                <span className="relative z-10 capitalize">{tab}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Video/Image Section - Full Width */}
        <motion.div 
          {...modalTransition}
          className="mb-6"
        >
          <div 
            ref={videoContainerRef}
            className="relative w-full aspect-video overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-elevated)' }}
          >
            {exercise?.video ? (
              <>
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover cursor-pointer" 
                  loop 
                  muted 
                  playsInline 
                  autoPlay
                  poster={exercise.image || undefined}
                  onClick={handleVideoToggle}
                >
                  <source src={exercise.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Play/Pause Overlay - shows on pause or hover */}
                <div 
                  className={`absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none ${
                    isVideoPlaying ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
                >
                  <div 
                    className="p-4 rounded-full"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 80%, transparent)' }}
                  >
                    {isVideoPlaying ? <Pause className="text-white w-8 h-8" /> : <Play className="text-white w-8 h-8" />}
                  </div>
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={handleFullscreen}
                  className="absolute top-4 right-4 p-1 rounded-lg transition-opacity opacity-80 hover:opacity-100"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                  title="Fullscreen"
                >
                  <Maximize className="text-white w-5 h-5" />
                </button>
              </>
            ) : exercise?.image ? (
              <>
                <ExerciseImage 
                  src={exercise.image} 
                  alt={exercise.name} 
                  className="w-full h-full object-cover"
                />
                {/* Fullscreen Button for images too */}
                <button
                  onClick={handleFullscreen}
                  className="absolute top-4 right-4 p-1 rounded-lg transition-opacity opacity-80 hover:opacity-100"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                  title="Fullscreen"
                >
                  <Maximize className="text-white w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No media available</div>
              </div>
            )}
          </div>
        </motion.div>

        {primaryAction && (
          <motion.div {...modalTransition} className="px-6 mb-4">
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
            >
              {primaryAction.label}
            </button>
          </motion.div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'guidance' && (
            <motion.div key="guidance" {...modalTransition}>
              {/* Horizontally Scrolling Cards */}
              <div 
                className="flex gap-4 overflow-x-auto pb-4 px-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Muscles Worked Card */}
                <div 
                  className="flex-shrink-0 w-[85%] snap-start rounded-2xl p-5"
                  style={{ backgroundColor: 'var(--color-bg-surface)' }}
                >
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    Muscles Worked
                  </h2>
                  
                  {/* Muscle Labels */}
                  <div className="flex gap-6 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full primary-muscle-group-bg" />
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Primary</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {primaryMuscles.length > 0 ? primaryMuscles.map((muscle: string) => (
                          <span 
                            key={muscle} 
                            className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase border"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {muscle}
                          </span>
                        )) : (
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full secondary-muscle-group-bg" />
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Secondary</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {secondaryMuscles.length > 0 ? secondaryMuscles.map((muscle: string) => (
                          <span 
                            key={muscle} 
                            className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase border"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {muscle}
                          </span>
                        )) : (
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Muscle Group Image */}
                  {exercise?.muscle_group_image && (
                    <div className="mt-4">
                      <ExerciseImage 
                        src={exercise.muscle_group_image} 
                        alt={`${exercise?.name || 'Exercise'} muscle groups`} 
                        className="w-full h-auto rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Instructions Card */}
                <div 
                  className="flex-shrink-0 w-[85%] snap-start rounded-2xl p-5"
                  style={{ backgroundColor: 'var(--color-bg-surface)' }}
                >
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    Instructions
                  </h2>
                  <div 
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {instructions}
                  </div>
                </div>
              </div>

              {/* Hide scrollbar */}
              <style>{`
                .snap-x::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div key="performance" {...modalTransition} className="px-6">
              <div 
                className="rounded-2xl p-6"
                style={{ backgroundColor: 'var(--color-bg-surface)' }}
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
                          {allowWeightLogging 
                            ? `${historyData.stats.current_weight} kg`
                            : `${historyData.stats.current_best_set_reps} reps`
                          }
                        </p>
                      </div>
                      <div 
                        className="rounded-xl p-3 text-center"
                        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                      >
                        <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Best</p>
                        <p className="text-lg font-bold text-green-400">
                          {allowWeightLogging 
                            ? `${historyData.stats.best_weight} kg`
                            : `${historyData.stats.best_set_reps} reps`
                          }
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
                              unit={allowWeightLogging ? ' kg' : ''}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                              formatter={(value: number, name: string) => {
                                if (name === 'value') {
                                  return allowWeightLogging 
                                    ? [`${value} kg`, 'Weight']
                                    : [`${value} reps`, 'Best Set'];
                                }
                                if (name === 'weight') return [`${value} kg`, 'Weight'];
                                if (name === 'reps') return [value, 'Reps'];
                                if (name === 'volume') return [value, 'Volume'];
                                return [value, name];
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
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
                                  {allowWeightLogging 
                                    ? `${session.weight} kg × ${session.reps} reps`
                                    : `${session.best_set_reps} reps (best set) • ${session.sets} sets`
                                  }
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                                  {allowWeightLogging ? session.volume : session.reps}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                  {allowWeightLogging ? 'volume' : 'total reps'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
