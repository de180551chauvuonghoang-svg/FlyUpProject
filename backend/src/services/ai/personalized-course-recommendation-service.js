import prisma from '../../lib/prisma.js';
import redis from '../../lib/redis.js';
import { generateCompletion } from '../../utils/ai-providers/groq-client.js';
import {
  buildUserContext,
  formatCourseCatalog,
  buildRecommendationPrompt
} from './ai-prompt-builder-utilities.js';
import crypto from 'crypto';

/**
 * Get personalized course recommendations for a user
 * @param {string} userId - User UUID
 * @param {number} limit - Number of recommendations (default: 5)
 * @returns {Promise<Object>} Recommendations with metadata
 */
export async function getPersonalizedRecommendations(userId, limit = 5) {
  try {
    console.log(`[Recommendations] Generating for user ${userId}`);

    // 1. Fetch user profile and enrollments
    const user = await prisma.users.findUnique({
      where: { Id: userId },
      include: {
        Enrollments: {
          include: {
            Courses: {
              include: {
                Categories: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Generate cache key based on user's enrollment state
    const enrolledCourseIds = user.Enrollments.map(e => e.CourseId).sort();
    const enrollmentHash = crypto
      .createHash('md5')
      .update(enrolledCourseIds.join(','))
      .digest('hex')
      .substring(0, 8);

    const cacheKey = `recommendations:${userId}:${enrollmentHash}`;

    // 3. Check Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Recommendations] Cache hit for ${userId}`);
      return {
        ...JSON.parse(cached),
        cached: true
      };
    }

    console.log(`[Recommendations] Cache miss, generating fresh recommendations`);

    // 4. Fetch available courses (exclude already enrolled)
    const enrolledIds = user.Enrollments.map(e => e.CourseId);
    const availableCourses = await prisma.courses.findMany({
      where: {
        Status: 'Ongoing',
        ApprovalStatus: 'APPROVED',
        Id: {
          notIn: enrolledIds
        }
      },
      include: {
        Categories: true,
        Instructors: {
          include: {
            Users_Instructors_CreatorIdToUsers: {
              select: { FullName: true }
            }
          }
        }
      },
      take: 50, // Limit context size for AI
      orderBy: [
        { RatingCount: 'desc' },
        { LearnerCount: 'desc' }
      ]
    });

    if (availableCourses.length === 0) {
      console.log(`[Recommendations] No available courses for ${userId}`);
      return {
        userId,
        recommendations: [],
        message: 'No courses available at this time',
        cached: false,
        generatedAt: new Date().toISOString()
      };
    }

    // 5. Try AI-powered recommendations
    let recommendations;
    try {
      recommendations = await generateAIRecommendations(
        user,
        user.Enrollments,
        availableCourses,
        limit
      );
    } catch (aiError) {
      console.warn(`[Recommendations] AI failed, using fallback:`, aiError.message);
      recommendations = generateFallbackRecommendations(
        user,
        user.Enrollments,
        availableCourses,
        limit
      );
    }

    // 6. Enrich recommendations with full course data
    const enrichedRecommendations = await enrichRecommendations(recommendations);

    // 7. Build response
    const response = {
      userId,
      recommendations: enrichedRecommendations,
      cached: false,
      generatedAt: new Date().toISOString()
    };

    // 8. Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(response));

    console.log(`[Recommendations] Generated ${enrichedRecommendations.length} recommendations for ${userId}`);

    return response;

  } catch (error) {
    console.error('[Recommendations] Error:', error);
    throw error;
  }
}

/**
 * Generate AI-powered recommendations using Groq
 * @private
 */
async function generateAIRecommendations(user, enrollments, courses, limit) {
  // Build context
  const userContext = buildUserContext(user, enrollments);
  const courseCatalog = formatCourseCatalog(courses);
  const prompt = buildRecommendationPrompt(userContext, courseCatalog, limit);

  // Call AI
  const response = await generateCompletion({
    messages: [
      {
        role: 'system',
        content: 'You are an expert educational advisor. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 1024,
    timeout: 8000
  });

  // Parse JSON response
  const recommendations = parseAIResponse(response, courses);

  if (!recommendations || recommendations.length === 0) {
    throw new Error('AI returned empty recommendations');
  }

  return recommendations;
}

/**
 * Parse AI JSON response with validation
 * @private
 */
function parseAIResponse(response, availableCourses) {
  try {
    // Extract JSON from response (sometimes AI adds extra text)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Validate each recommendation
    const validRecommendations = parsed
      .filter(rec => {
        // Must have required fields
        if (!rec.courseId || typeof rec.score !== 'number' || !rec.reasoning) {
          console.warn('[AI Parse] Invalid recommendation:', rec);
          return false;
        }

        // Course must exist in available courses
        const courseExists = availableCourses.some(c => c.Id === rec.courseId);
        if (!courseExists) {
          console.warn('[AI Parse] Course not found:', rec.courseId);
          return false;
        }

        return true;
      })
      .map(rec => ({
        courseId: rec.courseId,
        score: Math.min(1.0, Math.max(0.0, rec.score)), // Clamp to [0, 1]
        reasoning: rec.reasoning.substring(0, 200) // Limit length
      }));

    return validRecommendations;

  } catch (error) {
    console.error('[AI Parse] Error parsing response:', error.message);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

/**
 * Fallback: Rule-based recommendations (when AI fails)
 * @private
 */
function generateFallbackRecommendations(user, enrollments, courses, limit) {
  console.log('[Fallback] Generating rule-based recommendations');

  // Strategy: Popular courses in user's interested categories
  const enrolledCategories = [
    ...new Set(enrollments.map(e => e.Courses?.Categories?.Title).filter(Boolean))
  ];

  // If user has enrollments, prefer same categories
  let scoredCourses = courses.map(course => {
    let score = 0.5; // Base score

    // Boost if same category
    if (enrolledCategories.includes(course.Categories?.Title)) {
      score += 0.3;
    }

    // Boost by rating
    if (course.RatingCount > 0) {
      const avgRating = Number(course.TotalRating) / course.RatingCount;
      score += (avgRating / 5) * 0.2; // Max +0.2
    }

    // Boost by popularity
    score += Math.min(course.LearnerCount / 1000, 0.1); // Max +0.1

    return {
      courseId: course.Id,
      score: Math.min(1.0, score),
      reasoning: 'Recommended based on popularity and user preferences (AI unavailable)'
    };
  });

  // Sort by score descending
  scoredCourses.sort((a, b) => b.score - a.score);

  return scoredCourses.slice(0, limit);
}

/**
 * Enrich recommendations with full course details
 * @private
 */
async function enrichRecommendations(recommendations) {
  const courseIds = recommendations.map(r => r.courseId);

  const courses = await prisma.courses.findMany({
    where: {
      Id: { in: courseIds }
    },
    include: {
      Categories: true,
      Instructors: {
        include: {
          Users_Instructors_CreatorIdToUsers: {
            select: { FullName: true }
          }
        }
      }
    }
  });

  // Create course map for fast lookup
  const courseMap = new Map(courses.map(c => [c.Id, c]));

  // Enrich each recommendation
  return recommendations
    .map(rec => {
      const course = courseMap.get(rec.courseId);
      if (!course) return null;

      const rating = course.RatingCount > 0
        ? Number(course.TotalRating) / course.RatingCount
        : null;

      return {
        courseId: course.Id,
        title: course.Title,
        description: course.Description,
        price: Number(course.Price),
        level: course.Level,
        instructor: course.Instructors?.Users_Instructors_CreatorIdToUsers?.FullName || 'Unknown',
        category: course.Categories?.Title || 'General',
        rating: rating ? parseFloat(rating.toFixed(1)) : null,
        ratingCount: course.RatingCount,
        thumbnailUrl: course.ThumbUrl,
        learnerCount: course.LearnerCount,
        score: rec.score,
        reasoning: rec.reasoning
      };
    })
    .filter(Boolean); // Remove nulls
}

/**
 * Invalidate cache for a user (call after new enrollment)
 * @param {string} userId - User UUID
 */
export async function invalidateUserRecommendations(userId) {
  try {
    // Get all keys matching pattern
    const pattern = `recommendations:${userId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Recommendations] Invalidated ${keys.length} cache entries for ${userId}`);
    }
  } catch (error) {
    console.error('[Recommendations] Cache invalidation error:', error);
    // Non-critical, don't throw
  }
}
