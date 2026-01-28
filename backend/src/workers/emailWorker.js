import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as emailService from '../services/emailService.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

const emailWorker = new Worker('email-queue', async (job) => {
  console.log(`Processing Email Job ${job.id} for user ${job.data.email}`);
  
  if (job.name === 'sendPurchaseSuccess') {
    const { email, fullName, orderData } = job.data;
    await emailService.sendPurchaseSuccessEmail(email, fullName, orderData);
  } else {
    console.warn(`Unknown job type: ${job.name}`);
  }

}, { connection });

emailWorker.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Email job ${job.id} failed: ${err.message}`);
});

export default emailWorker;
