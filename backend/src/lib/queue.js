import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Reuse connection config, but BullMQ needs separate connection instances
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null // Required by BullMQ
});

export const emailQueue = new Queue('email-queue', { connection });

console.log('✅ Email Queue initialized');
