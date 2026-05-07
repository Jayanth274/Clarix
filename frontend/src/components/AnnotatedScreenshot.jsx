import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ZONE_POSITIONS = {
  'top-left-header':   { top: '2%',  left: '1%',  width: '25%', height: '8%' },
  'top-center-header': { top: '2%',  left: '30%', width: '35%', height: '8%' },
  'top-right-header':  { top: '2%',  left: '68%', width: '30%', height: '8%' },
  'main-nav':          { top: '10%', left: '1%',  width: '97%', height: '7%' },
  'hero-section':      { top: '18%', left: '5%',  width: '90%', height: '20%' },
  'main-content':      { top: '40%', left: '5%',  width: '65%', height: '30%' },
  'bottom-footer':     { top: '82%', left: '1%',  width: '97%', height: '12%' },
  'left-sidebar':      { top: '18%', left: '1%',  width: '20%', height: '60%' },
  'right-sidebar':     { top: '18%', left: '75%', width: '23%', height: '60%' },
};

const CATEGORY_COLORS = {
  navigation:  { border: '#ef4444', bg: 'rgba(239,68,68,0.15)',  label: 'bg-red-500',    text: 'Navigation' },
  interaction: { border: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'bg-blue-500',   text: 'Interaction' },
  goal:        { border: '#eab308', bg: 'rgba(234,179,8,0.15)',  label: 'bg-yellow-500', text: 'Goal' },
  visual:      { border: '#f97316', bg: 'rgba(249,115,22,0.15)', label: 'bg-orange-500', text: 'Visual' },
  content:     { border: '#22c55e', bg: 'rgba(34,197,94,0.15)',  label: 'bg-green-500',  text: 'Content' },
};

export default function AnnotatedScreenshot({ screenshotBase64, annotations, onClose }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    if (!annotations?.length) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= annotations.length) clearInterval(interval);
    }, 600);
    return () => clearInterval(interval);
  }, [annotations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.4 }}
      className="fixed bottom-0 left-0 right-0 md:right-[420px] z-40 bg-[#0a0a0a] border-t border-gray-800 shadow-2xl"
      style={{ height: '55vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm">Visual Audit</span>
          <div className="flex gap-2">
            {Object.entries(CATEGORY_COLORS).map(([key, val]) => (
              <span key={key} className={`${val.label} text-white text-xs px-2 py-0.5 rounded-full`}>
                {val.text}
              </span>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Screenshot + Annotations */}
      <div className="relative w-full overflow-hidden" style={{ height: 'calc(55vh - 53px)' }}>
        {screenshotBase64 ? (
          <>
            <img
              src={`data:image/jpeg;base64,${screenshotBase64}`}
              alt="Site screenshot"
              className="w-full h-full object-cover object-top"
            />
            <AnimatePresence>
              {annotations.slice(0, visibleCount).map((ann, i) => {
                const pos = ZONE_POSITIONS[ann.zone] || ZONE_POSITIONS['main-content'];
                const color = CATEGORY_COLORS[ann.category] || CATEGORY_COLORS['interaction'];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute rounded-lg pointer-events-none"
                    style={{
                      top: pos.top,
                      left: pos.left,
                      width: pos.width,
                      height: pos.height,
                      border: `3px solid ${color.border}`,
                      backgroundColor: color.bg,
                    }}
                  >
                    {/* Label */}
                    <div
                      className={`absolute -top-7 left-0 ${color.label} text-white text-xs font-bold px-3 py-1 rounded-t-md whitespace-nowrap shadow-lg`}
                    >
                      {i + 1}. {ann.label}
                    </div>
                    {/* Description tooltip */}
                    <div className="absolute bottom-1 left-1 right-1 bg-black/90 text-white text-xs font-medium px-3 py-1.5 rounded-lg leading-tight shadow-xl border border-white/10">
                      {ann.description}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Screenshot not available for this site.
          </div>
        )}
      </div>
    </motion.div>
  );
}
