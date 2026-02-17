import React, { useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { ExerciseImage } from '../ExerciseImage';
import type { Exercise } from './types';

interface ExerciseVideoCardProps {
  exercise: Exercise;
  onOpenMenu: () => void;
  onViewExercise?: () => void;
}

export function ExerciseVideoCard({ exercise, onOpenMenu, onViewExercise }: ExerciseVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play video when exercise changes
  useEffect(() => {
    if (videoRef.current && exercise.videoUrl) {
      videoRef.current.load();
      videoRef.current.play().catch((error) => {
        // Autoplay may fail if user hasn't interacted with page
        console.log('Video autoplay failed:', error);
      });
    }
  }, [exercise.id, exercise.videoUrl]);

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
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        {hasVideo ? (
          <video 
            ref={videoRef}
            className="w-full h-full object-cover" 
            loop 
            muted 
            playsInline 
            autoPlay
            poster={exercise.imageUrl || undefined}
          >
            <source src={exercise.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
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
