/**
 * Quiz Cache Helpers
 *
 * Redis caching utilities for quiz generation
 * Implements 30-60min TTL with smart invalidation
 *
 * Phase 6: Redis Caching Integration
 */

import crypto from 'crypto';
import redisClient from '../lib/redis.js';

const CACHE_TTL = 1800; // 30 minutes (can adjust to 3600 for 60 min)
const CACHE_PREFIX = 'quiz:';

/**
 * Scan Redis keys with pattern using SCAN command (non-blocking)
 * Replaces KEYS command for production safety
 *
 * @param {string} pattern - Redis key pattern
 * @returns {Promise<Array<string>>} Array of matching keys
 */
async function scanKeys(pattern) {
  const keys = [];
  let cursor = '0';

  do {
    const [newCursor, batch] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = newCursor;
    keys.push(...batch);
  } while (cursor !== '0');

  return keys;
}

/**
 * Generate cache key for quiz request
 *
 * Cache key format: quiz:{userId}:{courseId}:{scopeType}:{scopeHash}:{questionCount}
 *
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Object} scope - Quiz scope configuration
 * @param {number} questionCount - Number of questions
 * @returns {string} Cache key
 */
export function generateCacheKey(userId, courseId, scope, questionCount) {
  // Create hash of scope object to handle complex scope configurations
  const scopeHash = crypto
    .createHash('md5')
    .update(JSON.stringify(scope))
    .digest('hex')
    .substring(0, 8);

  return `${CACHE_PREFIX}${userId}:${courseId}:${scope.type}:${scopeHash}:${questionCount}`;
}

/**
 * Get cached quiz
 *
 * @param {string} cacheKey - Cache key
 * @returns {Promise<Object|null>} Cached quiz or null if not found
 */
export async function getCachedQuiz(cacheKey) {
  try {
    const cached = await redisClient.get(cacheKey);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.error('[Quiz Cache] Get error:', error);
    return null; // Fail gracefully
  }
}

/**
 * Set cached quiz
 *
 * @param {string} cacheKey - Cache key
 * @param {Object} quiz - Quiz data to cache
 * @param {number} ttl - Time to live in seconds (default: CACHE_TTL)
 * @returns {Promise<void>}
 */
