import cache from '../lib/cache.js';

/**
 * Generic Rate Limit Middleware using In-memory Store (Mocked through cache.js)
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

      // Increment counter (Using in-memory mock in cache.js)
      const currentCount = await cache.incr(key);

      // If this is the first request, set expiry
      if (currentCount === 1) {
        await cache.expire(key, windowSeconds);
      }

      // Check limit
      if (currentCount > limit) {
        // Get Time To Live (Mocked in cache.js)
        const ttl = await cache.ttl(key);
        return res.status(429).json({
          success: false,
          error: `Too many requests. Please try again in ${ttl} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      next();
    } catch (error) {
      console.error('Rate Limit Error:', error);
      // Fail open to avoid blocking legit users if mapping error occurs
      next(); 
    }
  };
};
