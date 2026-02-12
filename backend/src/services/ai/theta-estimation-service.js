/**
 * Theta Estimation Service
 *
 * Hybrid Theta estimation: MAP/EAP for early stage (< 15 items) → MLE for mature data (≥ 15 items)
 * Updates UserAbilities.Theta on quiz completion
 *
 * Phase 7: Hybrid Theta Estimation on Quiz Completion
 */

import { calculate3PLProbability } from './irt-math-utilities.js';

const ITEM_THRESHOLD = 15; // Switch from MAP to MLE at 15 items
const PRIOR_MEAN = 0; // Normal distribution mean
const PRIOR_VAR = 1; // Normal distribution variance
const MAX_ITERATIONS = 10; // Newton-Raphson iterations
const CONVERGENCE_THRESHOLD = 0.001; // Convergence criteria

/**
 * Update user Theta based on quiz performance
 * Hybrid: MAP for early stage, MLE for mature data
 *
 * @param {Object} prisma - Prisma client instance
 * @param {Object} params - Theta update parameters
 * @param {string} params.userId - User ID
 * @param {string} params.courseId - Course ID
 * @param {Array} params.quizQuestions - Questions from quiz (with IRT params)
 * @param {Array} params.userAnswers - User's responses (boolean array: correct/incorrect)
 * @returns {Promise<Object>} Theta update result
 */
export async function updateUserTheta(prisma, {
  userId,
  courseId,
  quizQuestions,
  userAnswers
}) {
  // Filter only IRT-enabled questions
  const irtQuestions = quizQuestions.filter((q, idx) => {
    return q.ParamA && q.ParamB && q.ParamC && userAnswers[idx] !== undefined;
  });

  if (irtQuestions.length === 0) {
    console.warn('[Theta Update] No IRT questions in quiz, skipping update');
    return { updated: false, reason: 'no_irt_questions' };
  }

  // Get current ability and item count
  const userAbility = await prisma.userAbilities.findUnique({
    where: { userId_courseId: { userId, courseId } }
  });

  const currentTheta = userAbility?.Theta || 0;
  const itemCount = await getTotalItemCount(prisma, userId, courseId);

  // Filter answers to match IRT questions
  const irtAnswers = irtQuestions.map((q, idx) => {
    const originalIdx = quizQuestions.indexOf(q);
    return userAnswers[originalIdx];
  });

  // Choose estimation method based on item count
  let newTheta;
  let method;

  if (itemCount < ITEM_THRESHOLD) {
    newTheta = estimateThetaMAP(currentTheta, irtQuestions, irtAnswers);
    method = 'MAP';
    console.log(`[Theta Update] Using MAP (${itemCount} items)`);
  } else {
    newTheta = estimateThetaMLE(currentTheta, irtQuestions, irtAnswers);
    method = 'MLE';
    console.log(`[Theta Update] Using MLE (${itemCount} items)`);
  }

  // Clamp theta to reasonable range
  newTheta = Math.max(-3, Math.min(3, newTheta));

  // Update or create UserAbilities record
  await prisma.userAbilities.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {
      Theta: newTheta,
      LastUpdate: new Date(),
    },
    create: {
      UserId: userId,
      CourseId: courseId,
      Theta: newTheta,
      LastUpdate: new Date(),
    }
  });

  console.log(`[Theta Update] ${userId} in ${courseId}: ${currentTheta.toFixed(3)} → ${newTheta.toFixed(3)} (${method})`);

  return {
    updated: true,
    oldTheta: currentTheta,
    newTheta,
    method,
    itemCount,
    questionsUsed: irtQuestions.length,
  };
}

/**
 * MAP (Maximum A Posteriori) estimation with N(0,1) prior
 * Suitable for early stage with sparse data
 *
 * Uses Newton-Raphson optimization with Bayesian prior
 *
 * @param {number} currentTheta - Current theta estimate
 * @param {Array} questions - Questions with IRT parameters
 * @param {Array} answers - User answers (boolean array)
 * @returns {number} Estimated theta
 */
function estimateThetaMAP(currentTheta, questions, answers) {
  let theta = currentTheta;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let derivative = 0;
    let secondDerivative = 0;

    // Calculate derivatives from likelihood
    questions.forEach((q, idx) => {
      const u = answers[idx] ? 1 : 0;
      const P = calculate3PLProbability(theta, q.ParamA, q.ParamB, q.ParamC);
      const Q = 1 - P;

      // First derivative of log-likelihood
      // dL/dθ = a × (P - c) / (1 - c) × (u - P) / (P × Q)
      const dP = q.ParamA * (P - q.ParamC) * Q / (1 - q.ParamC);
      derivative += (u - P) / (P * Q) * dP;

      // Second derivative
      const d2P = -(q.ParamA ** 2) * (P - q.ParamC) * Q * (P - q.ParamC + Q) / ((1 - q.ParamC) ** 2);
      secondDerivative += d2P / (P * Q) - (dP ** 2 * (Q - P)) / (P ** 2 * Q ** 2);
    });

    // Add prior derivative (MAP component)
    // Prior: N(0, 1) → derivative = -(θ - μ) / σ²
    derivative -= (theta - PRIOR_MEAN) / PRIOR_VAR;
    secondDerivative -= 1 / PRIOR_VAR;

    // Newton-Raphson update
    const delta = -derivative / secondDerivative;
    theta += delta;

    // Check convergence
    if (Math.abs(delta) < CONVERGENCE_THRESHOLD) {
      console.log(`[MAP] Converged in ${iter + 1} iterations`);
      break;
    }
  }

  return theta;
}

