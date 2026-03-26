import redis from '../lib/cache.js';
import prisma from '../lib/prisma.js';

const COURSE_CACHE_KEY = 'chatbot:courses';
const CACHE_TTL = 3600; // 1 hour

/**
 * Course Cache Service
 * Implements cache-aside pattern for course data with Redis
 */

/**
 * Format courses into chatbot-friendly context string
 * @param {Array} courses - Array of course objects from database
 * @returns {string} Formatted course context string
 */
const formatCourseContext = (courses) => {
  return courses.map(c => {
    const rating = c.RatingCount > 0
      ? (Number(c.TotalRating) / c.RatingCount).toFixed(1)
      : "New";

    const priceFormatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(c.Price || 0);

    return `
    - COURSE ID: ${c.Id}
    - TITLE: "${c.Title}"
    - INSTRUCTOR: ${c.Instructors?.Users_Instructors_CreatorIdToUsers?.FullName || 'Unknown'}
    - CATEGORY: ${c.Categories?.Title || 'General'}
    - LEVEL: ${c.Level}
    - PRICE: ${priceFormatted} (Rating: ${rating} ⭐)
    - KEY OUTCOMES: ${c.Outcomes}
    - DESCRIPTION: ${c.Description}
    ----------------------------------`;
  }).join("\n");
};

/**
 * Fetch courses from database
 * @returns {Promise<string>} Formatted course context string
 */
const fetchCoursesFromDB = async () => {
  const startTime = Date.now();

  const courses = await prisma.courses.findMany({
    where: {
      Status: 'Ongoing',
      ApprovalStatus: 'APPROVED'
    },
    select: {
      Id: true,
      Title: true,
      Description: true,
      Price: true,
      Level: true,
      Outcomes: true,
      TotalRating: true,
      RatingCount: true,
      Instructors: {
        select: {
          Users_Instructors_CreatorIdToUsers: {
            select: {
              FullName: true
            }
          }
        }
      },
      Categories: {
        select: {
          Title: true
        }
      }
    }
  });

  const duration = Date.now() - startTime;
  console.log(`🗄️ Fetched ${courses.length} courses from DB in ${duration}ms`);

  return formatCourseContext(courses);
};

/**
 * Get course context with cache-aside pattern
 * @returns {Promise<string>} Formatted course context string
 */
export const getCourseContext = async () => {
  try {
    const startTime = Date.now();

    // Try cache first
    const cached = await redis.get(COURSE_CACHE_KEY);

    if (cached) {
      const duration = Date.now() - startTime;
      console.log(`✅ Cache HIT: Retrieved courses in ${duration}ms`);
      return cached;
    }

    // Cache miss - fetch from DB
    console.log(`📝 Cache MISS: Fetching from database...`);
    const courseContext = await fetchCoursesFromDB();

    // Store in cache with TTL
    await redis.setex(COURSE_CACHE_KEY, CACHE_TTL, courseContext);

    const duration = Date.now() - startTime;
    console.log(`💾 Cached course data (TTL: ${CACHE_TTL}s) - Total: ${duration}ms`);

    return courseContext;

  } catch (error) {
    console.error('❌ Course cache error:', error.message);

    // Fallback to DB on cache error
    console.log('⚠️ Falling back to direct DB query...');
    return await fetchCoursesFromDB();
  }
};

/**
 * Refresh cache manually (force update)
 * @returns {Promise<boolean>} Success status
 */
export const refreshCache = async () => {
  try {
    console.log('🔄 Force refreshing course cache...');

    const courseContext = await fetchCoursesFromDB();
    await redis.setex(COURSE_CACHE_KEY, CACHE_TTL, courseContext);

    console.log('✅ Cache refreshed successfully');
    return true;

  } catch (error) {
    console.error('❌ Cache refresh failed:', error.message);
    return false;
  }
};

/**
 * Invalidate cache (clear)
 * @returns {Promise<boolean>} Success status
 */
export const invalidateCache = async () => {
  try {
    await redis.del(COURSE_CACHE_KEY);
    console.log('🗑️ Course cache invalidated');
    return true;

  } catch (error) {
    console.error('❌ Cache invalidation failed:', error.message);
    return false;
  }
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
export const getCacheStats = async () => {
  try {
    const exists = await redis.exists(COURSE_CACHE_KEY);
    const ttl = exists ? await redis.ttl(COURSE_CACHE_KEY) : -1;

    return {
      cached: exists === 1,
      ttl: ttl,
      expiresIn: ttl > 0 ? `${Math.floor(ttl / 60)} minutes ${ttl % 60} seconds` : 'N/A'
    };

  } catch (error) {
    console.error('❌ Failed to get cache stats:', error.message);
    return { cached: false, ttl: -1, expiresIn: 'N/A' };
  }
};

