'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useTimer } from '@/hooks/useTimer';
import { useEffects } from '@/hooks/useEffects';
import { CameraView } from '@/components/camera/CameraView';
import { EffectOverlay } from '@/components/effects/EffectOverlay';
import { BrushTimer } from '@/components/timer/BrushTimer';
import { supabase } from '@/lib/supabase/client';

const DECO_ITEMS = [
  { emoji: '⭐', x: '4%',  y: '6%',  duration: 2.2 },
  { emoji: '🌈', x: '80%', y: '4%',  duration: 3.0 },
  { emoji: '🫧', x: '6%',  y: '75%', duration: 2.5 },
  { emoji: '🌟', x: '82%', y: '72%', duration: 1.8 },
  { emoji: '💫', x: '45%', y: '3%',  duration: 2.8 },
  { emoji: '🎵', x: '90%', y: '38%', duration: 3.2 },
  { emoji: '🎶', x: '2%',  y: '42%', duration: 2.0 },
];

export default function BrushPage() {
  const router = useRouter();
  const effectCountRef = useRef(0);
  const { videoRef, isReady, error, start: startCamera, stop: stopCamera } = useCamera();
  const faceState = useFaceDetection(videoRef, isReady);

  const handleComplete = useCallback(async () => {
    stopCamera();
    try {
      await supabase.from('brushing_sessions').insert({
        completed: true,
        duration_sec: 120,
        effects_count: effectCountRef.current,
      });
    } catch {
      // Supabase未設定時はスキップ
    }
    router.push('/complete');
  }, [router, stopCamera]);

  const { minutes, seconds, progress, isRunning, start: startTimer } = useTimer(handleComplete);
  const { currentEffect, effectCount } = useEffects(faceState.mouthOpen, isRunning);

  useEffect(() => { effectCountRef.current = effectCount; }, [effectCount]);
  useEffect(() => { startCamera(); }, [startCamera]);
  useEffect(() => {
    if (isReady && !isRunning) startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-500 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-xl font-bold">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-300 via-blue-400 to-indigo-500 flex flex-col items-center justify-center p-4 overflow-hidden">

      {/* 背景デコレーション（ふわふわアニメ） */}
      {DECO_ITEMS.map((item, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl select-none pointer-events-none"
          style={{ left: item.x, top: item.y }}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: item.duration, repeat: Infinity, ease: 'easeInOut' }}
        >
          {item.emoji}
        </motion.span>
      ))}

      {/* タイトル */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white font-black text-xl drop-shadow mb-3 z-10"
      >
        🦷 はみがきタイム！
      </motion.p>

      {/* カメラフレーム */}
      <div className="relative z-10 w-full max-w-sm">
        {/* レインボーボーダー */}
        <div className="rounded-3xl p-1 bg-gradient-to-br from-yellow-300 via-pink-400 to-purple-500 shadow-2xl">
          <div className="rounded-[20px] overflow-hidden bg-black aspect-[3/4] relative">
            <CameraView ref={videoRef} className="absolute inset-0 w-full h-full" />
            <EffectOverlay effect={currentEffect} mouthOpenRatio={faceState.mouthOpenRatio} />

            {/* 口を開けよう吹き出し */}
            {!faceState.mouthOpen && isRunning && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute bottom-4 left-0 right-0 flex justify-center"
              >
                <span className="bg-white/90 text-blue-700 font-black text-base px-4 py-2 rounded-full shadow-lg">
                  口を大きく開けよう！🦁
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* タイマー（フレーム右上に重ねる） */}
        <div className="absolute -top-4 -right-4">
          <BrushTimer minutes={minutes} seconds={seconds} progress={progress} />
        </div>
      </div>

      {/* 下部メッセージ */}
      <motion.p
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-5 text-white font-bold text-sm drop-shadow z-10"
      >
        ✨ がんばれ！もうすぐおわるよ ✨
      </motion.p>
    </main>
  );
}
