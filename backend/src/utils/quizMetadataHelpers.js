/**
 * Quiz Metadata Helpers
 *
 * Utilities for building, parsing, and managing quiz generation metadata
 * Designed to work with Assignment records storing quiz metadata in JSON format
 *
 * Phase 1: Database Schema Design - QuizQuestion Junction Table Workaround
 */

/**
 * Build quiz metadata object
 *
 * @param {Object} params - Metadata parameters
 * @param {string} params.userId - User ID
 * @param {string} params.courseId - Course ID
 * @param {Object} params.scope - Quiz scope (type, sectionIds, etc.)
 * @param {number} params.userTheta - User's ability level
 * @param {Object} params.difficultyMix - Difficulty distribution
 * @param {Array} params.selectedQuestions - Selected questions with metadata
 * @returns {Object} Structured quiz metadata
 */
export function buildQuizMetadata({
  userId,
  courseId,
  scope,
  userTheta,
  difficultyMix,
  selectedQuestions,
}) {
  return {
    generatedAt: new Date().toISOString(),
    userId,
    courseId,
    scope,
    algorithm: {
      type: 'hybrid',
      userTheta,
      difficultyMix,
      catQuestions: selectedQuestions.filter(q => q.selectionMethod === 'cat').length,
      difficultyBasedQuestions: selectedQuestions.filter(q => q.selectionMethod === 'difficulty').length,
    },
    // CRITICAL: Store source question IDs for retrieval
    questionIds: selectedQuestions.map(q => q.question.Id),
    questionOrder: selectedQuestions.map((_, idx) => idx), // Randomized order
    sourceAssignmentIds: [...new Set(selectedQuestions.map(q => q.question.AssignmentId))],
    version: '1.0', // For future compatibility
  };
}

/**
 * Parse quiz metadata from string or object
 *
 * @param {string|Object} metadata - Quiz metadata (JSON string or object)
 * @returns {Object} Parsed metadata object
 * @throws {Error} If metadata is invalid or malformed
 */
export function parseQuizMetadata(metadata) {
  if (!metadata) {
    throw new Error('Quiz metadata not found');
  }

  try {
    if (typeof metadata === 'string') {
      return JSON.parse(metadata);
    }
    return metadata;
  } catch (error) {
    throw new Error(`Invalid quiz metadata: ${error.message}`);
  }
}

/**
 * Fetch quiz questions in correct order
 *
 * @param {Object} prisma - Prisma client instance
 * @param {Object} assignment - Assignment record with metadata
 * @returns {Promise<Array>} Ordered array of questions with choices
 */
export async function getQuizQuestions(prisma, assignment) {
  const metadata = parseQuizMetadata(assignment.Metadata);

  const questions = await prisma.mcqQuestions.findMany({
    where: { Id: { in: metadata.questionIds } },
    include: { McqChoices: true },
  });

  // Create a map for quick lookup
  const questionMap = new Map(questions.map(q => [q.Id, q]));

  // Reorder based on metadata.questionOrder
  return metadata.questionOrder.map(idx => {
    const questionId = metadata.questionIds[idx];
    return questionMap.get(questionId);
  }).filter(Boolean); // Remove any null entries
}

/**
 * Validate quiz metadata structure
 *
 * @param {Object} metadata - Metadata object to validate
 * @returns {Object} Validation result with errors array
 */
export function validateQuizMetadata(metadata) {
  const errors = [];

  if (!metadata.userId) errors.push('Missing userId');
  if (!metadata.courseId) errors.push('Missing courseId');
  if (!metadata.scope || !metadata.scope.type) errors.push('Missing or invalid scope');
  if (!metadata.algorithm) errors.push('Missing algorithm metadata');
  if (!Array.isArray(metadata.questionIds)) errors.push('Invalid questionIds array');
  if (!Array.isArray(metadata.questionOrder)) errors.push('Invalid questionOrder array');

  if (metadata.questionIds && metadata.questionOrder) {
    if (metadata.questionIds.length !== metadata.questionOrder.length) {
      errors.push('questionIds and questionOrder length mismatch');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
