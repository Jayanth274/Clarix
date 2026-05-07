/**
 * Navigation Context
 * 
 * Central state management for navigation tracking.
 * Listens to route changes and computes metrics in real-time.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { initializeTrackingState, recordStep, detectBacktrack, countHesitations, calculateRepeatVisits, countConsecutiveBacktracks } from '../core/tracker.js';
import { getOptimalPath, isGoalReached, validateGoal } from '../core/goalEngine.js';
import { analyzePath } from '../core/pathAnalyzer.js';
import { calculateOptimalFatigue, calculateActualFatigue, calculateFatigueIncrease } from '../core/fatigueEngine.js';
import { extractConfusionFeatures, predictConfusion, shouldTriggerAlert } from '../core/aiPredictionEngine.js';

const NavigationContext = createContext();

/**
 * Custom hook to use navigation context
 */
export function useNavigation() {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within NavigationProvider');
    }
    return context;
}

/**
 * Navigation Provider Component
 */
export function NavigationProvider({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Core tracking state
    const [trackingState, setTrackingState] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // Computed metrics (updated on route changes)
    const [metrics, setMetrics] = useState({
        pathAnalysis: null,
        optimalFatigue: 0,
        actualFatigue: 0,
        fatigueIncrease: 0,
        confusionProbability: 0,
        alertData: null
    });

    /**
     * Start new navigation session
     */
    const startSession = useCallback(async (goal, uiType) => {
        const validation = validateGoal(goal);

        if (!validation.valid) {
            console.error('Invalid goal:', validation.error);
            return false;
        }

        const optimalPath = getOptimalPath(goal, uiType);
        const initialState = initializeTrackingState(goal, optimalPath, uiType);

        // Calculate optimal baseline fatigue
        const optimalFatigue = calculateOptimalFatigue(optimalPath, 8000);

        setTrackingState(initialState);
        setIsActive(true);
        setMetrics(prev => ({
            ...prev,
            optimalFatigue
        }));

        let newSessionId = `session_${Date.now()}`;
        try {
            const response = await axios.post('http://localhost:5000/api/session/start', { goal, uiType, optimalPath });
            newSessionId = response.data.sessionId;
            setCurrentSessionId(newSessionId);
            setTrackingState(prev => ({...prev, sessionId: newSessionId}));
        } catch (error) {
            console.warn('Backend offline, continuing with local session');
            setCurrentSessionId(newSessionId);
            setTrackingState(prev => ({...prev, sessionId: newSessionId}));
        }

        console.log('📊 Navigation tracking started:', { goal, uiType, optimalPath, sessionId: newSessionId });
        return true;
    }, []);

    /**
     * Stop tracking and save session
     */
    const stopSession = useCallback(async () => {
        if (!trackingState || !isActive) return null;

        const sessionData = {
            ...trackingState,
            metrics: metrics,
            endTime: performance.now(),
            totalDuration: performance.now() - trackingState.startTime
        };

        const sessionId = currentSessionId || trackingState.sessionId || Date.now().toString();
        const sessionKey = `session_${sessionId}`;

        // Save to localStorage
        try {
            localStorage.setItem(sessionKey, JSON.stringify(sessionData));
            console.log('💾 Session saved:', sessionKey);
        } catch (error) {
            console.error('Failed to save session:', error);
        }

        // POST final metrics to backend
        try {
            await axios.post('http://localhost:5000/api/session/update', {
                sessionId,
                metrics: sessionData.metrics
            });
        } catch (error) {
            console.warn('Backend offline, final metrics not posted');
        }

        setIsActive(false);
        navigate(`/report/${sessionId}`);

        return sessionData;
    }, [trackingState, metrics, isActive, currentSessionId, navigate]);

    /**
     * Get saved session data
     */
    const getSession = useCallback((sessionType) => {
        const sessionKey = `session_${sessionType}`;
        try {
            const data = localStorage.getItem(sessionKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load session:', error);
            return null;
        }
    }, []);

    /**
     * Clear all saved sessions
     */
    const clearSessions = useCallback(() => {
        ['bad', 'moderate', 'good'].forEach(type => {
            localStorage.removeItem(`session_${type}`);
        });
        console.log('🗑️ All sessions cleared');
    }, []);

    /**
     * Compute all navigation metrics
     */
    const computeMetrics = useCallback((state) => {
        // Path analysis
        const pathAnalysis = analyzePath(state.actualPath, state.optimalPath);

        // Hesitation analysis
        const hesitationData = countHesitations(state.timestamps, 3000);

        // Repeat visits
        const repeatData = calculateRepeatVisits(state.actualPath);

        // Consecutive backtracks
        const consecutiveBacktracks = countConsecutiveBacktracks(state.actualPath);

        // Fatigue calculation
        const fatigueMetrics = {
            extraSteps: pathAnalysis.extraSteps,
            backtracks: pathAnalysis.backtracks,
            hesitationCount: hesitationData.count,
            repeatVisits: repeatData.count,
            deviationScore: pathAnalysis.deviationScore,
            actualSteps: state.actualPath.length
        };

        const actualFatigue = calculateActualFatigue(fatigueMetrics);
        const optimalFatigue = calculateOptimalFatigue(state.optimalPath, 8000);
        const fatigueIncrease = calculateFatigueIncrease(actualFatigue, optimalFatigue);

        // AI confusion prediction
        const confusionFeatures = extractConfusionFeatures({
            timestamps: state.timestamps,
            actualPath: state.actualPath,
            backtracks: pathAnalysis.backtracks,
            deviationScore: pathAnalysis.deviationScore
        });

        const confusionProbability = predictConfusion(confusionFeatures);

        // Alert check
        const alertData = shouldTriggerAlert({
            ...state,
            deviationScore: pathAnalysis.deviationScore,
            consecutiveBacktracks
        });

        // Update metrics
        setMetrics({
            pathAnalysis,
            hesitationData,
            repeatData,
            consecutiveBacktracks,
            optimalFatigue,
            actualFatigue,
            fatigueIncrease,
            confusionProbability,
            confusionFeatures,
            alertData
        });

    }, []);

    /**
     * Track route changes
     */
    useEffect(() => {
        if (!isActive || !trackingState) return;

        const currentRoute = location.pathname;
        const timestamp = performance.now();

        // Skip if this is not a demo site route
        if (!currentRoute.startsWith('/bad') &&
            !currentRoute.startsWith('/moderate') &&
            !currentRoute.startsWith('/good')) {
            return;
        }

        // Prevent infinite loops by not recording the same route twice consecutively
        if (trackingState.actualPath.length > 0 && 
            trackingState.actualPath[trackingState.actualPath.length - 1] === currentRoute) {
            return;
        }

        // Record the step
        const newState = recordStep(trackingState, currentRoute, timestamp);

        // Detect backtrack
        const isBacktrack = detectBacktrack(trackingState.actualPath, currentRoute);
        if (isBacktrack) {
            newState.backtracks = trackingState.backtracks + 1;
        }

        // Update state
        setTrackingState(newState);

        // Compute all metrics
        computeMetrics(newState);

        console.log('📍 Step recorded:', currentRoute, {
            stepCount: newState.stepCount,
            isBacktrack
        });

        // POST metrics to backend
        if (currentSessionId) {
            axios.post('http://localhost:5000/api/session/update', {
                sessionId: currentSessionId,
                metrics: { 
                    actualPath: newState.actualPath, 
                    backtracks: newState.backtracks,
                    // Use the latest available computed metrics
                    // Note: metrics state is from previous render, but it's acceptable for updates
                }
            }).catch(() => {
                // Backend offline — continue with localStorage fallback
                try {
                    const sessionKey = `session_${currentSessionId}`;
                    const localData = JSON.parse(localStorage.getItem(sessionKey) || '{}');
                    localStorage.setItem(sessionKey, JSON.stringify({
                        ...localData,
                        ...newState
                    }));
                } catch (e) {
                    console.error('Local storage fallback failed', e);
                }
            });
        }

    }, [location.pathname, isActive, trackingState, currentSessionId, computeMetrics]);

    /**
     * Check if goal is reached
     */
    const checkGoalReached = useCallback(() => {
        if (!trackingState) return false;
        return isGoalReached(trackingState.actualPath, trackingState.optimalPath);
    }, [trackingState]);

    const value = {
        // State
        trackingState,
        isActive,
        metrics,

        // Actions
        startSession,
        stopSession,
        getSession,
        clearSessions,
        checkGoalReached,

        // Computed
        goalReached: checkGoalReached()
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
}

export default NavigationContext;
