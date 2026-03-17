/**
 * IRT (Item Response Theory) Mathematical Utilities
 *
 * Based on 3-Parameter Logistic (3PL) model for Computerized Adaptive Testing
 *
 * References:
 * - Wikipedia: Item Response Theory (https://en.wikipedia.org/wiki/Item_response_theory)
 * - Baker, F. B. (2001). The Basics of Item Response Theory
 * - Lord, F. M. (1980). Applications of Item Response Theory to Practical Testing Problems
 *
 * Phase 2: CAT Selection Algorithm Implementation
 */

/**
 * Calculate probability of correct response using 3PL model
 *
 * The 3PL model is the most common IRT model for multiple-choice questions.
 * It accounts for item discrimination, difficulty, and guessing.
 *
 * @param {number} theta - User ability level (-3 to +3 typical range)
 * @param {number} a - Item discrimination (ParamA, typically 0.5 to 2.5)
 * @param {number} b - Item difficulty (ParamB, same scale as theta)
 * @param {number} c - Guessing parameter (ParamC, typically 0 to 0.35)
 * @returns {number} Probability of correct response (0 to 1)
 *
 * Formula: P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
 */
export function calculate3PLProbability(theta, a, b, c) {
  // Validate inputs
  if (!Number.isFinite(theta) || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
    throw new Error('Invalid input: all parameters must be finite numbers');
  }

  if (c < 0 || c > 1) {
    throw new Error('Guessing parameter c must be between 0 and 1');
  }

  // Calculate exponent with bounds checking to prevent overflow
  const exponent = -a * (theta - b);
  const boundedExponent = Math.max(-20, Math.min(20, exponent)); // Prevent overflow

  const probability = c + (1 - c) / (1 + Math.exp(boundedExponent));

  // Ensure probability is in valid range
  return Math.max(0, Math.min(1, probability));
}

/**
 * Calculate item information using 3PL model (CORRECTED FORMULA)
 *
 * Information quantifies how much the question contributes to ability estimation
 * at a given ability level. Higher information = more precise measurement.
 *
 * @param {number} theta - User ability level
 * @param {number} a - Item discrimination (ParamA)
 * @param {number} b - Item difficulty (ParamB)
 * @param {number} c - Guessing parameter (ParamC)
 * @returns {number} Information value (higher = more informative)
 *
 * Formula: I(θ) = a² × [(P - c)² / (1 - c)²] × [(1 - P) / P]
 *
 * Note: This is the CORRECTED formula based on research validation.
 * The (P - c) / (1 - c) term accounts for guessing effect.
 *
 * Derivation:
 *   Let Q(θ) = 1 - P(θ)
 *   I(θ) = [P'(θ)]² / [P(θ) × Q(θ)]
 *
 *   For 3PL:
 *     P'(θ) = a × (P - c) × Q / (1 - c)
 *
 *   Therefore:
 *     I(θ) = a² × [(P - c)² / (1 - c)²] × [Q / P]
 */
export function calculate3PLInformation(theta, a, b, c) {
  const P = calculate3PLProbability(theta, a, b, c);
  const Q = 1 - P;

  // Handle edge cases - minimal information at extremes
  if (P <= 0.001 || P >= 0.999) {
    return 0;
  }

  // 3PL information formula
  const numerator = (P - c) ** 2;
  const denominator = (1 - c) ** 2;

  if (denominator === 0) {
    return 0; // No information if c = 1 (pure guessing)
  }

  const information = (a ** 2) * (numerator / denominator) * (Q / P);

  return Math.max(0, information); // Ensure non-negative
}

/**
 * Calculate information for 2PL model (c = 0)
 * Simplified case of 3PL when there is no guessing parameter
 *
 * @param {number} theta - User ability level
 * @param {number} a - Item discrimination
 * @param {number} b - Item difficulty
 * @returns {number} Information value
 *
 * Formula: I(θ) = a² × P × (1 - P)
 */
export function calculate2PLInformation(theta, a, b) {
  const P = calculate3PLProbability(theta, a, b, 0);
  const Q = 1 - P;

  return (a ** 2) * P * Q;
}

/**
 * Validate IRT parameters
 *
 * Checks if question has valid IRT parameters for CAT selection
 *
 * @param {number} a - Item discrimination (ParamA)
 * @param {number} b - Item difficulty (ParamB)
 * @param {number} c - Guessing parameter (ParamC)
 * @returns {Object} Validation result
 */
export function validateIRTParameters(a, b, c) {
  const hasA = a !== null && a !== undefined && Number.isFinite(a);
  const hasB = b !== null && b !== undefined && Number.isFinite(b);
  const hasC = c !== null && c !== undefined && Number.isFinite(c);

  return {
    hasA,
    hasB,
    hasC,
    isValid: hasA && hasB && hasC,
  };
}

/**
 * Calculate expected score on a question
 * Useful for predicting user performance
 *
 * @param {number} theta - User ability level
 * @param {number} a - Item discrimination
 * @param {number} b - Item difficulty
 * @param {number} c - Guessing parameter
 * @param {number} maxScore - Maximum points for the question
 * @returns {number} Expected score
 */
export function calculateExpectedScore(theta, a, b, c, maxScore = 1) {
  const probability = calculate3PLProbability(theta, a, b, c);
  return probability * maxScore;
}

/**
 * Estimate difficulty level category from IRT parameters
 * Maps continuous IRT difficulty to categorical levels
 *
 * @param {number} b - Item difficulty (ParamB)
 * @returns {string} Difficulty category ('Easy', 'Medium', 'Hard')
 */
export function estimateDifficultyCategory(b) {
  if (b < -1) return 'Easy';
  if (b <= 1) return 'Medium';
  return 'Hard';
}
