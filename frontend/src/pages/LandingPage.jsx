import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, TrendingUp, ArrowRight, BarChart2, Layers, Globe, Search } from 'lucide-react';

const TerminalDemo = () => {
  const lines = [
    "$ Launching headless browser...",
    "$ Navigating to target URL...",
    "✓ Page loaded — extracting DOM structure",
    "$ Analyzing navigation depth: 3 levels found",
    "$ Counting interactive elements: 47 buttons, 120 links",
    "$ Running readability scan on text content...",
    "✓ Flesch-Kincaid grade level: 8.2",
    "$ Checking mobile responsiveness...",
    "✓ Viewport adapts correctly",
    "$ Goal keyword search: 'contact' found at depth 1",
    "$ Computing Cognitive Waste Score...",
    "✓ Navigation Waste: 5/20",
    "✓ Visual Waste: 7/20",
    "✓ Content Waste: 3/20",
    "✓ Interaction Waste: 8/20",
    "✓ Goal Waste: 0/20",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "COGNITIVE WASTE SCORE: 23 / 100",
    "GRADE: Good — Low cognitive friction detected",
  ];

  const [visibleLines, setVisibleLines] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < lines.length) {
      const timeout = setTimeout(() => {
        setVisibleLines(prev => [...prev, lines[index]]);
        setIndex(prev => prev + 1);
      }, 600);
      return () => clearTimeout(timeout);
    } else {
      const resetTimeout = setTimeout(() => {
        setVisibleLines([]);
        setIndex(0);
      }, 2000);
      return () => clearTimeout(resetTimeout);
    }
  }, [index]);

  return (
    <div className="font-mono text-green-400 bg-black p-6 rounded-xl h-full overflow-y-auto text-xs leading-relaxed scrollbar-hide">
      {visibleLines.map((line, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className={line.startsWith('✓') || line.startsWith('G') ? 'text-green-300' : line.startsWith('C') ? 'text-purple-400 font-bold' : ''}>
            {line}
          </span>
          {i === visibleLines.length - 1 && index < lines.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-1.5 h-4 bg-green-400 inline-block"
            />
          )}
        </div>
      ))}
      {index === lines.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="w-1.5 h-4 bg-green-400 inline-block ml-1"
        />
      )}
    </div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { icon: Globe, title: "Enter URL & Goal", desc: "Paste any public website URL and describe what a user is trying to accomplish — like 'find contact info' or 'buy a product'." },
    { icon: Search, title: "Deep DOM Crawl", desc: "A headless Playwright browser fully renders the page, captures a screenshot, and extracts real element coordinates, link depth, readability, and interaction data." },
    { icon: BarChart2, title: "Cognitive Waste Score", desc: "Five categories — Navigation, Visual, Content, Interaction, and Goal — are each scored out of 20. Higher score means more waste, worse UX." },
    { icon: Zap, title: "AI Visual Audit", desc: "Ask the AI Auditor anything about your score. Say 'visually show me' to trigger a full-screen annotated walkthrough of your site's real friction points." },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [steps.length]);


  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-purple-500/30">

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] opacity-20" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Brain className="w-6 h-6 text-purple-400" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">CognitiveWaste</span>
          <span className="text-[10px] text-purple-500/50 font-mono mt-1">v1.2.0-Live</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <button onClick={() => navigate('/analyze')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md transition-all">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Now with AI-powered Cognitive Scoring</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight leading-tight">
            Stop
            <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x pb-2">
              Cognitive Waste
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Quantify the <span className="text-gray-200 font-semibold">invisible mental friction</span> on your website.
            Optimize UX with AI-driven insights that measure fatigue, confusion, and complexity.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/analyze')}
              className="group relative px-8 py-5 rounded-2xl bg-white text-black text-lg font-bold flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Analyze Website</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/comparison')}
              className="px-8 py-5 rounded-2xl glass text-white text-lg font-bold flex items-center gap-3 hover:bg-white/10 transition-colors"
            >
              <BarChart2 className="w-5 h-5" />
              Compare Competitors
            </motion.button>
          </div>
        </motion.div>

        {/* Floating UI Elements Demo */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-20 relative max-w-4xl mx-auto"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-30" />
          <div className="relative glass-card p-4 md:p-8 rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { label: 'Cognitive Score', value: '23', color: 'text-green-400', icon: Brain },
                { label: 'Visual Clarity', value: '94%', color: 'text-blue-400', icon: Zap },
                { label: 'Friction Index', value: 'Low', color: 'text-purple-400', icon: Layers },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 h-64 bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl">
              <TerminalDemo />
            </div>
          </div>
        </motion.div>

      </div>

      {/* Features Section */}
      <div id="features" className="relative z-10 container mx-auto px-4 py-24 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-purple-300 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            What makes this different
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">Beyond Simple Analytics</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Brain,
              title: 'Real DOM Analysis',
              desc: 'A headless Playwright browser fully renders your site, captures a screenshot, and extracts real element coordinates — not guesses.',
              gradient: 'from-purple-500/20 to-blue-500/20',
              glow: 'rgba(168,85,247,0.15)',
              accent: '#a855f7',
              tag: 'Playwright + Chromium',
            },
            {
              icon: Zap,
              title: 'AI Visual Audit',
              desc: 'Trigger a full-screen annotated walkthrough of your site. Every friction point highlighted on your actual screenshot with precision.',
              gradient: 'from-blue-500/20 to-cyan-500/20',
              glow: 'rgba(59,130,246,0.15)',
              accent: '#3b82f6',
              tag: 'AI Powered',
            },
            {
              icon: TrendingUp,
              title: 'Compare Competitors',
              desc: 'Scan two websites side by side and get an instant winner declaration with a detailed score breakdown for each.',
              gradient: 'from-green-500/20 to-emerald-500/20',
              glow: 'rgba(34,197,94,0.15)',
              accent: '#22c55e',
              tag: 'Side by Side',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative rounded-3xl p-8 border border-white/8 overflow-hidden group transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: `0 0 0 1px rgba(255,255,255,0.05)`,
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 40px ${feature.glow}, 0 0 0 1px rgba(255,255,255,0.08)`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 0 1px rgba(255,255,255,0.05)`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${feature.glow}, transparent)`, border: `1px solid ${feature.accent}30` }}>
                    <feature.icon className="w-7 h-7" style={{ color: feature.accent }} />
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded-full border text-gray-500" style={{ borderColor: `${feature.accent}30`, color: feature.accent }}>
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
                <div className="mt-6 h-px w-full" style={{ background: `linear-gradient(90deg, ${feature.accent}40, transparent)` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="relative z-10 container mx-auto px-4 py-24 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-blue-300 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Four steps to clarity
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">How It Works</h2>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Steps List */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={index}
                onClick={() => setActiveStep(index)}
                className={`cursor-pointer p-6 rounded-2xl border-l-4 transition-all duration-300 ${
                  activeStep === index
                    ? 'border-purple-500 bg-white/5 text-white'
                    : 'border-transparent text-gray-500 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    activeStep === index ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {index + 1}
                  </span>
                  <step.icon className={`w-6 h-6 ${activeStep === index ? 'text-purple-400' : 'text-gray-500'}`} />
                  <h3 className="text-xl font-bold">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed ml-12">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column: Active Step Detail */}
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-3xl p-8 border border-white/10 bg-white/5 min-h-[400px] flex flex-col items-center justify-center text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(59,130,246,0.3))', boxShadow: '0 0 40px rgba(168,85,247,0.3)' }}
            >
              {React.createElement(steps[activeStep].icon, { className: "w-10 h-10 text-white" })}
            </motion.div>
            <div className="text-xs font-bold uppercase tracking-widest text-purple-400/60 mb-3">Step {activeStep + 1} of {steps.length}</div>
            <h3 className="text-2xl font-bold mb-4 text-white">{steps[activeStep].title}</h3>
            <p className="text-gray-400 max-w-sm leading-relaxed text-sm">{steps[activeStep].desc}</p>
            <div className="flex gap-2 mt-8">
              {steps.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className="h-1.5 rounded-full cursor-pointer transition-all duration-300"
                  style={{ width: i === activeStep ? 24 : 8, backgroundColor: i === activeStep ? '#a855f7' : 'rgba(255,255,255,0.15)' }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Sparkles(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
