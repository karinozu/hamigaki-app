'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function CompletePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 完了音声再生（public/audio/complete.mp3 が存在する場合）
    audioRef.current = new Audio('/audio/complete.mp3');
    audioRef.current.play().catch(() => {/* 音声ファイル未配置時は無視 */});
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
