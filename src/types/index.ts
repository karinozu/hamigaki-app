export type EffectType = 'lion' | 'fireworks' | 'beam' | 'train' | 'chicks' | 'cat';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceState {
  mouthOpen: boolean;
  mouthOpenRatio: number;
  landmarks: Landmark[] | null;
}

export interface BrushingSession {
  id: string;
  created_at: string;
  completed: boolean;
  duration_sec: number;
  effects_count: number;
}
