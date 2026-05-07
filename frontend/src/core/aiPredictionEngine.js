/**
 * AI-Based Confusion Prediction Engine
 * 
 * Uses sigmoid activation to predict user confusion probability.
 * ML-ready structure - can be replaced with trained neural network.
 */

import { aiConfusionWeights, alertThresholds } from './config/weights.js';

/**
 * Sigmoid activation function
 * @param {number} x - Input value
 * @returns {number} Output between 0 and 1
 */
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

/**
 * Predict confusion probability
 * @param {Object} features - Navigation features
 * @param {Object} weights - Optional custom weights
 * @returns {number} Confusion probability (0-1)
 */
export function predictConfusion(features, weights = aiConfusionWeights) {
    const {
        hesitationVariance = 0,
        backtracks = 0,
        deviationScore = 0,
        repeatDensity = 0
    } = features;

    // Weighted sum of features
    const z =
        (hesitationVariance / 1000000) * weights.h1 +  // Normalize variance
        backtracks * weights.h2 +
        (deviationScore / 10) * weights.h3 +            // Scale deviation
        repeatDensity * weights.h4;

    // Apply sigmoid to get probability
    return sigmoid(z / 10);
}

/**
 * Extract confusion features from navigation data
 * @param {Object} navigationData - Complete navigation state
 * @returns {Object} Features for confusion prediction
 */
export function extractConfusionFeatures(navigationData) {
    const {
        timestamps = [],
        actualPath = [],
        backtracks = 0,
        deviationScore = 0
    } = navigationData;

    // Calculate hesitation variance
    const hesitationVariance = calculateHesitationVariance(timestamps);

    // Calculate repeat density
    const repeatDensity = calculateRepeatDensity(actualPath);

    return {
        hesitationVariance,
        backtracks,
        deviationScore,
        repeatDensity
    };
}

/**
 * Calculate variance in time between steps
 * @param {Array} timestamps - Navigation timestamps
 * @returns {number} Variance in milliseconds squared
 */
function calculateHesitationVariance(timestamps) {
    if (timestamps.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) =>
        sum + Math.pow(val - mean, 2), 0) / intervals.length;

    return variance;
}

/**
 * Calculate density of repeated page visits
 * @param {Array} path - Navigation path
 * @returns {number} Repeat density (0-1)
 */
function calculateRepeatDensity(path) {
    if (path.length === 0) return 0;

    const unique = new Set(path).size;
    return 1 - (unique / path.length);
}

/**
 * Get confusion level category
 * @param {number} probability - Confusion probability (0-1)
 * @returns {Object} { level, confidence, description, shouldAlert }
 */
export function getConfusionLevel(probability) {
    const confidencePercent = Math.round(probability * 100);

    if (probability < 0.3) {
        return {
            level: "low",
            confidence: confidencePercent,
            description: "Clear navigation - user is confident",
            shouldAlert: false,
            color: "#10b981" // green
        };
    } else if (probability < 0.5) {
        return {
            level: "mild",
            confidence: confidencePercent,
            description: "Minor uncertainty detected",
            shouldAlert: false,
            color: "#f59e0b" // amber
        };
    } else if (probability < 0.7) {
        return {
            level: "moderate",
            confidence: confidencePercent,
            description: "Moderate confusion - guidance may help",
            shouldAlert: false,
            color: "#f97316" // orange
        };
    } else if (probability < 0.85) {
        return {
            level: "high",
            confidence: confidencePercent,
            description: "High confusion - user likely struggling",
            shouldAlert: true,
            color: "#ef4444" // red
        };
    } else {
        return {
            level: "severe",
            confidence: confidencePercent,
            description: "Severe confusion - immediate guidance needed",
            shouldAlert: true,
            color: "#dc2626" // dark red
        };
    }
}

/**
 * Check if real-time alert should trigger
 * @param {Object} navigationData - Current navigation state
 * @returns {Object} { shouldAlert, reason, metrics }
 */
