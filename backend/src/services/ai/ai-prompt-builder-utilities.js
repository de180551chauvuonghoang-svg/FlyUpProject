/**
 * Build user profile context for AI prompts
 * @param {Object} user - User object from Prisma
 * @param {Array} enrollments - User enrollments with courses
 * @returns {string} Formatted user context
 */
export function buildUserContext(user, enrollments) {
  const enrolledCourses = enrollments.map(e => ({
    title: e.Courses?.Title || 'Unknown',
    category: e.Courses?.Categories?.Title || 'General',
    level: e.Courses?.Level || 'Beginner'
  }));

  const categories = [...new Set(enrolledCourses.map(c => c.category))];
  const levels = [...new Set(enrolledCourses.map(c => c.level))];

  return `
User Profile:
- Name: ${user.FullName}
- Enrolled Courses: ${enrolledCourses.length}
- Learning Topics: ${categories.join(', ') || 'None yet'}
- Skill Levels: ${levels.join(', ') || 'Beginner'}
- Recent Courses: ${enrolledCourses.slice(-3).map(c => c.title).join(', ') || 'None'}
`.trim();
}

/**
 * Format course catalog for AI context
 * @param {Array} courses - Array of course objects
 * @returns {string} Formatted course catalog
 */
export function formatCourseCatalog(courses) {
  if (!courses || courses.length === 0) {
    return 'No courses available';
  }

  return courses.map((course, idx) => {
    const rating = course.RatingCount > 0
      ? (Number(course.TotalRating) / course.RatingCount).toFixed(1)
      : 'New';

    const price = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(course.Price || 0);

    return `
${idx + 1}. "${course.Title}"
   - ID: ${course.Id}
   - Category: ${course.Categories?.Title || 'General'}
   - Level: ${course.Level}
   - Price: ${price}
   - Rating: ${rating} ⭐ (${course.RatingCount} reviews)
   - Instructor: ${course.Instructors?.Users_Instructors_CreatorIdToUsers?.FullName || 'Unknown'}
   - Learners: ${course.LearnerCount || 0}
   - Description: ${(course.Description || '').substring(0, 100)}...
`.trim();
  }).join('\n\n');
}

/**
 * Build recommendation prompt for AI
 * @param {string} userContext - User profile context
 * @param {string} courseCatalog - Available courses
 * @param {number} limit - Number of recommendations
 * @returns {string} Complete AI prompt
 */
export function buildRecommendationPrompt(userContext, courseCatalog, limit = 5) {
  return `
You are an expert educational advisor for FlyUp EduTech platform.

${userContext}

Available Courses:
${courseCatalog}

Task: Recommend exactly ${limit} courses for this user.

Criteria:
1. Match user's skill progression (slightly above their current level)
2. Align with their learning topics and interests
3. Fill knowledge gaps in their learning path
4. Consider course quality (ratings, learner count)
5. Diversify recommendations (don't recommend only one category)

Output Format (JSON array):
[
  {
    "courseId": "uuid-here",
    "score": 0.95,
    "reasoning": "One sentence explaining why this fits the user"
  },
  ...
]

Important:
- Return ONLY the JSON array, no additional text
- Ensure all courseIds exist in the available courses list
- Score range: 0.0 to 1.0 (higher = better match)
- Order by score descending (best first)
`.trim();
}