export async function setCachedQuiz(cacheKey, quiz, ttl = CACHE_TTL) {
  try {
    await redisClient.setex(cacheKey, ttl, JSON.stringify(quiz));
    console.log(`[Quiz Cache] Cached: ${cacheKey} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('[Quiz Cache] Set error:', error);
    // Fail gracefully - don't throw, just log
  }
}

/**
 * Invalidate user's quiz cache
 * Call this when user's ability (Theta) changes or after quiz completion
 *
 * Uses SCAN instead of KEYS for non-blocking operation
 *
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<number>} Number of keys invalidated
 */
export async function invalidateUserQuizCache(userId, courseId) {
  try {
    const pattern = `${CACHE_PREFIX}${userId}:${courseId}:*`;
    const keys = await scanKeys(pattern);

    if (keys.length > 0) {
      // Delete in batches to avoid blocking
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await redisClient.del(...batch);
      }
      console.log(`[Quiz Cache] Invalidated ${keys.length} entries for user ${userId}, course ${courseId}`);
      return keys.length;
    }

    return 0;
  } catch (error) {
    console.error('[Quiz Cache] Invalidation error:', error);
    return 0;
  }
}

/**
 * Invalidate all quiz cache entries for a course
 * Use when course content changes (new questions added, etc.)
 *
 * Uses SCAN instead of KEYS for non-blocking operation
 *
 * @param {string} courseId - Course ID
 * @returns {Promise<number>} Number of keys invalidated
 */
export async function invalidateCourseQuizCache(courseId) {
  try {
    const pattern = `${CACHE_PREFIX}*:${courseId}:*`;
    const keys = await scanKeys(pattern);

    if (keys.length > 0) {
      // Delete in batches
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await redisClient.del(...batch);
      }
      console.log(`[Quiz Cache] Invalidated ${keys.length} entries for course ${courseId}`);
      return keys.length;
    }

    return 0;
  } catch (error) {
    console.error('[Quiz Cache] Course invalidation error:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 * Useful for monitoring cache effectiveness
 *
 * Uses SCAN instead of KEYS for non-blocking operation
 *
 * @param {string} userId - User ID (optional)
 * @param {string} courseId - Course ID (optional)
 * @returns {Promise<Object>} Cache statistics
 */
export async function getCacheStats(userId = null, courseId = null) {
  try {
    let pattern = `${CACHE_PREFIX}*`;
    if (userId && courseId) {
      pattern = `${CACHE_PREFIX}${userId}:${courseId}:*`;
    } else if (courseId) {
      pattern = `${CACHE_PREFIX}*:${courseId}:*`;
    } else if (userId) {
      pattern = `${CACHE_PREFIX}${userId}:*`;
    }

    const keys = await scanKeys(pattern);

    // Get TTL for each key (in batches to avoid overwhelming)
    const ttls = [];
    const sampleSize = Math.min(keys.length, 100); // Sample max 100 keys for stats
    for (let i = 0; i < sampleSize; i++) {
      const ttl = await redisClient.ttl(keys[i]);
      ttls.push(ttl);
    }

    return {
      totalCachedQuizzes: keys.length,
      averageTTL: ttls.length > 0 ? ttls.reduce((a, b) => a + b, 0) / ttls.length : 0,
      pattern,
      sampled: sampleSize < keys.length,
    };
  } catch (error) {
    console.error('[Quiz Cache] Stats error:', error);
    return {
      totalCachedQuizzes: 0,
      averageTTL: 0,
      error: error.message,
    };
  }
}

/**
 * Clear all quiz cache entries
 * Use with caution - for admin/maintenance purposes only
 *
 * Uses SCAN instead of KEYS for non-blocking operation
 *
 * @returns {Promise<number>} Number of keys deleted
 */
export async function clearAllQuizCache() {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    const keys = await scanKeys(pattern);

    if (keys.length > 0) {
      // Delete in batches
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await redisClient.del(...batch);
      }
      console.log(`[Quiz Cache] Cleared all cache (${keys.length} entries)`);
      return keys.length;
    }

    return 0;
  } catch (error) {
    console.error('[Quiz Cache] Clear error:', error);
    return 0;
  }
}

/**
 * Warm cache for a user
 * Pre-generate and cache quiz for common scenarios
 *
 * @param {Object} prisma - Prisma client
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Function} generateQuizFn - Quiz generation function
 * @returns {Promise<void>}
 */
export async function warmCache(prisma, userId, courseId, generateQuizFn) {
  try {
    // Common scenarios to pre-cache
    const scenarios = [
      { scope: { type: 'entire_course' }, questionCount: 10 },
      { scope: { type: 'entire_course' }, questionCount: 20 },
      { scope: { type: 'weak_areas', weakAreaThreshold: 0.6 }, questionCount: 10 },
    ];

    for (const scenario of scenarios) {
      const cacheKey = generateCacheKey(userId, courseId, scenario.scope, scenario.questionCount);

      // Check if already cached
      const existing = await getCachedQuiz(cacheKey);
      if (existing) {
        console.log(`[Quiz Cache] Already warm: ${cacheKey}`);
        continue;
      }

      // Generate and cache
      try {
        const quiz = await generateQuizFn(prisma, {
          userId,
          courseId,
          ...scenario,
        });

        await setCachedQuiz(cacheKey, quiz);
        console.log(`[Quiz Cache] Warmed: ${cacheKey}`);
      } catch (error) {
        console.warn(`[Quiz Cache] Warm failed for ${cacheKey}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Quiz Cache] Warm cache error:', error);
  }
}

/**
 * Check if Redis is healthy
 *
 * @returns {Promise<boolean>} True if Redis is responsive
 */
export async function checkCacheHealth() {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('[Quiz Cache] Health check failed:', error);
    return false;
  }
}
