import './load-settings.js';
import { closePools } from './db/database.js';
import { startJobs } from './jobs/jobs.js';
import { startDelivery } from './modules/core/events/delivery.js';
import { createLogger } from './shared/logging.js';

// The worker (TECH-DESIGN section 2): it delivers the waiting announcements every 5 seconds (TASK-0094); the job queue
// runs background work (TASK-0021). Release 1 has no listener or jobs yet.
const logger = createLogger();
const delivery = startDelivery({ listeners: [], logger, everyMs: 5_000 });
const jobs = startJobs({ jobs: [], logger });

console.log('worker started');

// On SIGTERM or SIGINT the jobs and delivery stop first, then the pools close.
async function stop(): Promise<void> {
  await jobs.stop();
  await delivery.stop();
  await closePools();
  process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
