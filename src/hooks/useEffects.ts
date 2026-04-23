import { useState, useEffect, useRef, useCallback } from 'react';
import { EffectType } from '@/types';
import { EFFECT_INTERVAL_MS, EFFECT_DISPLAY_MS } from '@/lib/constants';

const EFFECTS: EffectType[] = ['lion', 'beam', 'star', 'rainbow', 'fireworks'];

export function useEffects(mouthOpen: boolean, isRunning: boolean) {
  const [currentEffect, setCurrentEffect] = useState<EffectType | null>(null);
  const [effectCount, setEffectCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerEffect = useCallback(() => {
    const effect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
    setCurrentEffect(effect);
    setEffectCount((c) => c + 1);
    timeoutRef.current = setTimeout(() => setCurrentEffect(null), EFFECT_DISPLAY_MS);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current!);
      clearTimeout(timeoutRef.current!);
      setCurrentEffect(null);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (mouthOpen) triggerEffect();
    }, EFFECT_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current!);
      clearTimeout(timeoutRef.current!);
    };
  }, [isRunning, mouthOpen, triggerEffect]);

  return { currentEffect, effectCount };
}
