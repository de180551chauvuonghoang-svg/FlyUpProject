import 'dotenv/config'
import Redis from "ioredis"

async function testRedis() {
  console.log('Testing Redis Connection...');
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error('❌ REDIS_URL not found in .env');
    process.exit(1);
  }
  console.log('Redis URL check:', url.replace(/:[^:@]+@/, ':****@'));
  try {
    const client = new Redis(process.env.REDIS_URL, {
      tls: {},
      maxRetriesPerRequest: null
    });
    await client.set('test_key', 'Redis is working! 🚀');
    const value = await client.get('test_key');
    console.log('✅ Value from Redis:', value);
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis Test Failed:', error.message);
    process.exit(1);
  }
}

testRedis();
