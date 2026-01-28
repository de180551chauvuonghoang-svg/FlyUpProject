import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Reuse connection config, but BullMQ needs separate connection instances
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null // Required by BullMQ
});

connection.on('error', (err) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
     // Ignore connection resets and broken pipes
    return;
  }
  console.error('❌ Redis Queue Connection Error:', err.message);
});

export const emailQueue = new Queue('email-queue', { connection });

console.log('✅ Email Queue initialized');
