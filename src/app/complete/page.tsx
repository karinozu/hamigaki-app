'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

function playCompleteSound() {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // ファンファーレ風：明るい上昇メロディ
    const melody = [
      { freq: 523.25, t: 0.00 },  // C5
      { freq: 659.25, t: 0.12 },  // E5
      { freq: 783.99, t: 0.24 },  // G5
      { freq: 1046.50, t: 0.36 }, // C6
      { freq: 1318.51, t: 0.52 }, // E6
      { freq: 1567.98, t: 0.65 }, // G6
    ];

    melody.forEach(({ freq, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      const start = ctx.currentTime + t;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.start(start);
      osc.stop(start + 0.45);
    });
  } catch {
    // Web Audio API 非対応環境では無視
  }
}

export default function CompletePage() {
  const router = useRouter();

  useEffect(() => {
    playCompleteSound();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-300 to-orange-400 flex flex-col items-center justify-center gap-8 px-6">
      {/* 花火アニメーション */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🎉', '🌟', '✨', '🎊', '⭐'].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-4xl"
            initial={{ y: '110%', x: `${10 + i * 20}%`, opacity: 0 }}
            animate={{ y: '-10%', opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.8, delay: i * 0.3, repeat: Infinity, repeatDelay: 1 }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="text-center z-10"
      >
        <div className="text-9xl mb-4">🏆</div>
        <h1 className="text-5xl font-black text-white drop-shadow-xl">
          よくできました！
        </h1>
        <p className="mt-3 text-orange-100 text-xl font-bold">
          はみがき完了だよ🦷✨
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => router.push('/')}
        className="z-10 w-56 py-5 rounded-full bg-white text-orange-500 text-2xl font-black shadow-xl"
      >
        もういちど！
      </motion.button>
    </main>
  );
}
