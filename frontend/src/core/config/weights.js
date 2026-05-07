/**
 * Centralized Weight Configuration
 * 
 * All weights are configurable and ML-ready.
 * Future: These can be learned from data using regression models.
 */

// Path Analysis Weights
export const pathAnalysisWeights = {
  extra: 2,      // Weight for extra steps beyond optimal path
  backtrack: 3,  // Weight for backward navigation (highest penalty)
  wrong: 2       // Weight for visiting non-optimal pages
};

// Fatigue Calculation Weights
export const fatigueWeights = {
  w1: 1.5,  // Extra steps multiplier
  w2: 2.0,  // Backtracks multiplier (strong indicator)
  w3: 1.2,  // Hesitations multiplier
  w4: 1.8,  // Repeat visits multiplier
  w5: 1.0   // Deviation score multiplier
};

// AI Confusion Prediction Weights
export const aiConfusionWeights = {
  h1: 0.4,  // Hesitation variance (strongest signal)
  h2: 0.3,  // Backtracks
  h3: 0.2,  // Deviation score
  h4: 0.1   // Repeat density
};

// Real-Time Alert Thresholds
export const alertThresholds = {
  confusionProbability: 0.7,     // Trigger alert if confusion > 70%
  fatigueIncrease: 50,           // Trigger if fatigue increase > 50%
  consecutiveBacktracks: 3,      // Trigger if 3+ backtracks in a row
  hesitationDuration: 3000       // Consider pause > 3s as hesitation (ms)
};

// Fatigue Score Bounds
export const fatigueBounds = {
  min: 0,
  max: 100
};

/**
 * Update weights (for future ML tuning)
 */
export function updateWeights(category, newWeights) {
  const categories = {
    pathAnalysis: pathAnalysisWeights,
    fatigue: fatigueWeights,
    aiConfusion: aiConfusionWeights,
    alerts: alertThresholds
  };

  if (categories[category]) {
    Object.assign(categories[category], newWeights);
  }
}
