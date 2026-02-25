import redis from '../src/lib/redis.js';

async function testRedis() {
  console.log('Testing Redis Connection...');
  try {
    await redis.set('test_key', 'Redis is working! 🚀');
    const value = await redis.get('test_key');
    console.log('✅ Value from Redis:', value);
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis Test Failed:', error.message);
    process.exit(1);
  }
}

testRedis();
