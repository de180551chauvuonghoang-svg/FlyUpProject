import Redis from 'ioredis';

// Use environment variable or default to localhost
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  // Retry strategy: retry connection if it fails
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null // Request will stay in the queue until Redis is ready
});

redis.on('connect', () => {
  try {
    const url = new URL(redisUrl);
    if (url.password) url.password = '****';
    if (url.username) url.username = '****'; // Redact username if present
    console.log('✅ Redis connected successfully at', url.toString());
  } catch (error) {
    // Fallback if URL parsing fails (e.g. malformed URL)
    console.log('✅ Redis connected successfully at (redacted)');
  }
});

redis.on('error', (err) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    // Ignore connection resets and broken pipes, as ioredis handles reconnection automatically
    return;
  }
  console.error('❌ Redis connection error:', err.message);
  // Optional: Don't crash the app if Redis is down, just log
});

// Helper to prevent app from hanging if Redis is down/slow
export const safeGet = async (key) => {
  try {
    // Timeout after 500ms
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis timeout')), 500)
    );
    
    // Race Redis against timeout
    const result = await Promise.race([redis.get(key), timeout]);
    return result;
  } catch (error) {
    // Silently fail and return null so app uses DB
    return null;
  }
};

export const safeSet = async (key, value, mode, duration) => {
  try {
    // Fire and forget - don't await, or just catch error
    // We await with timeout to ensure we don't block response too long
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis timeout')), 500)
    );
    
    await Promise.race([redis.set(key, value, mode, duration), timeout]);
  } catch (error) {
    // Ignore cache set failures
  }
};

export default redis;
