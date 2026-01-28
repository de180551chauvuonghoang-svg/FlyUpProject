import redis from '../lib/redis.js';

/**
 * Generic Rate Limit Middleware using Redis
 * @param {string} prefix - Key prefix (e.g., 'limit:login')
 * @param {number} limit - Max requests allowed
 * @param {number} windowSeconds - Time window in seconds
 */
export const rateLimit = (prefix, limit, windowSeconds) => {
  return async (req, res, next) => {
    try {
      // Get IP: Handle proxy (X-Forwarded-For) or direct connection
      const forwarded = req.headers['x-forwarded-for'];
      const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
      const key = `${prefix}:${ip}`;

      // Increment counter
      const currentCount = await redis.incr(key);

      // If this is the first request, set expiry
      if (currentCount === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Check limit
      if (currentCount > limit) {
        // Get Time To Live to tell user when to retry
        const ttl = await redis.ttl(key);
        return res.status(429).json({
          success: false,
          error: `Too many requests. Please try again in ${ttl} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      next();
    } catch (error) {
      console.error('Rate Limit Error:', error);
      // Fail open: Allow request if Redis is down (to avoid blocking legit users)
      next(); 
    }
  };
};
