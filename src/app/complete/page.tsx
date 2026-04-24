'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

function playCompleteSound() {
  try {
    const AudioCtx = window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const se = (freq: number, t: number, dur: number, vol = 0.3) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const s = ctx.currentTime + t;
      gain.gain.setValueAtTime(vol, s);
      gain.gain.exponentialRampToValueAtTime(0.001, s + dur);
      osc.start(s);
      osc.stop(s + dur);
    };

    // 「ぴろりん♪」という短い達成効果音（約0.6秒）
    se(880.00,  0.00, 0.10, 0.30); // A5 ─ 出だしパンチ
    se(1046.50, 0.10, 0.10, 0.28); // C6
    se(1318.51, 0.20, 0.10, 0.26); // E6
    se(1567.98, 0.30, 0.35, 0.30); // G6 ─ 伸ばしてキラン
    se(2093.00, 0.32, 0.25, 0.14); // C7 ─ 重ねてキラキラ感
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
        <h1 className="text-[clamp(1.6rem,8vw,3rem)] font-black text-white drop-shadow-xl whitespace-nowrap">
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
