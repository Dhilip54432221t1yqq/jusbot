import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import './../config/env.js'; // Ensure env is loaded
import { processWhatsAppWebhook } from '../routes/whatsappCloud.js';

// Upstash requires TLS for redis connection (rediss://)
// The user will need to provide REDIS_URL in .env
const connection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: process.env.REDIS_URL.startsWith('rediss') ? {} : undefined,
    })
  : null;

let webhookQueue;

if (connection) {
  webhookQueue = new Queue('webhook-queue', { connection });
  console.log('✅ BullMQ Redis Queue Initialized');
  
  // Background Worker to process incoming webhooks safely
  const worker = new Worker('webhook-queue', async job => {
    const { platform, payload } = job.data;
    console.log(`[Queue] Processing ${platform} webhook...`);
    
    if (platform === 'whatsapp_cloud') {
      const { body, workspaceId } = payload;
      await processWhatsAppWebhook(body, workspaceId);
    }
    
    return { success: true };
  }, { connection });

  worker.on('completed', job => {
    // console.log(`Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} has failed with ${err.message}`);
  });
} else {
  console.warn('⚠️ REDIS_URL not found. Webhook Queue will not run.');
}

export const enqueueWebhook = async (platform, payload) => {
  if (webhookQueue) {
    await webhookQueue.add(`${platform}-job`, { platform, payload }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  } else {
    // Fallback if Redis is not configured (process synchronously)
    console.warn('⚠️ Processing webhook synchronously (Redis not configured)');
    // Synchronous execution happens inside the route if this fails
  }
};
