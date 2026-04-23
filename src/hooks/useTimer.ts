import { useState, useEffect, useRef, useCallback } from 'react';
import { BRUSH_DURATION_SEC } from '@/lib/constants';

export function useTimer(onComplete: () => void) {
  const [remaining, setRemaining] = useState(BRUSH_DURATION_SEC);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setRemaining(BRUSH_DURATION_SEC);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [isRunning, onComplete]);

  const progress = (BRUSH_DURATION_SEC - remaining) / BRUSH_DURATION_SEC;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return { remaining, progress, minutes, seconds, isRunning, start, stop, reset };
}
