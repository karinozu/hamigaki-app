// iOS Safari はユーザー操作なしに AudioContext を使えないため、
// スタート画面のタップ時に一度生成・解放しておく共有インスタンス

let _ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_ctx) {
      const Ctor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      _ctx = new Ctor();
    }
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

// スタートボタンタップ時に呼ぶ（iOSの音声ロック解除）
export function unlockAudio(): void {
  getAudioContext();
}
