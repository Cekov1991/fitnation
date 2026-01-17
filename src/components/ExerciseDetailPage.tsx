import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useExercises, useExerciseHistory } from '../hooks/useApi';
import { ExerciseImage } from './ExerciseImage';
import type { ExerciseResource, PerformanceDataPoint, MuscleGroupResource } from '../types/api';

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
  return <div className="min-h-screen w-full bg-[#0a0a0a] text-white pb-32">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-30" />
      </div>

      <main className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex items-center gap-4 p-6 pb-4">
          <motion.button whileHover={{
          scale: 1.1,
          x: -2
        }} whileTap={{
          scale: 0.9
        }} onClick={onBack} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="text-gray-400 w-6 h-6" />
          </motion.button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {exercise?.name || exerciseName}
          </h1>
        </motion.div>

        {/* Video Player Section - Always show, autoplay if video exists */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="mx-6 mb-6">
          <div className="relative aspect-video bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl overflow-hidden border border-white/10">
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
                  <div className="p-4 bg-blue-500/80 rounded-full group-hover:bg-blue-500 transition-colors">
                    {isVideoPlaying ? <Pause className="text-white w-6 h-6" /> : <Play className="text-white w-6 h-6" />}
                  </div>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-500 text-sm">No video available</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }} className="flex gap-2 px-6 mb-6">
          {(['instructions', 'muscles', 'history'] as const).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-300'}`}>
              {activeTab === tab && <motion.div layoutId="activeTab" className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl" transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300
          }} />}
              <span className="relative z-10 capitalize">{tab}</span>
            </button>)}
        </motion.div>

        {/* Tab Content */}
        <div className="px-6">
          <AnimatePresence mode="wait">
            {activeTab === 'instructions' && <motion.div key="instructions" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -20
          }} transition={{
            duration: 0.2
          }}>
                <div className="space-y-6">
                  {/* Instructions/Description */}
                  <div className="bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4">
                      Instructions
                    </h2>
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {instructions}
                    </div>
                  </div>
                </div>
              </motion.div>}

            {activeTab === 'muscles' && <motion.div key="muscles" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -20
          }} transition={{
            duration: 0.2
          }}>
                <div className="space-y-6">
                  {/* Muscle Group Image */}
                  <div className="bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
                    <ExerciseImage 
                      src={exercise?.muscle_group_image || null} 
                      alt={`${exercise?.name || 'Exercise'} muscle groups`} 
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Primary Muscles */}
                  <div className="bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-sm font-semibold text-white">
                        Primary
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {primaryMuscles.length > 0 ? primaryMuscles.map((muscle: string) => <button key={muscle} className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors">
                          {muscle}
                        </button>) : <span className="text-xs text-gray-500">No primary muscles available.</span>}
                    </div>
                  </div>

                  {/* Secondary Muscles */}
                  <div className="bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="text-sm font-semibold text-white">
                        Secondary
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {secondaryMuscles.length > 0 ? secondaryMuscles.map((muscle: string) => <button key={muscle} className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-xl text-sm font-medium text-orange-400 hover:bg-orange-500/30 transition-colors">
                          {muscle}
                        </button>) : <span className="text-xs text-gray-500">No secondary muscles available.</span>}
                    </div>
                  </div>
                </div>
              </motion.div>}

            {activeTab === 'history' && <motion.div key="history" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -20
          }} transition={{
            duration: 0.2
          }}>
                <div className="bg-gray-800/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">
                    Performance History
                  </h2>

                  {isLoadingHistory ? (
                    <div className="text-sm text-gray-400 text-center py-8">
                      Loading history...
                    </div>
                  ) : historyError ? (
                    <div className="text-sm text-red-400 text-center py-8">
                      Error loading history. Please try again.
                    </div>
                  ) : !historyData || historyData.performance_data.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center py-8">
                      No history available yet.
                    </div>
                  ) : (
                    <>
                      {/* Stats Summary */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-400 mb-1">Current</p>
                          <p className="text-lg font-bold text-white">
                            {historyData.stats.current_weight} kg
                          </p>
                        </div>
                        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-400 mb-1">Best</p>
                          <p className="text-lg font-bold text-green-400">
                            {historyData.stats.best_weight} kg
                          </p>
                        </div>
                        <div className="bg-gray-700/30 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-400 mb-1">Progress</p>
                          <p className="text-lg font-bold text-blue-400">
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
                          <h3 className="text-sm font-semibold text-gray-400 mb-3">
                            Recent Sessions
                          </h3>
                          <div className="space-y-2">
                            {recentSessions.map((session) => (
                              <div 
                                key={`${session.session_id}-${session.date}`} 
                                className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg"
                              >
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {formatDateForDisplay(session.date)}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {session.weight} kg × {session.reps} reps
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-blue-400">
                                    {session.volume}
                                  </p>
                                  <p className="text-xs text-gray-400">volume</p>
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
    </div>;
}