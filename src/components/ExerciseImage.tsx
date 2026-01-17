import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface ExerciseImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function ExerciseImage({ src, alt, className = '' }: ExerciseImageProps) {
  const [imageError, setImageError] = useState(false);

  // If no src or image failed to load, show fallback
  const showFallback = !src || imageError;

  return (
    <div className={`relative ${className}`}>
      {!showFallback ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700/50 to-gray-800/50">
          <Dumbbell className="text-gray-500 w-8 h-8" />
        </div>
      )}
    </div>
  );
}
