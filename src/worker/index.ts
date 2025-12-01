/**
 * Background Worker Entry Point
 * 
 * Runs background jobs for:
 * - Polling cricket APIs for live match updates
 * - Detecting match events and sending notifications
 * - Syncing data to the database
 * 
 * REQUIRES REDIS - Run with: npm run worker
 */

import 'dotenv/config';
import { Worker, Queue, type Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@/lib/prisma';
import { pollLiveMatches, pollUpcomingMatches } from './jobs/match-poller';
import { processNotifications } from './jobs/notification-sender';
import { syncTeamsAndCompetitions } from './jobs/data-sync';

// Check for Redis URL
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error(`
╔════════════════════════════════════════════════════════════════╗
║  ❌ REDIS_URL not configured                                    ║
║                                                                 ║
║  The background worker requires Redis for job queues.          ║
║                                                                 ║
║  Options:                                                       ║
║  1. Set up Upstash (free): https://upstash.com                 ║
║  2. Install Redis locally: brew install redis                   ║
║  3. Skip the worker - the web app will still work              ║
║                                                                 ║
║  Add to your .env file:                                         ║
║  REDIS_URL="redis://localhost:6379" (local)                     ║
║  REDIS_URL="rediss://..." (Upstash)                             ║
╚════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

// Create Redis connection for BullMQ
let redis: Redis;
try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });
} catch (error) {
  console.error('❌ Failed to connect to Redis:', error);
  process.exit(1);
}

// Job types
export type JobType = 
  | 'poll-live-matches'
  | 'poll-upcoming-matches'
  | 'process-notifications'
  | 'sync-data';

// Queue for cricket-related jobs
export const cricketQueue = new Queue<{ type: JobType }>('cricket', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

// Worker to process jobs
const worker = new Worker<{ type: JobType }>(
  'cricket',
  async (job: Job<{ type: JobType }>) => {
    console.log(`[Worker] Processing job: ${job.data.type} (${job.id})`);
    
    const startTime = Date.now();
    
    try {
      switch (job.data.type) {
        case 'poll-live-matches':
          await pollLiveMatches();
          break;
        case 'poll-upcoming-matches':
          await pollUpcomingMatches();
          break;
        case 'process-notifications':
          await processNotifications();
          break;
        case 'sync-data':
          await syncTeamsAndCompetitions();
          break;
        default:
          console.warn(`[Worker] Unknown job type: ${job.data.type}`);
      }
      
      const duration = Date.now() - startTime;
      console.log(`[Worker] Completed job: ${job.data.type} in ${duration}ms`);
    } catch (error) {
      console.error(`[Worker] Job failed: ${job.data.type}`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

// Set up recurring jobs
async function setupRecurringJobs() {
  // Clear existing repeatable jobs
  const repeatableJobs = await cricketQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await cricketQueue.removeRepeatableByKey(job.key);
  }

  // Poll live matches every 30 seconds
  await cricketQueue.add(
    'poll-live',
    { type: 'poll-live-matches' },
    {
      repeat: {
        every: 30_000, // 30 seconds
      },
    }
  );

  // Poll upcoming matches every 5 minutes
  await cricketQueue.add(
    'poll-upcoming',
    { type: 'poll-upcoming-matches' },
    {
      repeat: {
        every: 5 * 60_000, // 5 minutes
      },
    }
  );

  // Process notification queue every 10 seconds
  await cricketQueue.add(
    'send-notifications',
    { type: 'process-notifications' },
    {
      repeat: {
        every: 10_000, // 10 seconds
      },
    }
  );

  // Sync teams/competitions daily
  await cricketQueue.add(
    'sync-data',
    { type: 'sync-data' },
    {
      repeat: {
        pattern: '0 0 * * *', // Every day at midnight
      },
    }
  );

  console.log('[Worker] ✅ Recurring jobs scheduled');
}

// Handle worker events
worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

// Graceful shutdown
async function shutdown() {
  console.log('[Worker] Shutting down...');
  await worker.close();
  await cricketQueue.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the worker
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🏏 CricApp Background Worker                                   ║
╚════════════════════════════════════════════════════════════════╝
`);
  console.log('[Worker] Connecting to Redis...');
  
  // Test Redis connection
  try {
    await redis.ping();
    console.log('[Worker] ✅ Redis connected');
  } catch (error) {
    console.error('[Worker] ❌ Redis connection failed:', error);
    process.exit(1);
  }

  await setupRecurringJobs();
  
  // Run initial sync
  console.log('[Worker] Running initial data sync...');
  await syncTeamsAndCompetitions();
  
  console.log('[Worker] ✅ Worker is running');
  console.log('[Worker] Press Ctrl+C to stop\n');
}

main().catch((error) => {
  console.error('[Worker] Failed to start:', error);
  process.exit(1);
});
