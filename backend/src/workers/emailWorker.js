import { emailQueue } from '../lib/queue.js';
import * as emailService from '../services/emailService.js';

console.log('✅ Email Worker initialized (In-memory)');

// Simple helper to mimic BullMQ worker behavior
const processJob = async (job) => {
  const email = job.data.email || '';
  const maskedEmail = email.replace(/(^.).+(@.+)/, '$1***$2');
  console.log(`Processing Email Job ${job.id} for user ${maskedEmail}`);
  
  if (job.name === 'sendPurchaseSuccess') {
    const { email, fullName, orderData } = job.data;
    await emailService.sendPurchaseSuccessEmail(email, fullName, orderData);
  } else {
    // In our manual trigger, we might pass jobName as the first arg to queue.add
    console.warn(`Unknown job type: ${job.name}`);
  }
};

// Register the handler with our memory queue
emailQueue._registerWorker(processJob);

// Mock worker object for compatibility if imported elsewhere
const emailWorker = {
  on: (event, callback) => {
    // Basic event mapping if needed
    if (event === 'completed' || event === 'failed' || event === 'error') {
       // We'll log these inside our MemoryQueue or processJob if needed
    }
  }
};

export default emailWorker;
