import { useRef, useEffect, useState } from 'react';
import { MoreVertical, Loader2 } from 'lucide-react';
import { ExerciseImage } from '../ExerciseImage';
import type { Exercise } from './types';

interface ExerciseVideoCardProps {
  exercise: Exercise;
  onOpenMenu: () => void;
  onViewExercise?: () => void;
}

export function ExerciseVideoCard({ exercise, onOpenMenu, onViewExercise }: ExerciseVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' } // Start loading 300px before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset error state when exercise changes
  useEffect(() => {
    setHasError(false);
    setIsBuffering(false);
  }, [exercise.id, exercise.videoUrl]);

  // Auto-play video when exercise changes and is in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !exercise.videoUrl || !isInView || hasError) return;

    const handleCanPlay = () => {
      setIsBuffering(false);
      video.play().catch((error) => {
        // Autoplay may fail if user hasn't interacted with page
        console.log('Video autoplay failed:', error);
      });
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    const handleError = () => {
      setHasError(true);
      setIsBuffering(false);
    };

    // Only call load() if src actually changed or video failed
    if (video.src !== exercise.videoUrl) {
      setIsBuffering(true);
      video.load();
    }

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    // If video is already ready, try to play
    if (video.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
    };
  }, [exercise.id, exercise.videoUrl, isInView, hasError]);

  // Cleanup on unmount or exercise change
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
    };
  }, [exercise.id]);

  const handleCardClick = () => {
    if (onViewExercise) {
      onViewExercise();
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenMenu();
  };

  const hasVideo = exercise.videoUrl && exercise.videoUrl.trim() !== '';

  return (
    <div 
      onClick={handleCardClick}
      className="relative border rounded-2xl overflow-hidden transition-all cursor-pointer hover:opacity-90 active:scale-[0.98]"
      style={{ 
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)'
      }}
    >
      {/* Video/Image Container */}
      <div ref={containerRef} className="relative w-full aspect-[4/3] overflow-hidden">
        {hasVideo && !hasError ? (
          <>
            {isInView && (
              <video 
                ref={videoRef}
                className="w-full h-full object-cover" 
                loop 
                muted 
                playsInline 
                autoPlay
                preload="metadata"
                poster={exercise.imageUrl || undefined}
              >
                <source src={exercise.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            {/* Show poster image while not in view or while buffering */}
            {(!isInView || isBuffering) && (
              <div className="absolute inset-0">
                <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
                {isBuffering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
                  </div>
                )}
              </div>
            )}
          </>
        ) : hasVideo && hasError ? (
          // Fallback to image if video fails to load
          <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
        ) : (
          <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
        )}

        {/* Overlay with gradient for text readability */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 30%, transparent 50%, transparent 100%)'
          }}
        />

        {/* Top section: Name, Muscle Group, Menu */}
        <div className="absolute top-0 left-0 right-0 p-4 pb-3 pointer-events-none">
          <div className="flex items-start gap-3">
            <div className="flex-1 text-left min-w-0">
              <h2 className="text-lg font-bold mb-2 leading-tight line-clamp-2 drop-shadow-lg" style={{ color: '#ffffff' }}>
                {exercise.name}
              </h2>
              <span className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-bold text-cyan-400 backdrop-blur-sm">
                {exercise.muscleGroup}
              </span>
            </div>

            <button
              onClick={handleMenuClick}
              className="flex-shrink-0 p-2 rounded-lg pointer-events-auto"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
            >
              <MoreVertical className="w-5 h-5" style={{ color: '#ffffff' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