export function shouldTriggerAlert(navigationData) {
    const features = extractConfusionFeatures(navigationData);
    const confusionProb = predictConfusion(features);
    const confusionLevel = getConfusionLevel(confusionProb);

    // Check multiple alert conditions
    const conditions = {
        highConfusion: confusionProb > alertThresholds.confusionProbability,
        consecutiveBacktracks: (navigationData.consecutiveBacktracks || 0) >=
            alertThresholds.consecutiveBacktracks,
        severeDeviation: (navigationData.deviationScore || 0) > 20
    };

    const shouldAlert = Object.values(conditions).some(c => c);

    // Determine primary reason
    let reason = "";
    if (conditions.highConfusion) {
        reason = `High cognitive fatigue predicted (${confusionLevel.confidence}% confidence)`;
    } else if (conditions.consecutiveBacktracks) {
        reason = `Multiple backtracks detected - user may be lost`;
    } else if (conditions.severeDeviation) {
        reason = `Severe path deviation - significant confusion`;
    }

    return {
        shouldAlert,
        reason,
        confusionProbability: confusionProb,
        confusionLevel: confusionLevel,
        metrics: {
            ...features,
            conditions
        }
    };
}

/**
 * Predict expected fatigue increase if pattern continues
 * @param {Object} currentData - Current navigation data
 * @param {number} remainingSteps - Steps left to goal
 * @returns {number} Expected fatigue increase percentage
 */
export function predictFatigueIncrease(currentData, remainingSteps) {
    const features = extractConfusionFeatures(currentData);
    const confusionProb = predictConfusion(features);

    // Higher confusion = higher expected fatigue increase
    const baseIncrease = confusionProb * 50; // 0-50% base
    const stepMultiplier = remainingSteps * 5; // 5% per remaining step

    return Math.min(200, baseIncrease + stepMultiplier);
}

/**
 * Generate guidance message based on confusion level
 * @param {Object} alertData - Data from shouldTriggerAlert
 * @param {number} expectedIncrease - Expected fatigue increase
 * @returns {string} Guidance message
 */
export function generateGuidanceMessage(alertData, expectedIncrease) {
    const { confusionLevel, reason } = alertData;

    let message = `⚠ ${reason}\n\n`;

    if (expectedIncrease > 0) {
        message += `If you continue this path, expected cognitive waste increases by ${Math.round(expectedIncrease)}%.\n\n`;
    }

    // Add specific guidance based on confusion level
    switch (confusionLevel.level) {
        case "high":
        case "severe":
            message += "💡 Suggestion: Try navigating back to a familiar page and start fresh.";
            break;
        case "moderate":
            message += "💡 Suggestion: Consider reviewing the navigation structure before proceeding.";
            break;
        default:
            message += "💡 You're doing fine - keep going!";
    }

    return message;
}

/**
 * Calculate confidence intervals for prediction
 * @param {number} probability - Predicted probability
 * @returns {Object} { lower, upper, margin }
 */
export function getConfidenceInterval(probability) {
    // Simple confidence interval (±10%)
    const margin = 0.1;

    return {
        lower: Math.max(0, probability - margin),
        upper: Math.min(1, probability + margin),
        margin: margin,
        confidenceLevel: 0.9 // 90% confidence
    };
}

/**
 * Feature importance for explainability
 * @param {Object} features - Navigation features
 * @param {Object} weights - AI weights
 * @returns {Array} Sorted features by importance
 */
export function getFeatureImportance(features, weights = aiConfusionWeights) {
    const contributions = [
        {
            feature: "Hesitation Variance",
            value: features.hesitationVariance,
            weight: weights.h1,
            contribution: (features.hesitationVariance / 1000000) * weights.h1
        },
        {
            feature: "Backtracks",
            value: features.backtracks,
            weight: weights.h2,
            contribution: features.backtracks * weights.h2
        },
        {
            feature: "Deviation Score",
            value: features.deviationScore,
            weight: weights.h3,
            contribution: (features.deviationScore / 10) * weights.h3
        },
        {
            feature: "Repeat Density",
            value: features.repeatDensity,
            weight: weights.h4,
            contribution: features.repeatDensity * weights.h4
        }
    ];

    // Sort by contribution (descending)
    return contributions.sort((a, b) => b.contribution - a.contribution);
}
