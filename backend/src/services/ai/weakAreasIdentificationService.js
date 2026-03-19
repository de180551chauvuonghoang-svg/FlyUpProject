/**
 * Weak Areas Identification Service
 *
 * Identifies sections where user struggles based on completion rates and assignment scores
 * Research-validated tiered thresholds: Weak < 60%, Developing 60-80%, Mastered ≥ 80%
 *
 * Phase 3: Weak Areas Identification Service
 */

/**
 * Identify weak sections for targeted practice
 * Thresholds based on educational research: < 60% = weak, 60-80% = developing, ≥ 80% = mastered
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Object} options - Configuration options
 * @param {number} options.completionThreshold - Completion rate threshold (default: 0.60)
 * @param {number} options.scoreThreshold - Average score threshold (default: 0.60)
 * @param {boolean} options.includeZeroProgress - Include untouched sections (default: true)
 * @returns {Promise<Array>} Array of weak sections with metadata
 */
export async function identifyWeakSections(prisma, userId, courseId, options = {}) {
  const {
    completionThreshold = 0.60,  // 60% completion
    scoreThreshold = 0.60,        // 60% avg score
    includeZeroProgress = true,   // Include untouched sections
  } = options;

  // Fetch enrollment with section progress
  const enrollment = await prisma.enrollments.findUnique({
    where: {
      CreatorId_CourseId: { CreatorId: userId, CourseId: courseId }
    },
    include: {
      Courses: {
        include: {
          Sections: {
            orderBy: { Index: 'asc' }
          }
        }
      }
    }
  });

  if (!enrollment) {
    throw new Error('User not enrolled in course');
  }

  // Parse section milestones
  const sectionProgress = parseSectionMilestones(enrollment.SectionMilestones);

  const weakSections = [];

  for (const section of enrollment.Courses.Sections) {
    const progress = sectionProgress[section.Id] || 0;

    // Check completion rate
    if (progress < completionThreshold) {
      // Check assignment scores
      const avgScore = await getAvgAssignmentScore(prisma, userId, section.Id);

      if (avgScore === null && !includeZeroProgress) {
        continue; // Skip untouched sections if configured
      }

      if (avgScore === null || avgScore < scoreThreshold) {
        weakSections.push({
          sectionId: section.Id,
          sectionName: section.Title,
          sectionIndex: section.Index,
          completionRate: progress,
          avgScore: avgScore || 0,
          reason: progress < completionThreshold ? 'low_completion' : 'low_score',
          category: categorizeProficiency(progress, avgScore),
        });
      }
    }
  }

  return weakSections;
}

/**
 * Parse section milestones JSON from enrollment
 *
 * @param {string|Object} milestonesJson - Section milestones data
 * @returns {Object} Parsed section progress map (sectionId -> progress)
 */
function parseSectionMilestones(milestonesJson) {
  if (!milestonesJson) return {};

  try {
    const parsed = typeof milestonesJson === 'string'
      ? JSON.parse(milestonesJson)
      : milestonesJson;

    return parsed || {};
  } catch (error) {
    console.error('Failed to parse section milestones:', error);
    return {};
  }
}

/**
 * Get average assignment score for a section
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {string} sectionId - Section ID
 * @returns {Promise<number|null>} Average score (0-1) or null if no submissions
 */
async function getAvgAssignmentScore(prisma, userId, sectionId) {
  const result = await prisma.submissions.aggregate({
    where: {
      CreatorId: userId,
      Assignments: {
        SectionId: sectionId
      }
    },
    _avg: {
      Mark: true
    }
  });

  if (!result._avg.Mark) return null;

  // Convert to percentage (assuming Mark is 0-100)
  return result._avg.Mark / 100;
}

/**
 * Categorize user proficiency level
 *
 * @param {number} completionRate - Completion rate (0-1)
 * @param {number|null} avgScore - Average score (0-1) or null
 * @returns {string} Proficiency category
 */
function categorizeProficiency(completionRate, avgScore) {
  const score = avgScore || 0;
  const overallMetric = (completionRate + score) / 2;

  if (overallMetric < 0.60) return 'weak';
  if (overallMetric < 0.80) return 'developing';
  return 'mastered';
}

/**
 * Get detailed section performance analytics
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Array of all sections with performance metrics
 */
export async function getSectionPerformanceAnalytics(prisma, userId, courseId) {
  const enrollment = await prisma.enrollments.findUnique({
    where: {
      CreatorId_CourseId: { CreatorId: userId, CourseId: courseId }
    },
    include: {
      Courses: {
        include: {
          Sections: {
            orderBy: { Index: 'asc' }
          }
        }
      }
    }
  });

  if (!enrollment) {
    throw new Error('User not enrolled in course');
  }

  const sectionProgress = parseSectionMilestones(enrollment.SectionMilestones);

  const analytics = [];

  for (const section of enrollment.Courses.Sections) {
    const progress = sectionProgress[section.Id] || 0;
    const avgScore = await getAvgAssignmentScore(prisma, userId, section.Id);
    const submissionCount = await getSubmissionCount(prisma, userId, section.Id);

    analytics.push({
      sectionId: section.Id,
      sectionName: section.Title,
      sectionIndex: section.Index,
      completionRate: progress,
      avgScore: avgScore || 0,
      submissionCount,
      category: categorizeProficiency(progress, avgScore),
      needsAttention: progress < 0.60 || (avgScore !== null && avgScore < 0.60),
    });
  }

  return analytics;
}

/**
 * Get submission count for a section
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} userId - User ID
 * @param {string} sectionId - Section ID
 * @returns {Promise<number>} Number of submissions
 */
async function getSubmissionCount(prisma, userId, sectionId) {
  return await prisma.submissions.count({
    where: {
      CreatorId: userId,
      Assignments: {
        SectionId: sectionId
      }
    }
  });
}

/**
 * Prioritize weak sections by importance
 * Considers prerequisites and learning path
 *
 * @param {Array} weakSections - Array of weak sections
 * @param {Array} allSections - All course sections
 * @returns {Array} Prioritized weak sections
 */
export function prioritizeWeakSections(weakSections, allSections) {
  // Sort by section index (earlier sections are higher priority)
  // In a prerequisite-based system, fundamental topics should be addressed first
  return weakSections.sort((a, b) => a.sectionIndex - b.sectionIndex);
}

/**
 * Suggest learning focus areas
 *
 * @param {Array} weakSections - Array of weak sections
 * @param {number} maxFocusAreas - Maximum number of areas to suggest (default: 3)
 * @returns {Array} Suggested focus areas
 */
export function suggestFocusAreas(weakSections, maxFocusAreas = 3) {
  // Sort by combination of low score and low completion
  const sorted = [...weakSections].sort((a, b) => {
    const scoreA = (a.completionRate + a.avgScore) / 2;
    const scoreB = (b.completionRate + b.avgScore) / 2;
    return scoreA - scoreB; // Ascending - worst first
  });

  return sorted.slice(0, maxFocusAreas).map(section => ({
    sectionId: section.sectionId,
    sectionName: section.sectionName,
    priority: section.category === 'weak' ? 'high' : 'medium',
    recommendedQuestions: estimateRecommendedQuestions(section),
  }));
}

/**
 * Estimate recommended number of practice questions
 *
 * @param {Object} section - Section with performance metrics
 * @returns {number} Recommended number of questions
 */
function estimateRecommendedQuestions(section) {
  const overallMetric = (section.completionRate + section.avgScore) / 2;

  if (overallMetric < 0.40) return 20; // Very weak - intensive practice
  if (overallMetric < 0.60) return 15; // Weak - substantial practice
  return 10; // Developing - moderate practice
}
