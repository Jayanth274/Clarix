import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

const FALLBACK_ZONES = {
  'top-left-header':   { xPct: 1,  yPct: 3,  wPct: 25, hPct: 8 },
  'top-center-header': { xPct: 30, yPct: 3,  wPct: 35, hPct: 8 },
  'top-right-header':  { xPct: 68, yPct: 3,  wPct: 30, hPct: 8 },
  'main-nav':          { xPct: 1,  yPct: 11, wPct: 97, hPct: 7 },
  'hero-section':      { xPct: 5,  yPct: 20, wPct: 90, hPct: 20 },
  'main-content':      { xPct: 5,  yPct: 42, wPct: 65, hPct: 30 },
  'bottom-footer':     { xPct: 1,  yPct: 83, wPct: 97, hPct: 12 },
  'left-sidebar':      { xPct: 1,  yPct: 20, wPct: 20, hPct: 60 },
  'right-sidebar':     { xPct: 75, yPct: 20, wPct: 23, hPct: 60 },
};

const CATEGORY_COLORS = {
  navigation:  { border: '#ef4444', bg: 'rgba(239,68,68,0.2)',  label: '#ef4444', text: 'Navigation' },
  interaction: { border: '#3b82f6', bg: 'rgba(59,130,246,0.2)', label: '#3b82f6', text: 'Interaction' },
  goal:        { border: '#eab308', bg: 'rgba(234,179,8,0.2)',  label: '#eab308', text: 'Goal' },
  visual:      { border: '#f97316', bg: 'rgba(249,115,22,0.2)', label: '#f97316', text: 'Visual' },
  content:     { border: '#22c55e', bg: 'rgba(34,197,94,0.2)',  label: '#22c55e', text: 'Content' },
};

function ScanLine() {
  return (
    <motion.div
      initial={{ top: '0%' }}
      animate={{ top: '100%' }}
      transition={{ duration: 1.5, ease: 'linear' }}
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{
        height: '3px',
        background: 'linear-gradient(90deg, transparent, #a855f7, #3b82f6, transparent)',
        boxShadow: '0 0 20px #a855f7, 0 0 40px #3b82f6',
      }}
    />
  );
}

