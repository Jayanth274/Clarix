import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe, Target, Loader2, AlertCircle, Brain, BarChart2, ShieldCheck, TrendingDown } from 'lucide-react';
import axios from 'axios';
import ScoreGauge from '../components/ScoreGauge';


export default function ComparisonPage() {
  const navigate = useNavigate();
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState('');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    "Crawling Website 1 — analyzing structure and navigation...",
    "Scoring Website 1 cognitive friction factors...",
    "Now crawling Website 2 — this runs sequentially...",
    "Scoring Website 2 and comparing results...",
    "Determining the winner based on cognitive waste scores..."
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

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!url1 || !url2) return;

    setLoading(true);
    setError('');
    setComparison(null);

    try {
      const response = await axios.post('http://localhost:5000/api/compare', { url1, url2, goal });
      setComparison(response.data);
    } catch (err) {
      console.error('Comparison failed:', err);
      setError('Comparison failed or blocked by one of the websites.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        {!comparison && !loading && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Compare Websites</h1>
              <p className="text-gray-400 text-lg mb-2">Benchmark two interfaces side-by-side to find the superior UX.</p>
              <p className="text-xs text-gray-500 mt-2 max-w-xl mx-auto mb-4">
                Works best on blogs, portfolios, college sites, and small business websites. 
                Large platforms like Amazon, Flipkart, or Google may block automated access — this is expected behavior, not a bug.
              </p>
            </div>
            
            <form onSubmit={handleCompare} className="grid md:grid-cols-2 gap-6 bg-gray-900/50 p-8 rounded-3xl border border-gray-800">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Website 1</label>
                  <input 
                    type="text" value={url1} onChange={(e) => setUrl1(e.target.value)}
                    placeholder="https://flipkart.com"
                    className="w-full bg-black/50 border border-gray-800 rounded-xl py-4 px-4 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Website 2</label>
                  <input 
                    type="text" value={url2} onChange={(e) => setUrl2(e.target.value)}
                    placeholder="https://amazon.in"
                    className="w-full bg-black/50 border border-gray-800 rounded-xl py-4 px-4 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Common Goal</label>
                  <textarea 
                    value={goal} onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Find and buy a professional camera lens"
                    className="w-full bg-black/50 border border-gray-800 rounded-xl py-4 px-4 focus:ring-2 focus:ring-purple-500 outline-none h-[124px] resize-none"
                  />
                </div>
                <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-black text-lg transition-all hover:bg-gray-200">
                  Run Comparison
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-12">
               <Loader2 className="w-24 h-24 text-purple-500 animate-spin" />
               <BarChart2 className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Running Dual-Site Analysis...</h2>
            <p className="text-gray-400 italic text-sm">{tips[currentTipIndex]}</p>
          </div>
        )}

        {comparison && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            {/* Winner Badge */}
            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 p-8 rounded-3xl text-center backdrop-blur-xl">
              <ShieldCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-white mb-2">
                Winner: {comparison.winner === 'url1' 
                  ? new URL(comparison.result1.url).hostname 
                  : new URL(comparison.result2.url).hostname}
              </h2>
              <p className="text-gray-300 text-lg">
                For your goal "{comparison.result1.goal}", this site provides the better experience with 
                <span className="text-green-400 font-bold ml-1">{comparison.scoreDifference} points less</span> cognitive waste.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Result 1 */}
              <div className={`p-8 rounded-3xl border transition-all ${comparison.winner === 'url1' ? 'bg-gray-900/60 border-green-500/50 shadow-2xl' : 'bg-gray-900/20 border-gray-800'}`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold truncate pr-4">{new URL(comparison.result1.url).hostname}</h3>
                  {comparison.winner === 'url1' && <span className="bg-green-500 text-black px-3 py-1 rounded-full text-xs font-black uppercase">Winner</span>}
                </div>
                <ScoreGauge score={comparison.result1.cognitiveScore} label="CWS Score" size="medium" />
                <div className="space-y-4 mt-8">
                  {Object.entries(comparison.result1.factors).map(([factor, value]) => (
                    <div key={factor} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 capitalize">{factor.replace('Waste', '')}</span>
                      <div className="flex-1 mx-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${(value/20)*100}%` }} />
                      </div>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Result 2 */}
              <div className={`p-8 rounded-3xl border transition-all ${comparison.winner === 'url2' ? 'bg-gray-900/60 border-green-500/50 shadow-2xl' : 'bg-gray-900/20 border-gray-800'}`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold truncate pr-4">{new URL(comparison.result2.url).hostname}</h3>
                  {comparison.winner === 'url2' && <span className="bg-green-500 text-black px-3 py-1 rounded-full text-xs font-black uppercase">Winner</span>}
                </div>
                <ScoreGauge score={comparison.result2.cognitiveScore} label="CWS Score" size="medium" />
                <div className="space-y-4 mt-8">
                  {Object.entries(comparison.result2.factors).map(([factor, value]) => (
                    <div key={factor} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 capitalize">{factor.replace('Waste', '')}</span>
                      <div className="flex-1 mx-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${(value/20)*100}%` }} />
                      </div>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button onClick={() => setComparison(null)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-bold transition-all">
                <TrendingDown className="w-5 h-5" /> Compare Other Sites
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
