'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { unlockAudio } from '@/lib/audio';

export default function StartPage() {
  const router = useRouter();

  const handleStart = () => {
    unlockAudio(); // iOSの音声ロックをスタートボタンのタップで解放
    router.push('/brush');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 flex flex-col items-center justify-center gap-8 px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="text-center"
      >
        <div className="text-8xl mb-4">🦷</div>
        <h1 className="text-4xl font-black text-white drop-shadow-lg leading-tight">
          はみがき
          <br />
          タイム！
        </h1>
        <p className="mt-3 text-blue-100 text-lg">口をあけて楽しもう！</p>
      </motion.div>

      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={handleStart}
        className="w-56 py-5 rounded-full bg-yellow-400 text-blue-900 text-2xl font-black shadow-xl shadow-yellow-300/50 active:shadow-none"
      >
        スタート！
      </motion.button>

      <p className="text-blue-200 text-sm">カメラを使います</p>
    </main>
  );
}
