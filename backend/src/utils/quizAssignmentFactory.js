/**
 * Quiz Assignment Factory
 *
 * Creates Assignment records for AI-generated quizzes with metadata storage
 * Workaround for no-migration constraint: stores metadata as JSON
 *
 * Phase 1: Database Schema Design - QuizQuestion Junction Table Workaround
 */

import { buildQuizMetadata } from './quizMetadataHelpers.js';

/**
 * Create Assignment record for generated quiz
 *
 * NOTE: This implementation assumes Assignments table will have a Metadata field added
 * as a minimal migration (nullable Json field). If not available, this will need adjustment.
 *
 * @param {Object} prisma - Prisma client instance
 * @param {Object} params - Quiz assignment parameters
 * @param {string} params.name - Quiz name
 * @param {number} params.duration - Duration in minutes
 * @param {number} params.gradeToPass - Minimum passing grade (0-100)
 * @param {string} params.sectionId - Section ID for the quiz
 * @param {string} params.userId - User ID (creator)
 * @param {string} params.courseId - Course ID
 * @param {Object} params.scope - Scope criteria
 * @param {number} params.userTheta - User's ability level
 * @param {Object} params.difficultyMix - Difficulty distribution
 * @param {Array} params.selectedQuestions - Selected questions with metadata
 * @returns {Promise<Object>} Created assignment record
 */
export async function createQuizAssignment(prisma, {
  name,
  duration,
  gradeToPass,
  sectionId,
  userId,
  courseId,
  scope,
  userTheta,
  difficultyMix,
  selectedQuestions,
}) {
  const metadata = buildQuizMetadata({
    userId,
    courseId,
    scope,
    userTheta,
    difficultyMix,
    selectedQuestions,
  });

  // Create assignment
  // NOTE: Metadata field needs to be added to schema as nullable Json field
  const assignment = await prisma.assignments.create({
    data: {
      Name: name || `AI Quiz: ${new Date().toLocaleDateString()}`,
      Duration: duration || 30,
      QuestionCount: selectedQuestions.length,
      GradeToPass: gradeToPass || 60,
      SectionId: sectionId,
      CreatorId: userId,
      // Metadata: metadata, // Uncomment when Metadata field is added
    },
  });

  // TEMPORARY WORKAROUND: Store metadata separately if needed
  // This could be stored in Redis or a separate table until schema is updated
  // For now, we'll return the assignment and metadata separately
  return {
    ...assignment,
    _metadata: metadata, // Temporary field for metadata
  };
}

/**
 * Get primary section ID for a course
 * Falls back to first section if no primary section exists
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} courseId - Course ID
 * @returns {Promise<string>} Section ID
 * @throws {Error} If course has no sections
 */
export async function getPrimarySectionId(prisma, courseId) {
  const firstSection = await prisma.sections.findFirst({
    where: { CourseId: courseId },
    orderBy: { Index: 'asc' },
  });

  if (!firstSection) {
    throw new Error('Course has no sections');
  }

  return firstSection.Id;
}

/**
 * Update quiz assignment metadata
 * Useful for updating quiz state after user interactions
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} assignmentId - Assignment ID
 * @param {Object} metadataUpdates - Partial metadata updates
 * @returns {Promise<Object>} Updated assignment
 */
export async function updateQuizMetadata(prisma, assignmentId, metadataUpdates) {
  const assignment = await prisma.assignments.findUnique({
    where: { Id: assignmentId },
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  // Parse existing metadata
  // const existingMetadata = assignment.Metadata ? JSON.parse(assignment.Metadata) : {};

  // Merge updates
  // const updatedMetadata = { ...existingMetadata, ...metadataUpdates };

  // Update assignment
  // return await prisma.assignments.update({
  //   where: { Id: assignmentId },
  //   data: { Metadata: JSON.stringify(updatedMetadata) },
  // });

  // TEMPORARY: Return assignment as-is until Metadata field is added
  console.warn('updateQuizMetadata: Metadata field not yet available in schema');
  return assignment;
}

