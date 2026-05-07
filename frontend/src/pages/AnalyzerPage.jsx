import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe, Target, Search, Loader2, AlertCircle, CheckCircle, Brain, Info, MessageCircle, Send, X, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import ScoreGauge from '../components/ScoreGauge';

import FullScreenAudit from '../components/FullScreenAudit';

export default function AnalyzerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [url, setUrl] = useState(location.state?.url || '');
  const [goal, setGoal] = useState(location.state?.goal || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "Hi! I've analyzed your site. Ask me anything about your score, or say 'what should I fix first?' to get started." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [annotations, setAnnotations] = useState([]);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [isOutOfContext, setIsOutOfContext] = useState(false);
  const [showFullScreenAudit, setShowFullScreenAudit] = useState(false);
  const [auditThumbnail, setAuditThumbnail] = useState(null);

  const tips = [
    "Crawling page structure and navigation depth...",
    "Calculating cognitive friction signals...",
    "Scoring visual clarity and content readability...",
    "Checking if your goal is reachable from the homepage...",
    "Almost done — generating your cognitive waste report..."
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 4000);
    } else {
      setCurrentTipIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze', { url, goal });
      const data = response.data;
      if (data.screenshotBase64) {
        data.screenshotBase64 = data.screenshotBase64.replace(/[\r\n\s]/g, '');
      }
      setResult(data);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.error || 'This website blocked automated access. Try a different site.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: userMessage,
        scanResult: result,
        screenshotBase64: result?.screenshotBase64 || null
      });
      const { reply, annotations: newAnnotations, isOutOfContext: outOfContext } = response.data;

      if (outOfContext) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: "⚠️ That request is outside the scope of cognitive waste analysis. I can only provide visual guidance related to your website's UX, navigation, layout, content, or interaction issues. Try asking something like: *'visually show me where to reduce navigation waste'*."
        }]);
        setShowAnnotations(false);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        if (newAnnotations && newAnnotations.length > 0) {
          setAnnotations(newAnnotations);
          setAuditThumbnail(null);
          setShowFullScreenAudit(true);
        }
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleThumbnailReady = useCallback((dataUrl) => {
    setAuditThumbnail(dataUrl);
    setChatMessages(prev => [...prev, {
      role: 'thumbnail',
      content: dataUrl
    }]);
  }, []);

  const handleLegendReady = useCallback((legendText) => {
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: legendText
    }]);
  }, []);

  useEffect(() => {
    if (result) {
      setChatOpen(false);
      setShowAnnotations(false);
      setShowFullScreenAudit(false);
      setAuditThumbnail(null);
      setAnnotations([]);
      setChatMessages([{ role: 'assistant', content: "Hi! I've analyzed your site. Ask me anything about your score, or say 'what should I fix first?' to get started." }]);
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        {!result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center">
            <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Analyze Website</h1>
            <p className="text-gray-400 text-lg mb-2">Enter a URL and a user goal to detect cognitive waste and friction points.</p>
            <p className="text-xs text-gray-500 mt-2 max-w-xl mx-auto mb-10">
              Works best on blogs, portfolios, college sites, and small business websites. 
              Large platforms like Amazon, Flipkart, or Google may block automated access — this is expected behavior, not a bug.
            </p>
            
            <form onSubmit={handleAnalyze} className="bg-gray-900/50 p-8 rounded-3xl border border-gray-800 backdrop-blur-xl space-y-6">
              <div className="text-left space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-black/50 border border-gray-800 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="text-left space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">User Goal</label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" value={goal} onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Find contact information"
                    className="w-full bg-black/50 border border-gray-800 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-600/20">
                Analyze Website
              </button>
            </form>
          </motion.div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Website...</h2>
            <p className="text-gray-400 italic text-sm">{tips[currentTipIndex]}</p>
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button onClick={() => {setError(''); setUrl('');}} className="bg-white text-black px-6 py-2 rounded-lg font-bold">Try Another Site</button>
          </div>
        )}

        {result && (
          <div className="relative w-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`space-y-12 transition-all duration-300 ${chatOpen ? 'md:mr-[420px]' : ''}`}
            >
              {result.isPartialCrawl && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-6 py-4 flex gap-4 items-start"
                >
                  <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-yellow-400 font-bold text-sm mb-1">Partial Crawl — Results May Be Incomplete</div>
                    <div className="text-yellow-300/70 text-xs leading-relaxed">
                      Our crawler could only partially access this site. The score below is based on limited data and may not reflect the full picture.
                    </div>
                    {result.partialCrawlReasons?.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {result.partialCrawlReasons.map((reason, i) => (
                          <div key={i} className="text-yellow-500/60 text-xs flex gap-2">
                            <span>·</span><span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              <div className="border-b border-gray-800 pb-12">
                {/* Site header — compact top bar */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-10"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-4"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Analysis Complete
                  </motion.div>
                  <h1 className="text-4xl font-black mb-2 break-all bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {new URL(result.url).hostname}
                  </h1>
                  <p className="text-gray-500 text-sm">Goal: <span className="text-gray-300 italic">"{result.goal}"</span></p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-full font-black text-sm border ${
                      result.grade === 'A' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      result.grade === 'F' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    } shadow-lg`}
                    style={{ boxShadow: result.grade === 'A' ? '0 0 20px rgba(74,222,128,0.2)' : result.grade === 'F' ? '0 0 20px rgba(248,113,113,0.2)' : '0 0 20px rgba(234,179,8,0.2)' }}
                  >
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: result.grade === 'A' ? '#4ade80' : result.grade === 'F' ? '#f87171' : '#eab308' }} />
                    GRADE: {result.gradeLabel}
                  </motion.div>
                </motion.div>

                {/* Dashboard row — 2 cards | gauge | 2 cards */}
                <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                  {/* Left cards */}
                  <div className="flex flex-row lg:flex-col gap-4">
                    {[
                      { key: 'navigationWaste', label: 'Navigation', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
                      { key: 'visualWaste', label: 'Visual', color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        whileHover={{ scale: 1.03 }}
                        className={`${item.bg} border ${item.border} rounded-2xl p-4 text-center w-40 sm:w-48`}
                      >
                        <div className={`text-3xl font-black ${item.color}`}>{result.factors[item.key]}<span className="text-sm text-gray-500">/20</span></div>
                        <div className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{item.label} Waste</div>
                        <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(result.factors[item.key] / 20) * 100}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color.replace('text-', '').replace('-400', '') === 'red' ? '#f87171' : '#fb923c' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Center gauge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-900/60 p-8 rounded-3xl border border-gray-700 shadow-2xl relative overflow-hidden"
                    style={{ boxShadow: '0 0 80px rgba(168,85,247,0.2), 0 0 160px rgba(168,85,247,0.05)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <ScoreGauge score={result.cognitiveScore} label="Cognitive Waste Score" />
                  </motion.div>

                  {/* Right cards */}
                  <div className="flex flex-row lg:flex-col gap-4">
                    {[
                      { key: 'contentWaste', label: 'Content', color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/5' },
                      { key: 'interactionWaste', label: 'Interaction', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        whileHover={{ scale: 1.03 }}
                        className={`${item.bg} border ${item.border} rounded-2xl p-4 text-center w-40 sm:w-48`}
                      >
                        <div className={`text-3xl font-black ${item.color}`}>{result.factors[item.key]}<span className="text-sm text-gray-500">/20</span></div>
                        <div className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{item.label} Waste</div>
                        <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(result.factors[item.key] / 20) * 100}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color.replace('text-', '').replace('-400', '') === 'green' ? '#4ade80' : '#60a5fa' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Goal waste — centered below */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  className="mt-6 mx-auto w-64 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 text-center"
                >
                  <div className="text-3xl font-black text-yellow-400">{result.factors.goalWaste}<span className="text-sm text-gray-500">/20</span></div>
                  <div className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Goal Waste</div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.factors.goalWaste / 20) * 100}%` }}
                      transition={{ delay: 0.7, duration: 0.8 }}
                      className="h-full rounded-full bg-yellow-400"
                    />
                  </div>
                </motion.div>
              </div>



              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left — Friction Points */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-6">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <h3 className="text-2xl font-bold text-red-400">Friction Points</h3>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">{result.issues.length}</span>
                  </div>
                  <div className="space-y-4">
                    {result.issues.map((issue, idx) => {
                      const categoryColors = {
                        navigation: { border: 'border-l-red-500', glow: 'hover:shadow-red-500/10' },
                        interaction: { border: 'border-l-blue-500', glow: 'hover:shadow-blue-500/10' },
                        goal: { border: 'border-l-yellow-500', glow: 'hover:shadow-yellow-500/10' },
                        design: { border: 'border-l-orange-500', glow: 'hover:shadow-orange-500/10' },
                        content: { border: 'border-l-green-500', glow: 'hover:shadow-green-500/10' },
                        seo: { border: 'border-l-purple-500', glow: 'hover:shadow-purple-500/10' },
                        accessibility: { border: 'border-l-pink-500', glow: 'hover:shadow-pink-500/10' },
                      };
                      const c = categoryColors[issue.category] || categoryColors['interaction'];
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.07 }}
                          whileHover={{ scale: 1.01 }}
                          className={`bg-black/40 p-5 rounded-2xl border border-gray-800 border-l-4 ${c.border} shadow-lg ${c.glow} hover:shadow-xl transition-all duration-300`}
                        >
                          <h4 className="font-bold text-white text-base mb-1">{issue.title}</h4>
                          <p className="text-gray-400 text-sm mb-3">{issue.detail}</p>
                          <div className="flex items-start gap-2 bg-purple-500/10 p-3 rounded-lg text-purple-300 text-sm italic">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> Suggestion: {issue.suggestion}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Right — AI Strategy sticky panel */}
                <div className="lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-8">
                  <div
                    className="rounded-3xl p-6 border border-purple-500/20"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.05) 0%, rgba(59,130,246,0.05) 100%)',
                      boxShadow: '0 0 40px rgba(168,85,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">AI Strategy</h3>
                    </div>
                    <div className="space-y-6">
                      {Object.entries(result.aiSuggestionsToOvercomeCognitiveWaste).map(([key, list], ki) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + ki * 0.1 }}
                        >
                          <div className="text-xs font-black uppercase tracking-widest text-purple-400/60 mb-3">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </div>
                          <div className="space-y-2">
                            {list.map((item, i) => (
                              <div key={i} className="flex gap-2 text-gray-300 text-xs leading-relaxed">
                                <div className="w-1 h-1 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                                {item}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating chat button */}
            <button
              onClick={() => setChatOpen(true)}
              className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-full shadow-lg shadow-purple-600/30 font-bold transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Ask AI Auditor
            </button>

            {/* Chat side panel */}
            <AnimatePresence>
              {chatOpen && (
                <motion.div
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 h-full w-full md:w-[420px] z-50 bg-[#0a0a0a] border-l border-gray-800 flex flex-col shadow-2xl"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">AI Auditor</div>
                        <div className="text-xs text-gray-500">Score: {result?.cognitiveScore}/100 · {result?.gradeLabel}</div>
                      </div>
                    </div>
                    <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Screenshot preview */}
                  {result?.screenshotBase64 && (
                    <div className="px-4 pt-4">
                      <img
                        src={`data:image/jpeg;base64,${result.screenshotBase64}`}
                        alt="Site screenshot"
                        className="w-full rounded-xl border border-gray-800 object-cover max-h-40"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'thumbnail' ? (
                          <div className="w-full cursor-pointer group" onClick={() => setShowFullScreenAudit(true)}>
                            <img
                              src={msg.content}
                              alt="Visual Audit"
                              className="w-full rounded-xl border border-purple-500/30 hover:border-purple-400 transition-all group-hover:scale-[1.02] transform duration-200"
                            />
                            <div className="text-center text-xs text-purple-400 mt-1 font-medium">Tap to replay visual audit</div>
                          </div>
                        ) : (
                          <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-purple-600 text-white rounded-br-sm'
                              : 'bg-gray-900 text-gray-200 border border-gray-800 rounded-bl-sm'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <div className="text-sm text-gray-200 leading-relaxed space-y-2">
                                <ReactMarkdown
                                  components={{
                                    p: ({children}) => <p className="my-0.5">{children}</p>,
                                    h1: ({children}) => <h1 className="text-base font-bold text-white mt-2 mb-0.5">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-sm font-bold text-white mt-2 mb-0.5">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-sm font-semibold text-purple-300 mt-1.5 mb-0.5">{children}</h3>,
                                    ul: ({children}) => <ul className="my-0.5 pl-3 space-y-0">{children}</ul>,
                                    ol: ({children}) => <ol className="my-0.5 pl-3 space-y-0">{children}</ol>,
                                    li: ({children}) => <li className="text-gray-300 text-sm leading-snug list-disc">{children}</li>,
                                    code: ({inline, children}) => inline
                                      ? <code className="text-purple-300 bg-black/40 px-1 rounded text-xs">{children}</code>
                                      : <pre className="bg-black/60 border border-gray-700 rounded-lg p-2 my-1 overflow-x-auto text-xs text-green-300 leading-snug"><code>{children}</code></pre>,
                                    pre: ({children}) => <>{children}</>,
                                    strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                                    hr: () => <hr className="border-gray-700 my-1" />,
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              msg.content
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Quick prompts */}
                  <div className="px-4 pb-2 flex gap-2 flex-wrap">
                    {['What should I fix first?', 'Why is my score high?', 'Explain navigation waste'].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => { setChatInput(prompt); }}
                        className="text-xs bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-purple-500 px-3 py-1.5 rounded-full transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="px-4 py-4 border-t border-gray-800 flex gap-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Ask about your site..."
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={chatLoading || !chatInput.trim()}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed p-3 rounded-xl transition-all"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showFullScreenAudit && result?.screenshotBase64 && (
                <FullScreenAudit
                  screenshotBase64={result.screenshotBase64}
                  annotations={annotations}
                  onClose={() => setShowFullScreenAudit(false)}
                  onThumbnailReady={handleThumbnailReady}
                  onLegendReady={handleLegendReady}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
