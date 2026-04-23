'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { EffectType } from '@/types';

interface Props {
  effect: EffectType | null;
  mouthOpenRatio: number;
}

const EFFECT_CONFIG: Record<EffectType, { emoji: string; label: string; color: string }> = {
  lion:      { emoji: '🦁', label: 'ガオー！',     color: 'text-yellow-400' },
  beam:      { emoji: '⚡',  label: 'ビーム！',     color: 'text-blue-400'   },
  star:      { emoji: '⭐',  label: 'キラキラ！',   color: 'text-yellow-300' },
  rainbow:   { emoji: '🌈',  label: 'レインボー！', color: 'text-pink-400'   },
  fireworks: { emoji: '🎆',  label: 'ドーン！',     color: 'text-red-400'    },
};

export function EffectOverlay({ effect, mouthOpenRatio }: Props) {
  const config = effect ? EFFECT_CONFIG[effect] : null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 口の開き具合でグロー演出 */}
      {mouthOpenRatio > 0.2 && (
        <div
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 rounded-full blur-2xl bg-yellow-300 opacity-40"
          style={{
            width: `${mouthOpenRatio * 200}px`,
            height: `${mouthOpenRatio * 100}px`,
          }}
        />
      )}

      <AnimatePresence>
        {config && (
          <motion.div
            key={effect}
            initial={{ scale: 0, opacity: 0, y: 40 }}
            animate={{ scale: 1.2, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          >
            <span className="text-8xl drop-shadow-xl">{config.emoji}</span>
            <span className={`text-4xl font-black drop-shadow-lg ${config.color}`}>
              {config.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
