/**
 * Adaptive Quiz Curation Service
 *
 * Orchestrates hybrid CAT + difficulty-based question selection
 * Coordinates: user context, question pool building, algorithm selection, result assembly
 *
 * Phase 4: Quiz Curation Service Orchestration
 */

import { selectQuestionsByCAT } from './catSelectionAlgorithm.js';
import { identifyWeakSections } from './weakAreasIdentificationService.js';
import { calculateDifficultyMix } from './quizDifficultyCalculator.js';

/**
 * Generate adaptive quiz with hybrid selection algorithm
 *
 * @param {Object} prisma - Prisma client instance
 * @param {Object} params - Quiz generation parameters
 * @param {string} params.userId - User ID
 * @param {string} params.courseId - Course ID
 * @param {Object} params.scope - Quiz scope configuration
 * @param {string} params.scope.type - Scope type ('entire_course', 'specific_sections', 'weak_areas')
 * @param {Array<string>} params.scope.sectionIds - Section IDs (for specific_sections)
 * @param {number} params.scope.weakAreaThreshold - Threshold for weak areas (default: 0.6)
 * @param {number} params.questionCount - Number of questions to generate (default: 10)
 * @param {Object} params.options - Additional options
 * @returns {Promise<Object>} Generated quiz with questions and metadata
 */
export async function generateAdaptiveQuiz(prisma, {
  userId,
  courseId,
  scope,
  questionCount = 10,
  options = {}
}) {
  // 1. Fetch user context (ability level)
  const userContext = await fetchUserContext(prisma, userId, courseId);

  // 2. Build question pool based on scope
  const questionPool = await buildQuestionPool(prisma, courseId, scope, userId);

  if (questionPool.length < questionCount) {
    // Auto-reduce question count if pool is insufficient
    console.warn(`Insufficient questions: ${questionPool.length} available, ${questionCount} requested. Reducing to ${questionPool.length}.`);
    questionCount = questionPool.length;
  }

  if (questionPool.length === 0) {
    throw new Error('No questions available for the specified scope');
  }

  // 3. Apply hybrid selection algorithm
  const selectedQuestions = await applyHybridSelection(
    questionPool,
    userContext.theta,
    questionCount,
    options
  );

  // 4. Assemble quiz response
  return assembleQuiz(selectedQuestions, userContext, scope);
}

/**
 * Fetch user context including ability level (Theta)
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} User context with theta and item count
 */
async function fetchUserContext(prisma, userId, courseId) {
  const userAbility = await prisma.userAbilities.findUnique({
    where: { UserId_CourseId: { UserId: userId, CourseId: courseId } }
  });

  return {
    theta: userAbility?.Theta || -1.5, // Default to beginner level
    itemCount: userAbility ? await getItemCount(prisma, userId, courseId) : 0,
    hasHistory: !!userAbility,
  };
}

/**
 * Get total number of items (questions) user has answered in course
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<number>} Total item count
 */
