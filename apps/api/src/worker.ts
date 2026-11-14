import './load-settings.js';
import { closePools } from './db/database.js';
import { startDelivery } from './modules/core/events/delivery.js';
import { createLogger } from './shared/logging.js';

// The worker (TECH-DESIGN section 2): it delivers the waiting announcements every 5 seconds (TASK-0094); the job queue
// comes with TASK-0021. Release 1 has no listener yet, so each announcement is marked delivered at once.
const logger = createLogger();
const delivery = startDelivery({ listeners: [], logger, everyMs: 5_000 });

console.log('worker started');

// On SIGTERM or SIGINT the round that is running ends first, then the pools close.
async function stop(): Promise<void> {
  await delivery.stop();
  await closePools();
  process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