/**
 * MLE (Maximum Likelihood Estimation)
 * Suitable for mature data with sufficient observations
 *
 * Uses Newton-Raphson optimization without prior
 *
 * @param {number} currentTheta - Current theta estimate
 * @param {Array} questions - Questions with IRT parameters
 * @param {Array} answers - User answers (boolean array)
 * @returns {number} Estimated theta
 */
function estimateThetaMLE(currentTheta, questions, answers) {
  let theta = currentTheta;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let derivative = 0;
    let secondDerivative = 0;

    questions.forEach((q, idx) => {
      const u = answers[idx] ? 1 : 0;
      const P = calculate3PLProbability(theta, q.ParamA, q.ParamB, q.ParamC);
      const Q = 1 - P;

      // First derivative
      const dP = q.ParamA * (P - q.ParamC) * Q / (1 - q.ParamC);
      derivative += (u - P) / (P * Q) * dP;

      // Second derivative
      const d2P = -(q.ParamA ** 2) * (P - q.ParamC) * Q * (P - q.ParamC + Q) / ((1 - q.ParamC) ** 2);
      secondDerivative += d2P / (P * Q) - (dP ** 2 * (Q - P)) / (P ** 2 * Q ** 2);
    });

    // Newton-Raphson update (no prior for MLE)
    const delta = -derivative / secondDerivative;
    theta += delta;

    // Check convergence
    if (Math.abs(delta) < CONVERGENCE_THRESHOLD) {
      console.log(`[MLE] Converged in ${iter + 1} iterations`);
      break;
    }
  }

  return theta;
}

/**
 * Get total item count for user in course
 * Estimates number of questions answered based on submissions
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<number>} Total item count
 */
async function getTotalItemCount(prisma, userId, courseId) {
  const submissionCount = await prisma.submissions.count({
    where: {
      CreatorId: userId,
      assignment: {
        Section: {
          CourseId: courseId
        }
      }
    }
  });

  // Estimate ~10 questions per submission (rough average)
  return submissionCount * 10;
}

/**
 * Calculate standard error of theta estimate
 * SE(θ) = 1 / sqrt(-d²L/dθ²)
 *
 * @param {number} theta - Theta estimate
 * @param {Array} questions - Questions with IRT parameters
 * @returns {number} Standard error
 */
export function calculateThetaStandardError(theta, questions) {
  let information = 0;

  questions.forEach(q => {
    if (!q.ParamA || !q.ParamB || !q.ParamC) return;

    const P = calculate3PLProbability(theta, q.ParamA, q.ParamB, q.ParamC);
    const Q = 1 - P;

    // Information = a² × [(P - c)² / (1 - c)²] × [Q / P]
    const numerator = (P - q.ParamC) ** 2;
    const denominator = (1 - q.ParamC) ** 2;

    if (denominator > 0 && P > 0) {
      information += (q.ParamA ** 2) * (numerator / denominator) * (Q / P);
    }
  });

  return information > 0 ? 1 / Math.sqrt(information) : Infinity;
}

/**
 * Estimate theta using EAP (Expected A Posteriori)
 * Alternative Bayesian method - more stable but computationally expensive
 *
 * @param {Array} questions - Questions with IRT parameters
 * @param {Array} answers - User answers (boolean array)
 * @param {number} priorMean - Prior mean (default: 0)
 * @param {number} priorSD - Prior standard deviation (default: 1)
 * @returns {number} Estimated theta
 */
export function estimateThetaEAP(questions, answers, priorMean = 0, priorSD = 1) {
  // Quadrature points for numerical integration
  const quadPoints = 41; // Number of quadrature points
  const minTheta = -4;
  const maxTheta = 4;
  const step = (maxTheta - minTheta) / (quadPoints - 1);

  const thetas = [];
  const likelihoods = [];
  const priors = [];

  for (let i = 0; i < quadPoints; i++) {
    const theta = minTheta + i * step;
    thetas.push(theta);

    // Calculate likelihood
    let logLikelihood = 0;
    questions.forEach((q, idx) => {
      const P = calculate3PLProbability(theta, q.ParamA, q.ParamB, q.ParamC);
      const u = answers[idx] ? 1 : 0;
      logLikelihood += u * Math.log(P) + (1 - u) * Math.log(1 - P);
    });
    likelihoods.push(Math.exp(logLikelihood));

    // Calculate prior (normal distribution)
    const prior = Math.exp(-0.5 * ((theta - priorMean) / priorSD) ** 2) / (priorSD * Math.sqrt(2 * Math.PI));
    priors.push(prior);
  }

  // Calculate posterior
  const posteriors = likelihoods.map((l, i) => l * priors[i]);
  const totalPosterior = posteriors.reduce((a, b) => a + b, 0);

  // EAP = E[θ | responses] = ∫ θ × P(θ | responses) dθ
  let eap = 0;
  thetas.forEach((theta, i) => {
    eap += theta * posteriors[i] / totalPosterior;
  });

  return eap;
}
