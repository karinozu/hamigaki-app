'use client';

import { useEffect, useRef } from 'react';
import { EffectType, Landmark } from '@/types';
import {
  drawLion, drawBeam, drawPanda, drawCat,
  createFireworksBurst, updateAndDrawFireworks,
  type Particle,
} from './drawEffects';

interface Props {
  effect: EffectType | null;
  landmarks: Landmark[] | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function EffectCanvas({ effect, landmarks, videoRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstTimerRef = useRef(0);
  const frameRef = useRef(0);

  // ランドマークは毎フレーム更新するため ref で持つ
  landmarksRef.current = landmarks;

  // Canvas サイズを表示サイズに合わせる
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        canvas.width = e.contentRect.width;
        canvas.height = e.contentRect.height;
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // エフェクト描画ループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    particlesRef.current = [];
    burstTimerRef.current = 0;
    frameRef.current = 0;

    if (!effect) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let rafId: number;

    const loop = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const lms = landmarksRef.current;
      const video = videoRef.current;
      const cw = canvas.width;
      const ch = canvas.height;
      const vw = video?.videoWidth || 640;
      const vh = video?.videoHeight || 480;
      const frame = ++frameRef.current;

      switch (effect) {
        case 'lion':
          if (lms) drawLion(ctx, lms, vw, vh, cw, ch);
          break;
        case 'fireworks':
          burstTimerRef.current++;
          if (burstTimerRef.current % 50 === 1 || particlesRef.current.length < 5) {
            particlesRef.current.push(...createFireworksBurst(cw, ch));
          }
          updateAndDrawFireworks(ctx, particlesRef.current);
          particlesRef.current = particlesRef.current.filter(p => p.alpha > 0.01);
          break;
        case 'beam':
          if (lms) drawBeam(ctx, lms, vw, vh, cw, ch, frame);
          break;
        case 'panda':
          if (lms) drawPanda(ctx, lms, vw, vh, cw, ch);
          break;
        case 'cat':
          if (lms) drawCat(ctx, lms, vw, vh, cw, ch);
          break;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [effect, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
