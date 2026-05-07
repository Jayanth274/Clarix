/**
 * Path Deviation Analysis Engine
 * 
 * Compares actual vs optimal navigation paths.
 * Calculates deviation metrics with configurable weights.
 */

import { pathAnalysisWeights } from './config/weights.js';

/**
 * Analyze path deviation
 * @param {Array} actualPath - User's actual navigation path
 * @param {Array} optimalPath - Optimal path for the goal
 * @param {Object} weights - Optional custom weights
 * @returns {Object} Deviation metrics
 */
export function analyzePath(actualPath, optimalPath, weights = pathAnalysisWeights) {
    const extraSteps = Math.max(0, actualPath.length - optimalPath.length);
    const backtracks = countBacktracksInPath(actualPath);
    const wrongVisits = countWrongVisits(actualPath, optimalPath);

    // Calculate weighted deviation score
    const deviationScore =
        (extraSteps * weights.extra) +
        (backtracks * weights.backtrack) +
        (wrongVisits * weights.wrong);

    return {
        extraSteps,
        backtracks,
        wrongVisits,
        deviationScore,
        efficiency: calculateEfficiency(actualPath, optimalPath)
    };
}

/**
 * Count backtracks in a path
 * @param {Array} path - Navigation path
 * @returns {number} Backtrack count
 */
function countBacktracksInPath(path) {
    const visited = new Set();
    let backtracks = 0;

    for (const step of path) {
        if (visited.has(step)) {
            backtracks++;
        }
        visited.add(step);
    }

    return backtracks;
}

/**
 * Count visits to pages not in optimal path
 * @param {Array} actualPath - User's path
 * @param {Array} optimalPath - Optimal path
 * @returns {number} Wrong visit count
 */
function countWrongVisits(actualPath, optimalPath) {
    const optimalSet = new Set(optimalPath);
    return actualPath.filter(step => !optimalSet.has(step)).length;
}

/**
 * Calculate path efficiency (0-1 scale)
 * @param {Array} actualPath - User's path
 * @param {Array} optimalPath - Optimal path
 * @returns {number} Efficiency score (1.0 = perfect)
 */
function calculateEfficiency(actualPath, optimalPath) {
    if (actualPath.length === 0 || optimalPath.length === 0) return 0;

    // Efficiency = optimal steps / actual steps
    return Math.min(1, optimalPath.length / actualPath.length);
}

/**
 * Get detailed step-by-step analysis
 * @param {Array} actualPath - User's path
 * @param {Array} optimalPath - Optimal path
 * @returns {Array} Array of step analysis objects
 */
export function getStepByStepAnalysis(actualPath, optimalPath) {
    return actualPath.map((step, index) => {
        const expectedStep = optimalPath[index];
        const isOptimal = step === expectedStep;
        const isWrongPage = !optimalPath.includes(step);
        const isBacktrack = actualPath.slice(0, index).includes(step);

        return {
            stepNumber: index + 1,
            actualRoute: step,
            expectedRoute: expectedStep || "Goal Reached",
            isOptimal,
            isWrongPage,
            isBacktrack,
            status: getStepStatus(isOptimal, isWrongPage, isBacktrack)
        };
    });
}

/**
 * Determine step status
 * @param {boolean} isOptimal - Is this the expected next step?
 * @param {boolean} isWrongPage - Is this page not in optimal path?
 * @param {boolean} isBacktrack - Is this a revisit?
 * @returns {string} Status description
 */
function getStepStatus(isOptimal, isWrongPage, isBacktrack) {
    if (isOptimal) return "optimal";
    if (isBacktrack) return "backtrack";
    if (isWrongPage) return "wrong_page";
    return "suboptimal";
}

/**
 * Calculate path similarity (Jaccard similarity)
 * @param {Array} actualPath - User's path
 * @param {Array} optimalPath - Optimal path
 * @returns {number} Similarity score (0-1)
 */
export function calculatePathSimilarity(actualPath, optimalPath) {
    const actualSet = new Set(actualPath);
    const optimalSet = new Set(optimalPath);

    const intersection = new Set([...actualSet].filter(x => optimalSet.has(x)));
    const union = new Set([...actualSet, ...optimalSet]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
}

/**
 * Get deviation category
 * @param {number} deviationScore - Calculated deviation score
 * @returns {Object} { category, severity, description }
 */
export function getDeviationCategory(deviationScore) {
    if (deviationScore === 0) {
        return {
            category: "perfect",
            severity: 0,
            description: "Perfect navigation - followed optimal path exactly"
        };
    } else if (deviationScore <= 5) {
        return {
            category: "minimal",
            severity: 1,
            description: "Minimal deviation - very close to optimal"
        };
    } else if (deviationScore <= 15) {
        return {
            category: "moderate",
            severity: 2,
            description: "Moderate deviation - some unnecessary steps"
        };
    } else if (deviationScore <= 30) {
        return {
            category: "high",
            severity: 3,
            description: "High deviation - significant navigation confusion"
        };
    } else {
        return {
            category: "severe",
            severity: 4,
            description: "Severe deviation - major navigation difficulties"
        };
    }
}

/**
 * Predict remaining steps to goal
 * @param {Array} currentPath - Current navigation path
 * @param {Array} optimalPath - Optimal path
 * @returns {number} Estimated steps remaining
 */
export function predictRemainingSteps(currentPath, optimalPath) {
    // Find which optimal steps are not yet visited
    const remainingSteps = optimalPath.filter(step => !currentPath.includes(step));
    return remainingSteps.length;
}

/**
 * Generate path visualization data
 * @param {Array} actualPath - User's path
 * @param {Array} optimalPath - Optimal path
 * @returns {Object} Visualization data for charts
 */
export function generatePathVisualization(actualPath, optimalPath) {
    const steps = Math.max(actualPath.length, optimalPath.length);

    return {
        labels: Array.from({ length: steps }, (_, i) => `Step ${i + 1}`),
        optimalData: optimalPath.map((step, i) => ({
            step: i + 1,
            route: step,
            type: "optimal"
        })),
        actualData: actualPath.map((step, i) => ({
            step: i + 1,
            route: step,
            type: optimalPath[i] === step ? "optimal" : "deviation"
        }))
    };
}
