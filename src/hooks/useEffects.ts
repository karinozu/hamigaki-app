import { useState, useEffect, useRef, useCallback } from 'react';
import { EffectType } from '@/types';

const EFFECTS: EffectType[] = ['lion', 'fireworks', 'beam', 'train', 'chicks', 'cat'];
const AUTO_CHANGE_MS = 5000; // 口を開けて5秒で自動切り替え

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
  const currentEffectRef = useRef<EffectType | null>(null);
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 直前と異なるエフェクトをランダム選択して発動
  const triggerNextEffect = useCallback(() => {
    const available = EFFECTS.filter(e => e !== currentEffectRef.current);
    const next = available[Math.floor(Math.random() * available.length)];
    currentEffectRef.current = next;
    setCurrentEffect(next);
    setEffectCount(c => c + 1);
    playEffectSound();
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setCurrentEffect(null);
      currentEffectRef.current = null;
      prevMouthOpenRef.current = false;
      clearInterval(autoIntervalRef.current!);
      return;
    }

    // 口が開いた瞬間 → エフェクト発動 + 5秒ごとに自動切り替え開始
    if (mouthOpen && !prevMouthOpenRef.current) {
      triggerNextEffect();
      clearInterval(autoIntervalRef.current!);
      autoIntervalRef.current = setInterval(triggerNextEffect, AUTO_CHANGE_MS);
    }

    // 口が閉じた瞬間 → エフェクト終了 + 自動切り替え停止
    if (!mouthOpen && prevMouthOpenRef.current) {
      setCurrentEffect(null);
      currentEffectRef.current = null;
      clearInterval(autoIntervalRef.current!);
    }

    prevMouthOpenRef.current = mouthOpen;
  }, [mouthOpen, isRunning, triggerNextEffect]);

  // アンマウント時にインターバルを確実にクリア
  useEffect(() => () => clearInterval(autoIntervalRef.current!), []);

  return { currentEffect, effectCount };
}
