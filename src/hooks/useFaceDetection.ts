'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MOUTH_OPEN_THRESHOLD, LANDMARK_Z_CONFIDENCE_THRESHOLD, LANDMARK_Z_MAX_THRESHOLD, MOUTH_RATIO_HISTORY_SIZE, MOUTH_RATIO_SMOOTH_FACTOR } from '@/lib/constants';
import { FaceState, Landmark } from '@/types';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FaceMesh: any;
  }
}

function loadMediaPipeCDN(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FaceMesh) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('MediaPipe CDN load failed'));
    document.head.appendChild(script);
  });
}

// 唇の複数ランドマークポイント（案2: 複数参照）
const LIP_LANDMARKS = {
  upperCenter: 13,  // 上唇中央
  lowerCenter: 14,  // 下唇中央
  upperLeft: 61,    // 上唇左
  upperRight: 291,  // 上唇右
  lowerLeft: 88,    // 下唇左
  lowerRight: 317,  // 下唇右
};

interface LandmarkConfidence {
  ratio: number;
  confidence: number;
}

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isVideoReady: boolean
) {
  const [faceState, setFaceState] = useState<FaceState>({
    mouthOpen: false,
    mouthOpenRatio: 0,
    landmarks: null,
  });
  const rafRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceMeshRef = useRef<any>(null);
  const prevMouthRatioRef = useRef<number>(0); // 前フレームの値を保持（案1）
  const mouthRatioHistoryRef = useRef<number[]>([]); // フレーム履歴（案5）
  const smoothedRatioRef = useRef<number>(0); // 平滑化された値（案5）

  // 複数のランドマークから信頼度付きの開き具合を計算（案1 + 案2）
  const calculateMouthOpenWithConfidence = useCallback(
    (landmarks: Landmark[]): LandmarkConfidence => {
      const upperLips = [
        landmarks[LIP_LANDMARKS.upperCenter],
        landmarks[LIP_LANDMARKS.upperLeft],
        landmarks[LIP_LANDMARKS.upperRight],
      ].filter(Boolean) as Landmark[];

      const lowerLips = [
        landmarks[LIP_LANDMARKS.lowerCenter],
        landmarks[LIP_LANDMARKS.lowerLeft],
        landmarks[LIP_LANDMARKS.lowerRight],
      ].filter(Boolean) as Landmark[];

      if (upperLips.length === 0 || lowerLips.length === 0) {
        return { ratio: 0, confidence: 0 };
      }

      // 上唇と下唇のy座標の平均値を計算（案2: 複数参照）
      const upperLipYAvg = upperLips.reduce((sum, lip) => sum + lip.y, 0) / upperLips.length;
      const lowerLipYAvg = lowerLips.reduce((sum, lip) => sum + lip.y, 0) / lowerLips.length;
      const mouthOpenRatio = Math.abs(lowerLipYAvg - upperLipYAvg) * 10;

      // 信頼度の計算（案1: z値の分散をチェック）
      const allLips = [...upperLips, ...lowerLips];
      const zValues = allLips.map((lip) => lip.z);
      const zAvg = zValues.reduce((sum, z) => sum + z, 0) / zValues.length;
      const zVariance =
        zValues.reduce((sum, z) => sum + Math.pow(z - zAvg, 2), 0) / zValues.length;

      // z値の分散が大きい（=手が映り込んでいる）場合は信頼度を低下
      let confidence = 1.0;
      if (zVariance > LANDMARK_Z_CONFIDENCE_THRESHOLD) {
        confidence *= 0.5; // 信頼度を50%に低下
      }
      if (zAvg > LANDMARK_Z_MAX_THRESHOLD) {
        confidence *= 0.5; // z値が大きい場合も信頼度を低下
      }

      return { ratio: Math.min(mouthOpenRatio, 1), confidence };
    },
    []
  );

  // 時間フィルタリング関数（案5）
  const applyTimeFiltering = useCallback((ratio: number): number => {
    // 履歴に現在のフレーム値を追加
    mouthRatioHistoryRef.current.push(ratio);

    // 履歴サイズを保持
    if (mouthRatioHistoryRef.current.length > MOUTH_RATIO_HISTORY_SIZE) {
      mouthRatioHistoryRef.current.shift();
    }

    // 指数移動平均（EMA）で平滑化
    const newSmoothed =
      MOUTH_RATIO_SMOOTH_FACTOR * ratio +
      (1 - MOUTH_RATIO_SMOOTH_FACTOR) * smoothedRatioRef.current;
    smoothedRatioRef.current = newSmoothed;

    return newSmoothed;
  }, []);

  const handleResults = useCallback(
    (results: {
      multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>>
    }) => {
      if (!results.multiFaceLandmarks?.length) {
        setFaceState({ mouthOpen: false, mouthOpenRatio: 0, landmarks: null });
        return;
      }
      const landmarks = results.multiFaceLandmarks[0] as Landmark[];
      const { ratio, confidence } = calculateMouthOpenWithConfidence(landmarks);

      // 信頼度が低い場合は前フレームの値を使用（案1: フォールバック）
      const reliableRatio = confidence > 0.6 ? ratio : prevMouthRatioRef.current;
      prevMouthRatioRef.current = reliableRatio;

      // 時間フィルタリングで平滑化（案5）
      const smoothedRatio = applyTimeFiltering(reliableRatio);

      setFaceState({
        mouthOpen: smoothedRatio > MOUTH_OPEN_THRESHOLD,
        mouthOpenRatio: smoothedRatio,
        landmarks,
      });
    },
    [calculateMouthOpenWithConfidence, applyTimeFiltering]
  );

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
          if (video.readyState >= 2) await faceMesh.send({ image: video });
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
