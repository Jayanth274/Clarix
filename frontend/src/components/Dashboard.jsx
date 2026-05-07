import React, { useState, useEffect } from 'react';
import { Activity, Navigation, AlertCircle, TrendingUp, Minimize2, Maximize2 } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import RealTimeAlert from './RealTimeAlert';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    const { trackingState, metrics, isActive } = useNavigation();
    const [isMinimized, setIsMinimized] = useState(false);
    const [alertDismissed, setAlertDismissed] = useState(false);

    // Reset alert dismissed state when metrics change if it triggers a new alert
    useEffect(() => {
        setAlertDismissed(false);
    }, [metrics.confusionProbability, metrics.consecutiveBacktracks]);

    if (!isActive || !trackingState) return null;

    const { actualPath, optimalPath, backtracks } = trackingState;
    const { actualFatigue, confusionProbability, consecutiveBacktracks } = metrics;

    const progress = actualPath.length > 0 && optimalPath.length > 0 ?
        (actualPath.filter(p => optimalPath.includes(p)).length / optimalPath.length) * 100 : 0;

    const cwsScore = Math.round(actualFatigue);
    const confProbPercent = Math.round(confusionProbability * 100);

    const showToast = !alertDismissed && (confusionProbability > 0.7 || consecutiveBacktracks >= 3);
    
    const alertData = showToast ? {
        shouldAlert: true,
        confusionLevel: { level: confusionProbability > 0.8 || consecutiveBacktracks >= 4 ? 'severe' : 'high' },
        reason: consecutiveBacktracks >= 3 ? 'Multiple Backtracks Detected' : 'High Confusion Probability'
    } : null;

    return (
        <>
            <AnimatePresence>
                {showToast && (
                    <RealTimeAlert 
                        alertData={alertData} 
                        expectedIncrease={15} 
                        onDismiss={() => setAlertDismissed(true)} 
                    />
                )}
            </AnimatePresence>

            <motion.div 
                layout
                className="fixed bottom-4 right-4 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl w-80 z-40 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold text-white">Live Metrics</h3>
                    </div>
                    <button 
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg"
                    >
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence>
                    {!isMinimized && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 space-y-4"
                        >
                            {/* CWS Score */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <TrendingUp className="w-4 h-4" />
                                    Current CWS Score
                                </div>
                                <div className={`font-bold text-lg ${
                                    cwsScore < 30 ? 'text-green-400' :
                                    cwsScore <= 60 ? 'text-yellow-400' :
                                    'text-red-400'
                                }`}>
                                    {cwsScore}
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Navigation className="w-4 h-4" />
                                    Steps taken
                                </div>
                                <div className="font-semibold text-white">
                                    {actualPath.length} / {optimalPath.length}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Goal Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                        style={{ width: `${Math.min(100, progress)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Backtracks */}
                            <div className="flex justify-between items-center">
                                <div className="text-gray-400 text-sm">Backtracks</div>
                                <div className={`font-semibold ${backtracks > 0 ? 'text-red-400' : 'text-gray-300'}`}>{backtracks}</div>
                            </div>

                            {/* Confusion */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    Confusion Prob.
                                </div>
                                <div className={`font-semibold ${
                                    confProbPercent < 30 ? 'text-green-400' :
                                    confProbPercent < 70 ? 'text-yellow-400' :
                                    'text-red-400'
                                }`}>
                                    {confProbPercent}%
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
}
