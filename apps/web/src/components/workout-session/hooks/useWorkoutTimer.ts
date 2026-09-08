import { useState, useEffect } from 'react';
import { formatClock } from '@fit-nation/shared';

export function useWorkoutTimer(performedAt: string | null | undefined) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!performedAt) return;
    
    const calculateElapsedTime = () => {
      const performedAtTime = new Date(performedAt).getTime();
      const now = Date.now();
      return Math.floor((now - performedAtTime) / 1000);
    };
    
    setDuration(calculateElapsedTime());
    
    const interval = setInterval(() => {
      setDuration(calculateElapsedTime());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [performedAt]);

  return { duration, formattedDuration: formatClock(duration) };
}
