'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MOUTH_OPEN_THRESHOLD } from '@/lib/constants';
import { FaceState } from '@/types';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FaceMesh: any;
  }
}

function loadMediaPipeCDN(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FaceMesh) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('MediaPipe CDN load failed'));
    document.head.appendChild(script);
  });
}

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isVideoReady: boolean
) {
  const [faceState, setFaceState] = useState<FaceState>({ mouthOpen: false, mouthOpenRatio: 0 });
  const rafRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceMeshRef = useRef<any>(null);

  const handleResults = useCallback((results: { multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>> }) => {
    if (!results.multiFaceLandmarks?.length) {
      setFaceState({ mouthOpen: false, mouthOpenRatio: 0 });
      return;
    }
    const landmarks = results.multiFaceLandmarks[0];
    // MediaPipe FaceMesh 正規化座標: 上唇=13, 下唇=14
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    if (upperLip && lowerLip) {
      const mouthOpenRatio = Math.abs(lowerLip.y - upperLip.y) * 10;
      setFaceState({
        mouthOpen: mouthOpenRatio > MOUTH_OPEN_THRESHOLD,
        mouthOpenRatio: Math.min(mouthOpenRatio, 1),
      });
    }
  }, []);

  useEffect(() => {
    if (!isVideoReady) return;

    let cancelled = false;

    (async () => {
      try {
        await loadMediaPipeCDN();
        if (cancelled) return;

        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        faceMesh.onResults(handleResults);
        faceMeshRef.current = faceMesh;

        const video = videoRef.current!;
        const sendFrame = async () => {
          if (cancelled) return;
          if (video.readyState >= 2) {
            await faceMesh.send({ image: video });
          }
          rafRef.current = requestAnimationFrame(sendFrame);
        };
        rafRef.current = requestAnimationFrame(sendFrame);
      } catch (e) {
        console.error('FaceMesh init error:', e);
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      faceMeshRef.current?.close();
    };
  }, [isVideoReady, handleResults, videoRef]);

  return faceState;
}
