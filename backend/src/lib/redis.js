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
  console.error('❌ Redis connection error:', err.message);
  // Optional: Don't crash the app if Redis is down, just log
});

export default redis;
