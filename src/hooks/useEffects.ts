import { useState, useEffect, useRef } from 'react';
import { EffectType } from '@/types';

const EFFECTS: EffectType[] = ['lion', 'fireworks', 'beam', 'panda', 'cat'];

function playEffectSound() {
  try {
    const AudioCtx = window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch { /* Web Audio API 非対応環境では無視 */ }
}

export function useEffects(mouthOpen: boolean, isRunning: boolean) {
  const [currentEffect, setCurrentEffect] = useState<EffectType | null>(null);
  const [effectCount, setEffectCount] = useState(0);
  const prevMouthOpenRef = useRef(false);

  useEffect(() => {
    if (!isRunning) {
      setCurrentEffect(null);
      prevMouthOpenRef.current = false;
      return;
    }
    if (mouthOpen && !prevMouthOpenRef.current) {
      const next = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
      setCurrentEffect(next);
      setEffectCount((c) => c + 1);
      playEffectSound();
    }
    if (!mouthOpen && prevMouthOpenRef.current) {
      setCurrentEffect(null);
    }
    prevMouthOpenRef.current = mouthOpen;
  }, [mouthOpen, isRunning]);

  return { currentEffect, effectCount };
}
