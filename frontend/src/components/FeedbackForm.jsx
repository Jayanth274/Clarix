/**
 * Feedback Form Component
 * Collects user feedback after analysis
 */

import React, { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = 'https://clarix-backend-production.up.railway.app';

export default function FeedbackForm({ sessionData, onClose, onSubmit }) {
    const [ratings, setRatings] = useState({
        overallExperience: 0,
        easeOfNavigation: 0,
        designQuality: 0,
        wouldRecommend: null
    });

    const [comments, setComments] = useState('');
    const [painPoints, setPainPoints] = useState('');
    const [positiveAspects, setPositiveAspects] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleStarClick = (category, value) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmit = async () => {
        if (ratings.overallExperience === 0) {
            alert('Please provide an overall experience rating');
            return;
        }

        setSubmitting(true);

        const feedbackData = {
            sessionId: sessionData.sessionId,
            websiteUrl: sessionData.url,
            goal: sessionData.goal,
            metrics: {
                steps: sessionData.metrics?.totalSteps || sessionData.metrics?.steps || 0,
                backtracks: sessionData.metrics?.backtracks || 0,
                fatigue: sessionData.metrics?.fatigue || 0,
                confusion: sessionData.metrics?.confusion || 0,
                totalTime: sessionData.metrics?.totalTime || 0
            },
            userRatings: ratings,
            comments,
            painPoints: painPoints.split(',').map(p => p.trim()).filter(p => p),
            positiveAspects: positiveAspects.split(',').map(p => p.trim()).filter(p => p)
        };

        try {
            await axios.post(`${API_URL}/api/feedback`, feedbackData);
            setSubmitted(true);
            setTimeout(() => {
                if (onSubmit) onSubmit(feedbackData);
                if (onClose) onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            alert('Failed to submit feedback. It will be stored locally.');
            setSubmitting(false);
        }
    };

    const StarRating = ({ value, onChange, label }) => (
        <div className="mb-4">
            <label className="text-white font-semibold mb-2 block">{label}</label>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star
                            className={`w-8 h-8 ${star <= value
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-600 text-gray-600'
                                }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );

    if (submitted) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            >
                <div className="bg-gradient-to-br from-green-600 to-green-700 p-12 rounded-2xl text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                    >
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-3xl font-bold text-white mb-2">Thank You!</h2>
                        <p className="text-white/90">Your feedback helps us improve</p>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Share Your Experience
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <p className="text-gray-300 mb-6">
                    Your feedback helps train our AI model to provide better suggestions
                </p>

                <div className="space-y-6">
                    {/* Overall Experience */}
                    <StarRating
                        label="Overall Experience *"
                        value={ratings.overallExperience}
                        onChange={(value) => handleStarClick('overallExperience', value)}
                    />

                    {/* Ease of Navigation */}
                    <StarRating
                        label="Ease of Navigation"
                        value={ratings.easeOfNavigation}
                        onChange={(value) => handleStarClick('easeOfNavigation', value)}
                    />

                    {/* Design Quality */}
                    <StarRating
                        label="Design Quality"
                        value={ratings.designQuality}
                        onChange={(value) => handleStarClick('designQuality', value)}
                    />

                    {/* Would Recommend */}
                    <div className="mb-4">
                        <label className="text-white font-semibold mb-3 block">
                            Would you recommend this website?
                        </label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setRatings(prev => ({ ...prev, wouldRecommend: true }))}
                                className={`flex-1 py-3 rounded-lg font-semibold transition ${ratings.wouldRecommend === true
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    }`}
                            >
                                Yes 👍
                            </button>
                            <button
                                type="button"
                                onClick={() => setRatings(prev => ({ ...prev, wouldRecommend: false }))}
                                className={`flex-1 py-3 rounded-lg font-semibold transition ${ratings.wouldRecommend === false
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    }`}
                            >
                                No 👎
                            </button>
                        </div>
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="text-white font-semibold mb-2 block">
                            Additional Comments
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Share your thoughts about the website..."
                            rows={4}
                            className="w-full bg-white/10 border-2 border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Pain Points */}
                    <div>
                        <label className="text-white font-semibold mb-2 block">
                            Pain Points (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={painPoints}
                            onChange={(e) => setPainPoints(e.target.value)}
                            placeholder="e.g., confusing navigation, too many clicks, slow loading"
                            className="w-full bg-white/10 border-2 border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                        />
                    </div>

                    {/* Positive Aspects */}
                    <div>
                        <label className="text-white font-semibold mb-2 block">
                            What Did You Like? (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={positiveAspects}
                            onChange={(e) => setPositiveAspects(e.target.value)}
                            placeholder="e.g., clean design, fast loading, easy to find information"
                            className="w-full bg-white/10 border-2 border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || ratings.overallExperience === 0}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Submit Feedback
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
