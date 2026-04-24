'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getAudioContext } from '@/lib/audio';

function playCompleteMusic() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const n = (
    freq: number, t: number, dur: number,
    vol = 0.24, type: OscillatorType = 'sine'
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const s = ctx.currentTime + t;
    gain.gain.setValueAtTime(0, s);
    gain.gain.linearRampToValueAtTime(vol, s + 0.02);
    gain.gain.setValueAtTime(vol, s + dur * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, s + dur + 0.06);
    osc.start(s);
    osc.stop(s + dur + 0.1);
  };

  // ── パート1：ファンファーレ（0〜0.6秒）──
  n(523.25,  0.00, 0.11); // C5
  n(659.25,  0.13, 0.11); // E5
  n(783.99,  0.26, 0.11); // G5
  n(1046.50, 0.39, 0.20); // C6

  // ── パート2：メインテーマ（0.65〜2.6秒）──
  n(659.25,  0.65, 0.14); // E5
  n(783.99,  0.81, 0.14); // G5
  n(1046.50, 0.97, 0.14); // C6
  n(987.77,  1.13, 0.14); // B5
  n(783.99,  1.29, 0.24); // G5

  n(659.25,  1.57, 0.14); // E5
  n(698.46,  1.73, 0.14); // F5
  n(783.99,  1.89, 0.14); // G5
  n(880.00,  2.05, 0.14); // A5
  n(783.99,  2.21, 0.26); // G5

  // ── パート3：フィナーレ（2.55〜5.0秒）──
  n(1046.50, 2.55, 0.14); // C6
  n(880.00,  2.71, 0.14); // A5
  n(783.99,  2.87, 0.14); // G5
  n(659.25,  3.03, 0.14); // E5
  n(783.99,  3.19, 0.14); // G5
  n(1046.50, 3.35, 1.40); // C6 ─ 長く伸ばす

  // ── ハーモニー（三角波・柔らかく）──
  n(261.63, 0.00, 0.55, 0.11, 'triangle'); // C4
  n(261.63, 0.65, 0.68, 0.11, 'triangle'); // C4
  n(174.61, 1.57, 0.68, 0.11, 'triangle'); // F3
  n(196.00, 2.21, 0.34, 0.11, 'triangle'); // G3
  n(261.63, 2.55, 2.20, 0.13, 'triangle'); // C4 ─ 伸ばし

  // ── キラキラ装飾音 ──
  n(2093.00, 0.39, 0.10, 0.09); // C7（ファンファーレ頂点）
  n(2637.02, 0.43, 0.09, 0.07); // E7
  n(2093.00, 3.35, 0.14, 0.09); // C7（フィナーレ）
  n(2637.02, 3.40, 0.14, 0.07); // E7
  n(3135.96, 3.46, 0.55, 0.06); // G7 ─ 締め
}

export default function CompletePage() {
  const router = useRouter();

  useEffect(() => {
    playCompleteMusic();
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
