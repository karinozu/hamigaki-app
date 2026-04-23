export type EffectType = 'lion' | 'beam' | 'star' | 'rainbow' | 'fireworks';

export interface FaceState {
  mouthOpen: boolean;
  mouthOpenRatio: number; // 0.0 - 1.0
}

export interface BrushingSession {
  id: string;
  created_at: string;
  completed: boolean;
  duration_sec: number;
  effects_count: number;
}
