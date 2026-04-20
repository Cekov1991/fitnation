import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRestTimerProps {
  restSeconds: number | null;
  isActive: boolean;
}

interface UseRestTimerReturn {
  timeRemaining: number;
  formattedTime: string;
  isComplete: boolean;
  reset: (newSeconds: number) => void;
  addTime: (seconds: number) => void;
  subtractTime: (seconds: number) => void;
}

export function useRestTimer({ restSeconds, isActive }: UseRestTimerProps): UseRestTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(restSeconds ?? 0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Reset timer when restSeconds changes (new set logged)
  useEffect(() => {
    if (restSeconds !== null && isActive) {
      setTimeRemaining(restSeconds);
      setIsComplete(false);
    }
  }, [restSeconds, isActive]);

  // Countdown effect - only depends on isActive, not timeRemaining
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isActive) return;

    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsComplete(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  const reset = useCallback((newSeconds: number) => {
    setTimeRemaining(newSeconds);
    setIsComplete(false);
  }, []);

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => prev + seconds);
    setIsComplete(false);
  }, []);

  const subtractTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => Math.max(0, prev - seconds));
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isComplete,
    reset,
    addTime,
    subtractTime
  };
}
