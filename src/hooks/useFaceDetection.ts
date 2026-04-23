'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MOUTH_OPEN_THRESHOLD } from '@/lib/constants';
import { FaceState } from '@/types';

export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement | null>, isVideoReady: boolean) {
  const [faceState, setFaceState] = useState<FaceState>({ mouthOpen: false, mouthOpenRatio: 0 });
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<{ estimateFaces: (video: HTMLVideoElement) => Promise<Array<{ keypoints: Array<{ x: number; y: number; name?: string }> }>> } | null>(null);

  const detectLoop = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !detectorRef.current) return;

    try {
      const faces = await detectorRef.current.estimateFaces(video);
      if (faces.length > 0) {
        const kp = faces[0].keypoints;
        // MediaPipe FaceMesh: 上唇中央=13, 下唇中央=14
        const upperLip = kp[13];
        const lowerLip = kp[14];
        if (upperLip && lowerLip) {
          const mouthOpenRatio = Math.abs(lowerLip.y - upperLip.y) / 100;
          setFaceState({
            mouthOpen: mouthOpenRatio > MOUTH_OPEN_THRESHOLD,
            mouthOpenRatio: Math.min(mouthOpenRatio, 1),
          });
        }
      }
    } catch {
      // 検知失敗は無視して継続
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, [videoRef]);

  useEffect(() => {
    if (!isVideoReady) return;

    (async () => {
      const [tfjs, faceLandmarksDetection] = await Promise.all([
        import('@tensorflow/tfjs-core'),
        import('@tensorflow-models/face-landmarks-detection'),
      ]);
      await import('@tensorflow/tfjs-backend-webgl');
      await tfjs.setBackend('webgl');
      detectorRef.current = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: 'mediapipe', solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh' }
      );
      rafRef.current = requestAnimationFrame(detectLoop);
    })();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVideoReady, detectLoop]);

  return faceState;
}
