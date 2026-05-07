/**
 * Navigation Tracking Engine
 * 
 * Pure functions for tracking user navigation behavior.
 * No mutations - all functions return new state objects.
 */

/**
 * Record a navigation step
 * @param {Object} state - Current tracking state
 * @param {string} step - Route path (e.g., "/bad/home")
 * @param {number} timestamp - Performance.now() timestamp
 * @returns {Object} New state with recorded step
 */
export function recordStep(state, step, timestamp) {
    return {
        ...state,
        actualPath: [...state.actualPath, step],
        timestamps: [...state.timestamps, timestamp],
        stepCount: state.stepCount + 1
    };
}

/**
 * Detect if current navigation is a backtrack
 * @param {Array} currentPath - Current navigation path
 * @param {string} newStep - New route being navigated to
 * @returns {boolean} True if this is backward navigation
 */
export function detectBacktrack(currentPath, newStep) {
    if (currentPath.length < 2) return false;

    // Check if newStep was visited before
    const previousIndex = currentPath.lastIndexOf(newStep);

    // If found and it's not the last step, it's a backtrack
    return previousIndex !== -1 && previousIndex < currentPath.length - 1;
}

/**
 * Count total backtracks in navigation path
 * @param {Array} path - Complete navigation path
 * @returns {number} Total backtrack count
 */
export function countBacktracks(path) {
    let backtracks = 0;
    const visited = new Set();

    for (let i = 0; i < path.length; i++) {
        const step = path[i];

        // If we've seen this before, it's a backtrack
        if (visited.has(step)) {
            backtracks++;
        }

        visited.add(step);
    }

    return backtracks;
}

/**
 * Detect hesitation events (pauses > threshold between steps)
 * @param {Array} timestamps - Array of navigation timestamps
 * @param {number} threshold - Minimum pause duration to count as hesitation (ms)
 * @returns {Object} { count, totalDuration, variance }
 */
export function countHesitations(timestamps, threshold = 3000) {
    if (timestamps.length < 2) {
        return { count: 0, totalDuration: 0, variance: 0 };
    }

    const hesitations = [];
    const intervals = [];

    for (let i = 1; i < timestamps.length; i++) {
        const interval = timestamps[i] - timestamps[i - 1];
        intervals.push(interval);

        if (interval > threshold) {
            hesitations.push(interval);
        }
    }

    // Calculate variance of intervals (for AI prediction)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;

    return {
        count: hesitations.length,
        totalDuration: hesitations.reduce((a, b) => a + b, 0),
        variance: variance
    };
}

/**
 * Calculate repeat visits to same pages
 * @param {Array} path - Navigation path
 * @returns {Object} { count, density, repeatedPages }
 */
export function calculateRepeatVisits(path) {
    const visitCounts = {};
    const repeatedPages = [];

    path.forEach(step => {
        visitCounts[step] = (visitCounts[step] || 0) + 1;
    });

    let totalRepeats = 0;
    Object.entries(visitCounts).forEach(([page, count]) => {
        if (count > 1) {
            totalRepeats += (count - 1); // First visit doesn't count
            repeatedPages.push({ page, count });
        }
    });

    // Density = repeats per total steps
    const density = path.length > 0 ? totalRepeats / path.length : 0;

    return {
        count: totalRepeats,
        density: density,
        repeatedPages: repeatedPages
    };
}

/**
 * Detect consecutive backtracks (strong confusion signal)
 * @param {Array} path - Navigation path
 * @returns {number} Maximum consecutive backtracks
 */
export function countConsecutiveBacktracks(path) {
    if (path.length < 3) return 0;

    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (let i = 1; i < path.length; i++) {
        const isBacktrack = detectBacktrack(path.slice(0, i), path[i]);

        if (isBacktrack) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
            currentConsecutive = 0;
        }
    }

    return maxConsecutive;
}

/**
 * Calculate average time per step
 * @param {Array} timestamps - Navigation timestamps
 * @returns {number} Average time in milliseconds
 */
export function calculateAverageStepTime(timestamps) {
    if (timestamps.length < 2) return 0;

    const totalTime = timestamps[timestamps.length - 1] - timestamps[0];
    return totalTime / (timestamps.length - 1);
}

/**
 * Initialize tracking state
 * @param {string} goal - User's navigation goal
 * @param {Array} optimalPath - Optimal path for this goal
 * @param {string} sessionType - "bad" | "moderate" | "good"
 * @returns {Object} Initial state
 */
export function initializeTrackingState(goal, optimalPath, sessionType) {
    return {
        goal: goal,
        optimalPath: optimalPath,
        actualPath: [],
        timestamps: [],
        stepCount: 0,
        backtracks: 0,
        hesitations: 0,
        repeatVisits: 0,
        currentSession: sessionType,
        isTracking: true,
        startTime: performance.now()
    };
}