export default function FullScreenAudit({ screenshotBase64, annotations, onClose, onThumbnailReady, onLegendReady }) {
  const [phase, setPhase] = useState('scanning');
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const containerRef = useRef(null);
  const hasCaptured = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('walkthrough'), 1800);
    return () => clearTimeout(t1);
  }, []);

  const capture = useCallback(async () => {
    if (hasCaptured.current || !containerRef.current) return;
    hasCaptured.current = true;
    try {
      const canvas = await html2canvas(containerRef.current, {
        useCORS: true, scale: 0.4, logging: false,
      });
      onThumbnailReady(canvas.toDataURL('image/jpeg', 0.7));
    } catch(e) {
      console.warn('Thumbnail capture failed:', e.message);
    }
  }, [onThumbnailReady]);

  const postLegend = useCallback(() => {
    const text = `📍 **Visual Audit — ${annotations.length} Issues Found**\n\n` +
      annotations.map((ann, idx) => {
        const color = CATEGORY_COLORS[ann.category] || CATEGORY_COLORS['interaction'];
        return `**${idx + 1}. ${ann.label}** *(${color.text})*\n${ann.description}`;
      }).join('\n\n');
    onLegendReady(text);
  }, [annotations, onLegendReady]);

  const handleNext = useCallback(() => {
    if (currentStep < annotations.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setDone(true);
      capture();
      postLegend();
    }
  }, [currentStep, annotations.length, capture, postLegend]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const ann = annotations[currentStep];
  const color = ann ? (CATEGORY_COLORS[ann.category] || CATEGORY_COLORS['interaction']) : null;

  const screenH = window.innerHeight - 48;
  const screenW = window.innerWidth;

  const coords = ann?.coords
    ? ann.coords
    : ann?.zone
    ? (FALLBACK_ZONES[ann.zone] || FALLBACK_ZONES['main-content'])
    : FALLBACK_ZONES['main-content'];

  const boxTop  = 48 + (coords.yPct / 100) * screenH;
  const boxLeft = (coords.xPct / 100) * screenW;
  const boxW    = (coords.wPct / 100) * screenW;
  const boxH    = (coords.hPct / 100) * screenH;

  // Smart label position — pick best quadrant
  const cardW = 220;
  const cardH = 100;
  const positions = [
    { lx: boxLeft + boxW / 2 - cardW / 2, ly: boxTop - cardH - 20 },
    { lx: boxLeft + boxW + 20,             ly: boxTop + boxH / 2 - cardH / 2 },
    { lx: boxLeft + boxW / 2 - cardW / 2, ly: boxTop + boxH + 20 },
    { lx: boxLeft - cardW - 20,            ly: boxTop + boxH / 2 - cardH / 2 },
  ];
  const validPos = positions.find(p =>
    p.lx >= 8 &&
    p.ly >= 50 &&
    p.lx + cardW <= screenW - 8 &&
    p.ly + cardH <= window.innerHeight - 80
  ) || positions[2];
  const lx = Math.max(8, Math.min(screenW - cardW - 8, validPos.lx));
  const ly = Math.max(50, Math.min(window.innerHeight - cardH - 80, validPos.ly));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black"
      ref={containerRef}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-white font-bold text-sm">AI Visual Audit</span>
          {phase === 'scanning' && <span className="text-purple-400 text-xs">Scanning page...</span>}
          {phase === 'walkthrough' && !done && (
            <span className="text-blue-400 text-xs">Step {currentStep + 1} of {annotations.length}</span>
          )}
          {done && <span className="text-green-400 text-xs">Audit Complete</span>}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Screenshot */}
      <div className="absolute inset-0 pt-12">
        <img
          src={`data:image/jpeg;base64,${screenshotBase64}`}
          alt="Site"
          className="w-full h-full object-contain object-top"
          style={{ filter: 'brightness(0.55)' }}
        />
      </div>

      {/* Scan line */}
      <AnimatePresence>
        {phase === 'scanning' && (
          <div className="absolute inset-0 pt-12 pointer-events-none z-20">
            <ScanLine />
          </div>
        )}
      </AnimatePresence>

      {/* Step annotation */}
      <AnimatePresence mode="wait">
        {phase === 'walkthrough' && !done && ann && (
          <React.Fragment key={currentStep}>
            {/* Spotlight — brighten just the annotated zone */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute pointer-events-none z-20"
              style={{
                top: boxTop,
                left: boxLeft,
                width: boxW,
                height: boxH,
                boxShadow: `0 0 0 9999px rgba(0,0,0,0.6)`,
                borderRadius: 8,
              }}
            />

            {/* Annotation box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="absolute pointer-events-none z-30"
              style={{
                top: boxTop,
                left: boxLeft,
                width: boxW,
                height: boxH,
                border: `3px solid ${color.border}`,
                backgroundColor: color.bg,
                boxShadow: `0 0 40px ${color.border}90, 0 0 80px ${color.border}40`,
                borderRadius: 8,
              }}
            />

            {/* Number badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
              className="absolute z-40 pointer-events-none flex items-center justify-center font-black text-white text-sm rounded-full"
              style={{
                top: boxTop - 18,
                left: boxLeft + boxW / 2 - 18,
                width: 36, height: 36,
                backgroundColor: color.border,
                boxShadow: `0 0 20px ${color.border}, 0 0 40px ${color.border}60`,
                border: '2px solid white',
              }}
            >
              {currentStep + 1}
            </motion.div>

            {/* Label card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="absolute z-40 pointer-events-none"
              style={{ left: lx, top: ly, width: cardW }}
            >
              <div
                className="rounded-2xl px-4 py-3 shadow-2xl border-2"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.95)',
                  borderColor: color.border,
                  boxShadow: `0 0 30px ${color.border}50, 0 8px 40px rgba(0,0,0,0.9)`,
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color.border }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: color.border }}>{color.text}</span>
                </div>
                <div className="text-white font-bold text-sm mb-1">{ann.label}</div>
                <div className="text-gray-300 text-xs leading-relaxed">{ann.description}</div>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Done screen */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center bg-black/90 border border-purple-500/30 rounded-3xl px-12 py-8 shadow-2xl"
              style={{ boxShadow: '0 0 60px rgba(168,85,247,0.4)' }}>
              <div className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-2">Audit Complete</div>
              <div className="text-white font-black text-3xl mb-1">{annotations.length} Issues Reviewed</div>
              <div className="text-gray-400 text-sm">Results saved in chat · Click X to close</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step progress bar */}
      {phase === 'walkthrough' && !done && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex gap-2">
          {annotations.map((_, idx) => (
            <div
              key={idx}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: idx === currentStep ? 24 : 8,
                backgroundColor: idx <= currentStep ? '#a855f7' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      )}

      {/* Navigation buttons */}
      {phase === 'walkthrough' && !done && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all"
            style={{ backgroundColor: '#a855f7', color: 'white', boxShadow: '0 0 20px rgba(168,85,247,0.5)' }}
          >
            {currentStep === annotations.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
