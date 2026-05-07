/**
 * Real-Time Alert Component
 * Shows warnings when confusion probability is high
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RealTimeAlert({ alertData, expectedIncrease, onDismiss }) {
    if (!alertData || !alertData.shouldAlert) return null;

    const { confusionLevel, reason } = alertData;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full"
            >
                <div className={`bg-gradient-to-r ${confusionLevel.level === 'severe' ? 'from-red-600 to-red-700' :
                        confusionLevel.level === 'high' ? 'from-orange-600 to-orange-700' :
                            'from-yellow-600 to-yellow-700'
                    } p-4 rounded-lg shadow-2xl`}>
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-white flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">⚠ {reason}</h3>
                            {expectedIncrease > 0 && (
                                <p className="text-sm text-white/90 mb-2">
                                    If you continue this path, expected cognitive waste increases by{' '}
                                    <span className="font-bold">{Math.round(expectedIncrease)}%</span>.
                                </p>
                            )}
                            <div className="text-xs text-white/80">
                                💡 Suggestion: Try navigating back and choosing a more direct path.
                            </div>
                        </div>
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="text-white/70 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
