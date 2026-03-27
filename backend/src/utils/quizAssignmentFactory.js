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

  // Use a transaction to create assignment and its questions/choices
  return await prisma.$transaction(async (tx) => {
    // 1. Create assignment
    const assignment = await tx.assignments.create({
      data: {
        Name: name || `AI Quiz: ${new Date().toLocaleDateString()}`,
        Duration: duration || 30,
        QuestionCount: selectedQuestions.length,
        GradeToPass: gradeToPass || 6.0, // Default passing grade
        SectionId: sectionId,
        CourseId: courseId, // Ensure CourseId is saved!
        CreatorId: userId,
      },
    });

    // 2. Create questions and choices if provided
    if (selectedQuestions && selectedQuestions.length > 0) {
      for (const qData of selectedQuestions) {
        // Handle different structures of selectedQuestions
        const q = qData.question || qData;
        
        const createdQuestion = await tx.mcqQuestions.create({
          data: {
            AssignmentId: assignment.Id,
            Content: q.Content || q.content,
            Difficulty: q.Difficulty || q.difficulty || "Mixed",
            ParamA: q.ParamA || 1.0,
            ParamB: q.ParamB || 0.0,
            ParamC: q.ParamC || 0.25,
            SourceQuestionBankQuestionId: q.SourceQuestionBankQuestionId || null
          }
        });

        // Create choices for this question
        const choices = q.McqChoices || q.choices || [];
        if (choices.length > 0) {
          await tx.mcqChoices.createMany({
            data: choices.map(c => ({
              McqQuestionId: createdQuestion.Id,
              Content: c.Content || c.content,
              IsCorrect: c.IsCorrect ?? c.isCorrect ?? false,
              SourceQuestionBankChoiceId: c.SourceQuestionBankChoiceId || null
            }))
          });
        }
      }
    }

    return {
      ...assignment,
      _metadata: metadata,
    };
  });
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

