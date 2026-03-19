/**
 * Quiz Difficulty Calculator
 *
 * Maps user ability (Theta) to optimal difficulty distribution
 * Research-validated thresholds for adaptive learning
 *
 * Phase 4: Quiz Curation Service Orchestration
 */

/**
 * Map Theta to difficulty distribution
 * Research-validated thresholds for optimal learning zone
 *
 * Based on Vygotsky's Zone of Proximal Development:
 * - Too easy: minimal learning
 * - Too hard: frustration and disengagement
 * - Optimal: challenging but achievable (60-75% success rate)
 *
 * @param {number} theta - User ability level (-3 to +3 typical range)
 * @returns {Object} Difficulty distribution {easy, medium, hard}
 */
export function calculateDifficultyMix(theta) {
  if (theta < -1.5) {
    // Beginner: focus on building confidence
    return { easy: 0.60, medium: 0.30, hard: 0.10 };
  } else if (theta < 0.5) {
    // Intermediate: balanced challenge
    return { easy: 0.30, medium: 0.50, hard: 0.20 };
  } else {
    // Advanced: push capabilities
    return { easy: 0.10, medium: 0.30, hard: 0.60 };
  }
}

/**
 * Calculate difficulty mix with custom granularity
 * Allows for more nuanced difficulty distributions
 *
 * @param {number} theta - User ability level
 * @param {number} granularity - Number of difficulty levels (default: 3)
 * @returns {Object} Difficulty distribution
 */
export function calculateGranularDifficultyMix(theta, granularity = 3) {
  if (granularity === 3) {
    return calculateDifficultyMix(theta);
  }

  // For 5-level granularity: very easy, easy, medium, hard, very hard
  if (granularity === 5) {
    if (theta < -2) {
      return { veryEasy: 0.40, easy: 0.35, medium: 0.15, hard: 0.07, veryHard: 0.03 };
    } else if (theta < -1) {
      return { veryEasy: 0.20, easy: 0.40, medium: 0.25, hard: 0.10, veryHard: 0.05 };
    } else if (theta < 0) {
      return { veryEasy: 0.10, easy: 0.25, medium: 0.35, hard: 0.20, veryHard: 0.10 };
    } else if (theta < 1) {
      return { veryEasy: 0.05, easy: 0.15, medium: 0.30, hard: 0.35, veryHard: 0.15 };
    } else {
      return { veryEasy: 0.03, easy: 0.07, medium: 0.20, hard: 0.40, veryHard: 0.30 };
    }
  }

  // Default fallback to 3-level
  return calculateDifficultyMix(theta);
}

/**
 * Map IRT difficulty parameter (b) to categorical difficulty
 *
 * @param {number} paramB - IRT difficulty parameter
 * @returns {string} Difficulty category ('Easy', 'Medium', 'Hard')
 */
export function mapIRTToDifficulty(paramB) {
  if (paramB < -1) return 'Easy';
  if (paramB <= 1) return 'Medium';
  return 'Hard';
}

/**
 * Calculate expected success rate for a difficulty mix
 * Useful for predicting quiz performance
 *
 * @param {Object} difficultyMix - Difficulty distribution
 * @param {number} theta - User ability level
 * @returns {number} Expected success rate (0-1)
 */
export function calculateExpectedSuccessRate(difficultyMix, theta) {
  // Simplified model: assume success rates by difficulty relative to theta
  const easySuccess = Math.min(0.95, 0.60 + (theta + 1.5) * 0.15);
  const mediumSuccess = Math.min(0.85, 0.50 + theta * 0.15);
  const hardSuccess = Math.min(0.75, 0.40 + (theta - 0.5) * 0.15);

  const expectedRate =
    difficultyMix.easy * easySuccess +
    difficultyMix.medium * mediumSuccess +
    difficultyMix.hard * hardSuccess;

  return Math.max(0, Math.min(1, expectedRate));
}

/**
 * Adjust difficulty mix based on recent performance
 * Adaptive adjustment for personalized learning
 *
 * @param {Object} currentMix - Current difficulty distribution
 * @param {number} recentSuccessRate - Recent quiz success rate (0-1)
 * @param {number} targetSuccessRate - Target success rate (default: 0.65)
 * @returns {Object} Adjusted difficulty mix
 */
export function adjustDifficultyMix(currentMix, recentSuccessRate, targetSuccessRate = 0.65) {
  const delta = targetSuccessRate - recentSuccessRate;

  // If performing better than target, increase difficulty
  if (delta < -0.10) {
    return {
      easy: Math.max(0.05, currentMix.easy - 0.10),
      medium: currentMix.medium,
      hard: Math.min(0.70, currentMix.hard + 0.10),
    };
  }

  // If performing worse than target, decrease difficulty
  if (delta > 0.10) {
    return {
      easy: Math.min(0.70, currentMix.easy + 0.10),
      medium: currentMix.medium,
      hard: Math.max(0.05, currentMix.hard - 0.10),
    };
  }

  // Performance is on target, maintain current mix
  return currentMix;
}

/**
 * Validate difficulty mix totals to 1.0
 *
 * @param {Object} difficultyMix - Difficulty distribution
 * @returns {boolean} True if valid
 */
export function validateDifficultyMix(difficultyMix) {
  const total = Object.values(difficultyMix).reduce((sum, val) => sum + val, 0);
  return Math.abs(total - 1.0) < 0.01; // Allow small floating point error
}

/**
 * Normalize difficulty mix to sum to 1.0
 * Useful when adjustments cause drift
 *
 * @param {Object} difficultyMix - Difficulty distribution
 * @returns {Object} Normalized difficulty mix
 */
export function normalizeDifficultyMix(difficultyMix) {
  const total = Object.values(difficultyMix).reduce((sum, val) => sum + val, 0);

  if (total === 0) {
    // Return equal distribution if all zeros
    const keys = Object.keys(difficultyMix);
    const equalValue = 1.0 / keys.length;
    return Object.fromEntries(keys.map(key => [key, equalValue]));
  }

  const normalized = {};
  for (const [key, value] of Object.entries(difficultyMix)) {
    normalized[key] = value / total;
  }

  return normalized;
}
