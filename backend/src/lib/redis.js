import Redis from 'ioredis';

// Use environment variable or default to localhost
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  // Retry strategy: retry connection if it fails
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3 // Fail fast if Redis is down
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully at', redisUrl);
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
  // Optional: Don't crash the app if Redis is down, just log
});

export default redis;
