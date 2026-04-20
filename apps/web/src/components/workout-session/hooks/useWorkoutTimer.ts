import { useState, useEffect } from 'react';

export function useWorkoutTimer(performedAt: string | undefined) {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return { duration, formattedDuration: formatTime(duration) };
}
