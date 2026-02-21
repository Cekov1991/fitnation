import { useState, useRef, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';

interface ExerciseImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function ExerciseImage({ src, alt, className = '' }: ExerciseImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      { rootMargin: '200px' } // Start loading 200px before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset error state if src changes
  useEffect(() => {
    setImageError(false);
    setIsLoaded(false);
  }, [src]);

  const showFallback = !src || imageError;
  const showImage = isInView && !showFallback;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {showImage && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
      {/* Show placeholder when: no src, error, not in view yet, or still loading */}
      {(showFallback || !isLoaded) && (
        <div 
          className="absolute inset-0 w-full h-full flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-surface))'
          }}
        >
          <Dumbbell className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      )}
    </div>
  );
}