async function getItemCount(prisma, userId, courseId) {
  const submissionCount = await prisma.submissions.count({
    where: {
      CreatorId: userId,
      Assignments: {
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
 * Build question pool based on scope criteria
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} courseId - Course ID
 * @param {Object} scope - Scope configuration
 * @param {string} userId - User ID (for weak areas)
 * @returns {Promise<Array>} Array of questions with choices
 */
async function buildQuestionPool(prisma, courseId, scope, userId) {
  let sectionIds = [];

  switch (scope.type) {
    case 'entire_course':
      sectionIds = await getAllSectionIds(prisma, courseId);
      break;

    case 'specific_sections':
      sectionIds = scope.sectionIds || [];
      if (sectionIds.length === 0) {
        throw new Error('specific_sections scope requires sectionIds array');
      }
      break;

    case 'weak_areas':
      const weakSections = await identifyWeakSections(
        prisma, userId, courseId,
        {
          completionThreshold: scope.weakAreaThreshold || 0.6,
          includeZeroProgress: scope.includeZeroProgress !== false,
        }
      );
      sectionIds = weakSections.map(w => w.sectionId);

      if (sectionIds.length === 0) {
        console.warn('No weak areas identified, falling back to entire course');
        sectionIds = await getAllSectionIds(prisma, courseId);
      }
      break;

    default:
      throw new Error(`Invalid scope type: ${scope.type}`);
  }

  // Fetch questions from sections
  const questions = await prisma.mcqQuestions.findMany({
    where: {
      Assignments: {
        SectionId: { in: sectionIds }
      }
    },
    include: {
      McqChoices: true,
      Assignments: {
        select: {
          SectionId: true,
          Section: { select: { Title: true, Index: true } }
        }
      }
    }
  });

  return questions;
}

/**
 * Get all section IDs for a course
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} courseId - Course ID
 * @returns {Promise<Array<string>>} Array of section IDs
 */
async function getAllSectionIds(prisma, courseId) {
  const sections = await prisma.sections.findMany({
    where: { CourseId: courseId },
    select: { Id: true },
  });

  return sections.map(s => s.Id);
}

/**
 * Apply hybrid CAT + difficulty-based selection
 *
 * @param {Array} questionPool - Available questions
 * @param {number} userTheta - User ability level
 * @param {number} count - Number of questions to select
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Selected questions with metadata
 */
async function applyHybridSelection(questionPool, userTheta, count, options) {
  // Split by IRT availability
  const withIRT = questionPool.filter(q => q.ParamA && q.ParamB && q.ParamC);
  const withoutIRT = questionPool.filter(q => !q.ParamA || !q.ParamB || !q.ParamC);

  const catRatio = withIRT.length / questionPool.length;
  const catCount = Math.min(Math.round(count * catRatio), withIRT.length);
  const difficultyCount = count - catCount;

  let selected = [];

  // CAT selection for IRT-enabled questions
  if (catCount > 0 && withIRT.length > 0) {
    try {
      const catSelected = selectQuestionsByCAT(withIRT, userTheta, catCount, options);
      selected.push(...catSelected);
    } catch (error) {
      console.error('CAT selection failed:', error.message);
      // Fall back to difficulty-based selection
    }
  }

  // Difficulty-based fallback for non-IRT questions
  if (difficultyCount > 0 && withoutIRT.length > 0) {
    const difficultyMix = calculateDifficultyMix(userTheta);
    const diffSelected = selectByDifficulty(withoutIRT, difficultyMix, difficultyCount);
    selected.push(...diffSelected);
  }

  // If we don't have enough questions, fill from remaining pool
  if (selected.length < count) {
    const remaining = questionPool.filter(q =>
      !selected.some(s => s.question.Id === q.Id)
    );
    const needed = count - selected.length;
    const additionalQuestions = shuffle(remaining).slice(0, needed);
    selected.push(...additionalQuestions.map(q => ({
      question: q,
      selectionMethod: 'random'
    })));
  }

  // Shuffle to mix CAT and difficulty questions
  return shuffle(selected).slice(0, count);
}

/**
 * Select questions by difficulty category
 *
 * @param {Array} questions - Questions without IRT parameters
 * @param {Object} difficultyMix - Difficulty distribution
 * @param {number} count - Number of questions to select
 * @returns {Array} Selected questions with metadata
 */
function selectByDifficulty(questions, difficultyMix, count) {
  const easyCount = Math.round(count * difficultyMix.easy);
  const mediumCount = Math.round(count * difficultyMix.medium);
  const hardCount = count - easyCount - mediumCount;

  const easyQuestions = questions.filter(q => q.Difficulty === 'Easy');
  const mediumQuestions = questions.filter(q => q.Difficulty === 'Medium');
  const hardQuestions = questions.filter(q => q.Difficulty === 'Hard');

  const selected = [
    ...shuffle(easyQuestions).slice(0, easyCount),
    ...shuffle(mediumQuestions).slice(0, mediumCount),
    ...shuffle(hardQuestions).slice(0, hardCount)
  ];

  return selected.map(q => ({ question: q, selectionMethod: 'difficulty' }));
}

/**
 * Fisher-Yates shuffle algorithm
 *
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array (new copy)
 */
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Assemble final quiz response
 *
 * @param {Array} selectedQuestions - Selected questions with metadata
 * @param {Object} userContext - User context
 * @param {Object} scope - Quiz scope
 * @returns {Object} Quiz response object
 */
function assembleQuiz(selectedQuestions, userContext, scope) {
  return {
    questions: selectedQuestions.map(s => s.question),
    metadata: {
      userTheta: userContext.theta,
      difficultyMix: calculateDifficultyMix(userContext.theta),
      selectionMethod: 'hybrid',
      catQuestions: selectedQuestions.filter(s => s.selectionMethod === 'cat').length,
      difficultyBasedQuestions: selectedQuestions.filter(s => s.selectionMethod === 'difficulty').length,
      randomQuestions: selectedQuestions.filter(s => s.selectionMethod === 'random').length,
      scope: scope.type,
      hasUserHistory: userContext.hasHistory,
      itemCount: userContext.itemCount,
    }
  };
}

