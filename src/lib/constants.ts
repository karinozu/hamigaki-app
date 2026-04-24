export const BRUSH_DURATION_SEC = 120;
export const MOUTH_OPEN_THRESHOLD = 0.35;

// ランドマーク信頼度スコア関連
export const LANDMARK_Z_CONFIDENCE_THRESHOLD = 0.3; // z値の分散が大きいと信頼度が低い
export const LANDMARK_Z_MAX_THRESHOLD = 0.1; // z値が大きすぎる場合は背景と判定

// 時間フィルタリング関連（案5）
export const MOUTH_RATIO_HISTORY_SIZE = 5; // 移動平均に使用するフレーム数
export const MOUTH_RATIO_SMOOTH_FACTOR = 0.3; // 指数移動平均の平滑化係数（0-1）
