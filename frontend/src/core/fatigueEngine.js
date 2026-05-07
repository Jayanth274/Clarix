/**
 * Cognitive Fatigue Calculation Engine
 * 
 * Calculates both optimal and actual cognitive fatigue scores.
 * Uses configurable weights for ML tuning.
 */

import { fatigueWeights, fatigueBounds } from './config/weights.js';

/**
 * Calculate optimal fatigue (baseline)
 * Assumes perfect navigation with no friction
 * @param {Array} optimalPath - Optimal path
 * @param {number} optimalTime - Expected time to complete (ms)
 * @returns {number} Baseline fatigue score (0-100)
 */
export function calculateOptimalFatigue(optimalPath, optimalTime = 8000) {
    // Optimal fatigue is based purely on path length and expected time
    const stepFatigue = optimalPath.length * 2; // 2 points per step
    const timeFatigue = (optimalTime / 1000) * 0.5; // 0.5 points per second

    const rawScore = stepFatigue + timeFatigue;

    // Normalize and clamp
    return clampFatigue(rawScore);
}

/**
 * Calculate actual fatigue based on user navigation
 * @param {Object} metrics - Navigation metrics
 * @param {Object} weights - Optional custom weights
 * @returns {number} Actual fatigue score (0-100)
 */
export function calculateActualFatigue(metrics, weights = fatigueWeights) {
    const {
        extraSteps = 0,
        backtracks = 0,
        hesitationCount = 0,
        repeatVisits = 0,
        deviationScore = 0
    } = metrics;

    // Weighted sum of all friction factors
    const rawScore =
        (extraSteps * weights.w1) +
        (backtracks * weights.w2) +
        (hesitationCount * weights.w3) +
        (repeatVisits * weights.w4) +
        (deviationScore * weights.w5);

    // Add base fatigue from path length
    const baseFatigue = (metrics.actualSteps || 0) * 2;

    const totalScore = baseFatigue + rawScore;

    // Normalize and clamp to 0-100
    return clampFatigue(totalScore);
}

/**
 * Clamp fatigue score to bounds
 * @param {number} score - Raw fatigue score
 * @returns {number} Clamped score (0-100)
 */
function clampFatigue(score) {
    return Math.max(fatigueBounds.min, Math.min(fatigueBounds.max, score));
}

/**
 * Calculate fatigue increase percentage
 * @param {number} actualFatigue - Actual fatigue score
 * @param {number} optimalFatigue - Optimal baseline fatigue
 * @returns {number} Percentage increase
 */
export function calculateFatigueIncrease(actualFatigue, optimalFatigue) {
    if (optimalFatigue === 0) return 0;

    return ((actualFatigue - optimalFatigue) / optimalFatigue) * 100;
}

/**
 * Get fatigue category
 * @param {number} fatigueScore - Fatigue score (0-100)
 * @returns {Object} { category, level, color, description }
 */
export function getFatigueCategory(fatigueScore) {
    if (fatigueScore < 20) {
        return {
            category: "minimal",
            level: 1,
            color: "#10b981", // green
            description: "Low cognitive load - effortless navigation"
        };
    } else if (fatigueScore < 40) {
        return {
            category: "low",
            level: 2,
            color: "#84cc16", // lime
            description: "Acceptable cognitive load - minor friction"
        };
    } else if (fatigueScore < 60) {
        return {
            category: "moderate",
            level: 3,
            color: "#f59e0b", // amber
            description: "Moderate cognitive load - noticeable effort"
        };
    } else if (fatigueScore < 80) {
        return {
            category: "high",
            level: 4,
            color: "#f97316", // orange
            description: "High cognitive load - significant friction"
        };
    } else {
        return {
            category: "severe",
            level: 5,
            color: "#ef4444", // red
            description: "Severe cognitive load - very difficult navigation"
        };
    }
}

/**
 * Calculate fatigue breakdown by component
 * @param {Object} metrics - Navigation metrics
 * @param {Object} weights - Fatigue weights
 * @returns {Object} Breakdown by factor
 */
export function getFatigueBreakdown(metrics, weights = fatigueWeights) {
    const {
        extraSteps = 0,
        backtracks = 0,
        hesitationCount = 0,
        repeatVisits = 0,
        deviationScore = 0
    } = metrics;

    const components = {
        extraSteps: extraSteps * weights.w1,
        backtracks: backtracks * weights.w2,
        hesitations: hesitationCount * weights.w3,
        repeatVisits: repeatVisits * weights.w4,
        deviation: deviationScore * weights.w5
    };

    const total = Object.values(components).reduce((a, b) => a + b, 0);

    // Calculate percentages
    const breakdown = {};
    Object.entries(components).forEach(([key, value]) => {
        breakdown[key] = {
            raw: value,
            percentage: total > 0 ? (value / total) * 100 : 0
        };
    });

    return breakdown;
}

/**
 * Predict fatigue if user continues current pattern
 * @param {Object} currentMetrics - Current navigation metrics
 * @param {number} remainingSteps - Estimated steps to goal
 * @returns {number} Predicted final fatigue score
 */
export function predictFinalFatigue(currentMetrics, remainingSteps) {
    // Calculate current fatigue rate per step
    const currentSteps = currentMetrics.actualSteps || 1;
    const currentFatigue = calculateActualFatigue(currentMetrics);
    const fatiguePerStep = currentFatigue / currentSteps;

    // Project forward
    const projectedFatigue = currentFatigue + (fatiguePerStep * remainingSteps);

    return clampFatigue(projectedFatigue);
}

/**
 * Calculate time-based fatigue (duration impact)
 * @param {number} totalTime - Total navigation time (ms)
 * @param {number} expectedTime - Expected optimal time (ms)
 * @returns {number} Time fatigue component
 */
export function calculateTimeFatigue(totalTime, expectedTime) {
    if (totalTime <= expectedTime) return 0;

    const overtime = totalTime - expectedTime;
    const timeFatigue = (overtime / 1000) * 0.8; // 0.8 points per second over

    return Math.min(20, timeFatigue); // Cap at 20 points
}

/**
 * Generate fatigue comparison data
 * @param {number} optimalFatigue - Optimal fatigue score
 * @param {number} actualFatigue - Actual fatigue score
 * @returns {Object} Comparison data for visualization
 */
export function generateFatigueComparison(optimalFatigue, actualFatigue) {
    const increase = calculateFatigueIncrease(actualFatigue, optimalFatigue);
    const difference = actualFatigue - optimalFatigue;

    const optimalCategory = getFatigueCategory(optimalFatigue);
    const actualCategory = getFatigueCategory(actualFatigue);

    return {
        optimal: {
            score: optimalFatigue,
            category: optimalCategory
        },
        actual: {
            score: actualFatigue,
            category: actualCategory
        },
        comparison: {
            difference: difference,
            increasePercentage: increase,
            effortMultiplier: optimalFatigue > 0 ? actualFatigue / optimalFatigue : 0,
            interpretation: getComparisonInterpretation(increase)
        }
    };
}

/**
 * Get human-readable comparison interpretation
 * @param {number} increasePercentage - Fatigue increase %
 * @returns {string} Interpretation text
 */
function getComparisonInterpretation(increasePercentage) {
    if (increasePercentage < 10) {
        return "Nearly identical cognitive effort";
    } else if (increasePercentage < 50) {
        return "Slightly more mental effort required";
    } else if (increasePercentage < 100) {
        return "Significantly more mental effort required";
    } else if (increasePercentage < 200) {
        return "Much higher cognitive load";
    } else {
        return "Drastically more mental effort required";
    }
}
