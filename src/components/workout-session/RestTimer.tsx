import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Timer } from 'lucide-react';
import { useRestTimer } from './hooks/useRestTimer';
import { useSlideTransition } from '../../utils/animations';

interface RestTimerProps {
  restSeconds: number | null;
  isActive: boolean;
  onDismiss: () => void;
}

export function RestTimer({ restSeconds, isActive, onDismiss }: RestTimerProps) {
  const { formattedTime, timeRemaining, addTime, subtractTime } = useRestTimer({ restSeconds, isActive });
  const [totalSeconds, setTotalSeconds] = useState(restSeconds ?? 0);
  const slideTransition = useSlideTransition('down');

  // Track the max time (for progress calculation)
  useEffect(() => {
    if (restSeconds !== null && isActive) {
      setTotalSeconds(restSeconds);
    }
  }, [restSeconds, isActive]);

  // Update total when time is added
  useEffect(() => {
    if (timeRemaining > totalSeconds) {
      setTotalSeconds(timeRemaining);
    }
  }, [timeRemaining, totalSeconds]);

  if (!isActive) return null;

  // Calculate progress (1 = full, 0 = empty)
  const progress = totalSeconds > 0 ? timeRemaining / totalSeconds : 0;
  
  // SVG circle parameters
  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      {...slideTransition}
      className="rounded-2xl p-4 shadow-lg relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-primary) 90%, #000), color-mix(in srgb, var(--color-secondary) 90%, #000))',
        boxShadow: '0 10px 30px color-mix(in srgb, var(--color-primary) 20%, transparent)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Circular progress indicator */}
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              className="transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="white"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ 
                  transition: 'stroke-dashoffset 1s linear',
                  willChange: 'stroke-dashoffset'
                }}
              />
            </svg>
            {/* Timer icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Timer className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
              Rest Timer
            </p>
            <p className="text-3xl font-bold text-white tracking-wider">
              {formattedTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* -15s button */}
          <button
            onClick={() => subtractTime(15)}
            className="px-2 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white active:opacity-70"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            -15s
          </button>

          {/* +15s button */}
          <button
            onClick={() => addTime(15)}
            className="px-2 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white active:opacity-70"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            +15s
          </button>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center ml-1 active:opacity-70"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
