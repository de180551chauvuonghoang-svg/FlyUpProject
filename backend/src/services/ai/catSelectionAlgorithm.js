/**
 * CAT (Computerized Adaptive Testing) Selection Algorithm
 *
 * Selects questions that maximize information at user's ability level
 * using IRT (Item Response Theory) 3PL model
 *
 * Phase 2: CAT Selection Algorithm Implementation
 */

import { calculate3PLInformation, validateIRTParameters } from './irtMathUtilities.js';

/**
 * Select questions using CAT algorithm
 * Maximizes information at user's ability level
 *
 * @param {Array} questions - Questions with IRT parameters (ParamA, ParamB, ParamC)
 * @param {number} userTheta - User's ability level (typically -3 to +3)
 * @param {number} count - Number of questions to select
 * @param {Object} options - Additional options
 * @param {Array<string>} options.excludeQuestionIds - Recently answered questions to exclude
 * @param {number} options.minInformation - Minimum information threshold (default: 0.01)
 * @returns {Array} Selected questions with information scores
 */
export function selectQuestionsByCAT(questions, userTheta, count, options = {}) {
  const {
    excludeQuestionIds = [], // Recently answered questions
    minInformation = 0.01,    // Minimum information threshold
  } = options;

  // Filter out excluded questions
  const availableQuestions = questions.filter(q => !excludeQuestionIds.includes(q.Id));

  // Filter questions with valid IRT parameters
  const catQuestions = availableQuestions.filter(q => {
    const params = validateIRTParameters(q.ParamA, q.ParamB, q.ParamC);
    return params.isValid;
  });

  if (catQuestions.length === 0) {
    throw new Error('No questions with valid IRT parameters available');
  }

  // Calculate information for each question
  const questionsWithInfo = catQuestions.map(question => {
    const information = calculate3PLInformation(
      userTheta,
      question.ParamA,
      question.ParamB,
      question.ParamC
    );

    return {
      question,
      information,
      selectionMethod: 'cat',
    };
  });

  // Filter by minimum information
  let informativeQuestions = questionsWithInfo.filter(q => q.information >= minInformation);

  if (informativeQuestions.length === 0) {
    console.warn(`No questions meet minimum information threshold (${minInformation})`);
    // Use all questions anyway
    informativeQuestions = [...questionsWithInfo];
  }

  // Sort by information (descending)
  informativeQuestions.sort((a, b) => b.information - a.information);

  // Select top N questions
  const selected = informativeQuestions.slice(0, count);

  // Log selection statistics
  const avgInformation = selected.reduce((sum, q) => sum + q.information, 0) / selected.length;
  console.log(`CAT selected ${selected.length} questions, avg info: ${avgInformation.toFixed(3)}`);

  return selected;
}

/**
 * Calculate total information of a question set
 * Test Information Function = sum of individual information values
 *
 * Higher test information = more precise ability estimation
 *
 * @param {Array} questions - Questions with IRT parameters
 * @param {number} userTheta - User's ability level
 * @returns {number} Total test information
 */
export function calculateTestInformation(questions, userTheta) {
  return questions.reduce((total, q) => {
    const params = validateIRTParameters(q.ParamA, q.ParamB, q.ParamC);
    if (!params.isValid) return total;

    const info = calculate3PLInformation(userTheta, q.ParamA, q.ParamB, q.ParamC);
    return total + info;
  }, 0);
}

/**
 * Estimate standard error of ability estimation
 * SE(θ) = 1 / sqrt(I(θ))
 *
 * Lower standard error = more precise measurement
 *
 * @param {number} testInformation - Total test information
 * @returns {number} Standard error of ability estimate
 */
export function calculateStandardError(testInformation) {
  if (testInformation <= 0) {
    return Infinity;
  }
  return 1 / Math.sqrt(testInformation);
}

/**
 * Select questions with balanced difficulty distribution
 * Useful when CAT pool is limited
 *
 * @param {Array} questions - Questions with IRT parameters
 * @param {number} userTheta - User's ability level
 * @param {number} count - Number of questions to select
 * @param {Object} options - Additional options
 * @returns {Array} Selected questions with balanced difficulty
 */
export function selectBalancedQuestions(questions, userTheta, count, options = {}) {
  const {
    excludeQuestionIds = [],
    difficultyBands = 3, // Number of difficulty bands
  } = options;

  // Filter available questions
  const availableQuestions = questions.filter(q => !excludeQuestionIds.includes(q.Id));

  // Filter questions with valid IRT parameters
  const catQuestions = availableQuestions.filter(q => {
    const params = validateIRTParameters(q.ParamA, q.ParamB, q.ParamC);
    return params.isValid;
  });

  if (catQuestions.length === 0) {
    throw new Error('No questions with valid IRT parameters available');
  }

  // Calculate information for each question
  const questionsWithInfo = catQuestions.map(question => {
    const information = calculate3PLInformation(
      userTheta,
      question.ParamA,
      question.ParamB,
      question.ParamC
    );

    // Calculate distance from user ability
    const difficultyDistance = Math.abs(question.ParamB - userTheta);

    return {
      question,
      information,
      difficultyDistance,
      selectionMethod: 'cat',
    };
  });

  // Sort by information
  questionsWithInfo.sort((a, b) => b.information - a.information);

  // Group into difficulty bands based on distance from theta
  const bands = [];
  for (let i = 0; i < difficultyBands; i++) {
    bands.push([]);
  }

  questionsWithInfo.forEach(q => {
    // Assign to band based on difficulty distance
    const bandIndex = Math.min(
      Math.floor(q.difficultyDistance * difficultyBands / 3), // Assume theta range is ~3
      difficultyBands - 1
    );
    bands[bandIndex].push(q);
  });

  // Select from each band proportionally
  const selected = [];
  const perBand = Math.ceil(count / difficultyBands);

  for (const band of bands) {
    const bandSelection = band.slice(0, perBand);
    selected.push(...bandSelection);

    if (selected.length >= count) {
      break;
    }
  }

  return selected.slice(0, count);
}

/**
 * Analyze question pool coverage
 * Useful for debugging and pool quality assessment
 *
 * @param {Array} questions - Questions with IRT parameters
 * @returns {Object} Coverage statistics
 */
export function analyzeQuestionPoolCoverage(questions) {
  const validQuestions = questions.filter(q => {
    const params = validateIRTParameters(q.ParamA, q.ParamB, q.ParamC);
    return params.isValid;
  });

  const difficulties = validQuestions.map(q => q.ParamB);
  const discriminations = validQuestions.map(q => q.ParamA);

  return {
    totalQuestions: questions.length,
    validIRTQuestions: validQuestions.length,
    coverage: validQuestions.length / questions.length,
    difficultyRange: {
      min: Math.min(...difficulties),
      max: Math.max(...difficulties),
      mean: difficulties.reduce((a, b) => a + b, 0) / difficulties.length,
    },
    discriminationRange: {
      min: Math.min(...discriminations),
      max: Math.max(...discriminations),
      mean: discriminations.reduce((a, b) => a + b, 0) / discriminations.length,
    },
  };
}

