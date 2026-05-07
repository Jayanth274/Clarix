import React from 'react';
import { motion } from 'framer-motion';

const ScoreGauge = ({ score, label, delay = 0, size = 'large' }) => {
  const isHigh = score > 60;
  const isMedium = score > 30;
  const color = isHigh ? '#f87171' : isMedium ? '#facc15' : '#4ade80'; // red-400, yellow-400, green-400

  // Size variants
  const dims = size === 'large' ? { w: 40, r: 45, str: 8, txt: 'text-5xl' }
    : { w: 24, r: 40, str: 6, txt: 'text-3xl' };

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <div className={`relative w-${dims.w} h-${dims.w} flex items-center justify-center`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={dims.r} fill="none" stroke="#1f2937" strokeWidth={dims.str} />
          <motion.circle
            cx="50"
            cy="50"
            r={dims.r}
            fill="none"
            stroke={color}
            strokeWidth={dims.str}
            strokeLinecap="round"
            strokeDasharray="251" // 2 * pi * 40 approx
            initial={{ strokeDashoffset: 251 }}
            animate={{ strokeDashoffset: 251 - (251 * score) / 100 }}
            transition={{ duration: 1.5, delay, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.5 }}
            className={`${dims.txt} font-bold text-white tracking-tighter`}
          >
            {Math.round(score)}
          </motion.span>
          {size === 'large' && <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">/ 100</span>}
        </div>
      </div>
      {label && <h3 className="mt-4 text-lg font-medium text-gray-300">{label}</h3>}
    </div>
  );
};

export default ScoreGauge;
