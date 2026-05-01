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

// ── 歯磨きBGM（オリジナル曲・著作権フリー）──────────────────────
// 120BPM・Cメジャー・8秒ループのオリジナルチューン
let bgmRunning = false;
let bgmTimer: ReturnType<typeof setTimeout> | null = null;
// マスターゲインノード：stopBrushingBGM() 時に即座にゲインを0にして既スケジュール音を無音化する
let bgmMasterGain: GainNode | null = null;

const BGM_BEAT = 0.5; // 120 BPM
const BGM_LOOP = 16;  // 16beats = 8s

type BgmNote = [number, number, number, number, OscillatorType];

const BGM_MELODY: BgmNote[] = [
  [0,    523.25, 0.40, 0.16, 'triangle'],  // C5
  [0.5,  659.25, 0.40, 0.16, 'triangle'],  // E5
  [1,    783.99, 0.40, 0.16, 'triangle'],  // G5
  [1.5,  659.25, 0.40, 0.16, 'triangle'],  // E5
  [2,    587.33, 0.72, 0.16, 'triangle'],  // D5
  [3,    698.46, 0.72, 0.16, 'triangle'],  // F5
  [4,    659.25, 0.40, 0.16, 'triangle'],  // E5
  [4.5,  783.99, 0.40, 0.16, 'triangle'],  // G5
  [5,    880.00, 0.40, 0.16, 'triangle'],  // A5
  [5.5,  783.99, 0.40, 0.16, 'triangle'],  // G5
  [6,    659.25, 0.72, 0.16, 'triangle'],  // E5
  [7,    587.33, 0.72, 0.16, 'triangle'],  // D5
  [8,    698.46, 0.40, 0.16, 'triangle'],  // F5
  [8.5,  880.00, 0.40, 0.16, 'triangle'],  // A5
  [9,   1046.50, 0.40, 0.16, 'triangle'],  // C6
  [9.5,  880.00, 0.40, 0.16, 'triangle'],  // A5
  [10,   783.99, 0.72, 0.16, 'triangle'],  // G5
  [11,   659.25, 0.72, 0.16, 'triangle'],  // E5
  [12,  1046.50, 0.40, 0.16, 'triangle'],  // C6
  [12.5, 880.00, 0.40, 0.16, 'triangle'],  // A5
  [13,   783.99, 0.40, 0.16, 'triangle'],  // G5
  [13.5, 659.25, 0.40, 0.16, 'triangle'],  // E5
  [14,   587.33, 0.40, 0.16, 'triangle'],  // D5
  [14.5, 523.25, 0.40, 0.16, 'triangle'],  // C5
  [15,   587.33, 1.30, 0.12, 'triangle'],  // D5（ロング）
];

const BGM_BASS: BgmNote[] = [
  [0,   130.81, 1.85, 0.09, 'sine'],  // C3
  [2,   196.00, 1.85, 0.09, 'sine'],  // G3
  [4,   130.81, 1.85, 0.09, 'sine'],  // C3
  [6,   174.61, 1.85, 0.09, 'sine'],  // F3
  [8,   174.61, 1.85, 0.09, 'sine'],  // F3
  [10,  130.81, 1.85, 0.09, 'sine'],  // C3
  [12,  196.00, 1.85, 0.09, 'sine'],  // G3
  [14,  130.81, 1.85, 0.09, 'sine'],  // C3
];

const BGM_SPARKLE: BgmNote[] = [
  [0,    2093.00, 0.12, 0.045, 'triangle'],  // C7
  [4,    2637.02, 0.12, 0.040, 'triangle'],  // E7
  [8,    3135.96, 0.12, 0.035, 'triangle'],  // G7
  [12,   2637.02, 0.12, 0.040, 'triangle'],  // E7
];

function scheduleBgmLoop(ctx: AudioContext, startTime: number) {
  if (!bgmRunning || !bgmMasterGain) return;

  const master = bgmMasterGain;
  const n = ([beat, freq, durBeats, vol, type]: BgmNote) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(master); // マスターゲイン経由で出力（即時停止対応）
    osc.type = type;
    osc.frequency.value = freq;
    const t = startTime + beat * BGM_BEAT;
    const dur = durBeats * BGM_BEAT;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.025);
    gain.gain.setValueAtTime(vol, t + dur * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.05);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  };

  [...BGM_MELODY, ...BGM_BASS, ...BGM_SPARKLE].forEach(n);

  const loopDur = BGM_LOOP * BGM_BEAT;
  const msUntil = (startTime + loopDur - ctx.currentTime - 0.15) * 1000;
  bgmTimer = setTimeout(
    () => scheduleBgmLoop(ctx, startTime + loopDur),
    Math.max(0, msUntil)
  );
}

export function startBrushingBGM(): void {
  if (bgmRunning) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  bgmRunning = true;
  bgmMasterGain = ctx.createGain();
  bgmMasterGain.gain.value = 1;
  bgmMasterGain.connect(ctx.destination);
  scheduleBgmLoop(ctx, ctx.currentTime + 0.2);
}

export function stopBrushingBGM(): void {
  bgmRunning = false;
  if (bgmTimer !== null) {
    clearTimeout(bgmTimer);
    bgmTimer = null;
  }
  // 既にスケジュール済みの音もマスターゲインを即座に0にして無音化
  if (bgmMasterGain) {
    const now = bgmMasterGain.context.currentTime;
    bgmMasterGain.gain.cancelScheduledValues(now);
    bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, now);
    bgmMasterGain.gain.linearRampToValueAtTime(0, now + 0.08);
    const oldGain = bgmMasterGain;
    bgmMasterGain = null;
    setTimeout(() => { try { oldGain.disconnect(); } catch { /* ignore */ } }, 300);
  }
}
