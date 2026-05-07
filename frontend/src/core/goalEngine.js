/**
 * Goal-Based Optimal Path Engine
 * 
 * Maps user goals to optimal navigation paths.
 * Future: Can be replaced with AI-generated dynamic paths.
 */

/**
 * Goal-to-Path mapping
 * Each goal maps to the optimal sequence of routes
 */
export const goalMap = {
    c_problem: {
        description: "Reach C Problem Page",
        optimalPath: ["home", "domains", "c-language", "problem"],
        estimatedSteps: 4,
        optimalTime: 8000 // ms (2s per step)
    },

    python_problem: {
        description: "Reach Python Problem Page",
        optimalPath: ["home", "domains", "python", "problem"],
        estimatedSteps: 4,
        optimalTime: 8000
    },

    java_tutorial: {
        description: "Access Java Tutorial",
        optimalPath: ["home", "tutorials", "java", "basics"],
        estimatedSteps: 4,
        optimalTime: 8000
    },

    javascript_challenges: {
        description: "Find JavaScript Challenges",
        optimalPath: ["home", "challenges", "javascript", "view"],
        estimatedSteps: 4,
        optimalTime: 8000
    },

    profile_settings: {
        description: "Update Profile Settings",
        optimalPath: ["home", "profile", "settings"],
        estimatedSteps: 3,
        optimalTime: 6000
    }
};

/**
 * Get optimal path for a goal with UI type prefix
 * @param {string} goal - Goal identifier (e.g., "c_problem")
 * @param {string} uiType - UI quality: "bad" | "moderate" | "good"
 * @returns {Array} Full route paths (e.g., ["/bad/home", "/bad/domains", ...])
 */
export function getOptimalPath(goal, uiType = "bad") {
    const goalData = goalMap[goal];

    if (!goalData) {
        console.warn(`Unknown goal: ${goal}`);
        return [];
    }

    // Convert template to full paths with UI type prefix
    return goalData.optimalPath.map(step => `/${uiType}/${step}`);
}

/**
 * Get goal description
 * @param {string} goal - Goal identifier
 * @returns {string} Human-readable description
 */
export function getGoalDescription(goal) {
    return goalMap[goal]?.description || "Unknown Goal";
}

/**
 * Get all available goals
 * @returns {Array} Array of {id, description, steps}
 */
export function getAllGoals() {
    return Object.entries(goalMap).map(([id, data]) => ({
        id: id,
        description: data.description,
        estimatedSteps: data.estimatedSteps,
        optimalTime: data.optimalTime
    }));
}

/**
 * Check if a route is part of the optimal path
 * @param {string} route - Current route (e.g., "/bad/domains")
 * @param {Array} optimalPath - Optimal path array
 * @returns {boolean} True if route is in optimal path
 */
export function isOptimalRoute(route, optimalPath) {
    return optimalPath.includes(route);
}

/**
 * Get expected next step in optimal path
 * @param {Array} currentPath - User's current path
 * @param {Array} optimalPath - Optimal path
 * @returns {string|null} Next expected route, or null if complete
 */
export function getNextOptimalStep(currentPath, optimalPath) {
    const currentIndex = currentPath.length;

    if (currentIndex >= optimalPath.length) {
        return null; // Goal reached
    }

    return optimalPath[currentIndex];
}

/**
 * Calculate progress percentage towards goal
 * @param {Array} currentPath - User's actual path
 * @param {Array} optimalPath - Optimal path
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(currentPath, optimalPath) {
    if (optimalPath.length === 0) return 0;

    // Count how many optimal steps have been completed
    let completedSteps = 0;

    for (let i = 0; i < optimalPath.length; i++) {
        if (currentPath.includes(optimalPath[i])) {
            completedSteps++;
        }
    }

    return Math.min(100, (completedSteps / optimalPath.length) * 100);
}

/**
 * Check if goal has been reached
 * @param {Array} currentPath - User's actual path
 * @param {Array} optimalPath - Optimal path
 * @returns {boolean} True if all optimal steps visited
 */
export function isGoalReached(currentPath, optimalPath) {
    if (optimalPath.length === 0) return false;

    // Goal is reached if the last optimal step is in current path
    const finalStep = optimalPath[optimalPath.length - 1];
    return currentPath.includes(finalStep);
}

/**
 * Validate goal configuration
 * @param {string} goal - Goal identifier
 * @returns {Object} { valid, error }
 */
export function validateGoal(goal) {
    if (!goal) {
        return { valid: false, error: "Goal is required" };
    }

    if (!goalMap[goal]) {
        return { valid: false, error: `Unknown goal: ${goal}` };
    }

    const goalData = goalMap[goal];

    if (!goalData.optimalPath || goalData.optimalPath.length === 0) {
        return { valid: false, error: "Goal has no optimal path defined" };
    }

    return { valid: true, error: null };
}
