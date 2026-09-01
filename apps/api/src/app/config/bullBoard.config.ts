// import { createBullBoard } from '@bull-board/api';
// import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
// import { ExpressAdapter } from '@bull-board/express';
// import { paymentWorker } from '../jobs/paymentRetry.job';
// import { turnSchedulerWorker } from '../jobs/turnScheduler.worker';
// import { schedulerWorker } from '../jobs/scheduler.worker';

/**
 * Bull Board Architecture Preparation
 * 
 * Instructions for enabling:
 * 1. Install dependencies: `npm install @bull-board/api @bull-board/express`
 * 2. Uncomment the code below.
 * 3. Mount `serverAdapter.getRouter()` in your Express app (e.g., `app.use('/admin/queues', serverAdapter.getRouter())`).
 * 4. IMPORTANT: Ensure the route is protected by Admin authentication middleware.
 */

/*
export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

export const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    // We would need to export the Queue instances, not just the Workers, 
    // or we can pass the queue names if we have the Redis connection.
    // Example: new BullMQAdapter(paymentQueue)
  ],
  serverAdapter: serverAdapter,
});
*/
