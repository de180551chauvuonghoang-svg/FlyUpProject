import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as emailService from '../services/emailService.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

connection.on('error', (err) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
     // Ignore connection resets and broken pipes
    return;
  }
  console.error('❌ Redis Worker Connection Error:', err.message);
});

const emailWorker = new Worker('email-queue', async (job) => {
  // Simple masking: j***@gmail.com
  const email = job.data.email || '';
  const maskedEmail = email.replace(/(^.).+(@.+)/, '$1***$2');
  console.log(`Processing Email Job ${job.id} for user ${maskedEmail}`);
  
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

emailWorker.on('error', (err) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    return;
  }
  console.error('❌ Email Worker Error:', err.message);
});

export default emailWorker;
