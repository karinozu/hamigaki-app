'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useTimer } from '@/hooks/useTimer';
import { useEffects } from '@/hooks/useEffects';
import { CameraView } from '@/components/camera/CameraView';
import { EffectOverlay } from '@/components/effects/EffectOverlay';
import { BrushTimer } from '@/components/timer/BrushTimer';
import { supabase } from '@/lib/supabase/client';

export default function BrushPage() {
  const router = useRouter();
  const { videoRef, isReady, error, start: startCamera, stop: stopCamera } = useCamera();
  const faceState = useFaceDetection(videoRef, isReady);

  const handleComplete = useCallback(async (effectCount: number) => {
    stopCamera();
    await supabase.from('brushing_sessions').insert({
      completed: true,
      duration_sec: 120,
      effects_count: effectCount,
    });
    router.push('/complete');
  }, [router, stopCamera]);

  const { minutes, seconds, progress, isRunning, start: startTimer } = useTimer(
    useCallback(() => handleComplete(effectCount), [handleComplete]) // eslint-disable-line
  );
  const { currentEffect, effectCount } = useEffects(faceState.mouthOpen, isRunning);

  // タイマー完了時にeffectCountを渡すため再定義
  const timerWithCount = useTimer(
    useCallback(() => handleComplete(effectCount), [handleComplete, effectCount])
  );

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    if (isReady && !timerWithCount.isRunning) {
      timerWithCount.start();
    }
  }, [isReady]); // eslint-disable-line

  if (error) {
    return (
      <main className="min-h-screen bg-blue-600 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">📷</div>
          <p className="text-xl font-bold">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <CameraView ref={videoRef} />
        <EffectOverlay effect={currentEffect} mouthOpenRatio={faceState.mouthOpenRatio} />

        {/* タイマー */}
        <div className="absolute top-4 right-4">
          <BrushTimer
            minutes={timerWithCount.minutes}
            seconds={timerWithCount.seconds}
            progress={timerWithCount.progress}
          />
        </div>

        {/* 口を開けるよう促すメッセージ */}
        {!faceState.mouthOpen && timerWithCount.isRunning && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <span className="bg-white/80 text-blue-800 font-black text-lg px-5 py-2 rounded-full shadow-lg">
              口を大きく開けよう！
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
