import { PgBoss } from 'pg-boss';
import type { pino } from 'pino';
import { inCompanyTransaction } from '../db/database.js';
import { recordError } from '../modules/core/repository/error-events.js';
import { getContext, runWithContext, type RequestContext } from '../shared/context.js';
import { safeErrorMessage } from '../shared/logging.js';

// Connection pool size for pg-boss (TASK-0021, NFR-003, TECH-DESIGN section 2, 5.1).
export const JOB_POOL_SIZE = 2;

export interface JobDefinition<T = unknown> {
  name: string;
  retries: number;
  handle(data: T): Promise<void> | void;
}

export function defineJob<T>(definition: JobDefinition<T>): JobDefinition<T> {
  return definition;
}

let bossInstance: PgBoss | undefined;
let startPromise: Promise<PgBoss> | undefined;

function getOrCreateBoss(): PgBoss {
  if (!bossInstance) {
    bossInstance = new PgBoss({
      connectionString: process.env.DATABASE_URL_APP,
      schema: 'pgboss',
      max: JOB_POOL_SIZE,
      migrate: false,
    });
  }
  return bossInstance;
}

async function getBoss(): Promise<PgBoss> {
  const instance = getOrCreateBoss();
  if (!startPromise) {
    startPromise = instance.start();
  }
  await startPromise;
  return instance;
}

export async function sendJob<T>(definition: JobDefinition<T>, data: T): Promise<string> {
  let context: RequestContext | undefined;
  try {
    context = getContext();
  } catch {
    // outside context
  }
  if (!context?.companyId) {
    throw new Error('a job needs the company');
  }

  const boss = await getBoss();
  const id = await boss.send(
    definition.name,
    { companyId: context.companyId, data },
    { retryLimit: definition.retries },
  );
  if (!id) {
    throw new Error('failed to send job');
  }
  return id;
}

export function startJobs(options: { jobs: JobDefinition<unknown>[]; logger: pino.Logger }): {
  stop(): Promise<void>;
} {
  const { jobs, logger } = options;
  const init = (async () => {
    const boss = await getBoss();
    for (const def of jobs) {
      await boss.work(def.name, { pollingIntervalSeconds: 0.5 }, async (batch) => {
        const items = Array.isArray(batch) ? batch : [batch];
        for (const item of items) {
          const { companyId, data } = item.data as { companyId: string; data: unknown };
          const jobId = item.id;
          const context: RequestContext = {
            requestId: jobId,
            background: true,
            companyId,
          };
          try {
            await runWithContext(context, () =>
              inCompanyTransaction(companyId, async () => {
                await def.handle(data);
              }),
            );
          } catch (error) {
            logger.error({ err: error, jobId }, 'job failed');
            try {
              await runWithContext(context, () => recordError(error, 'worker'));
            } catch (failure) {
              logger.warn({ err: failure, jobId }, 'error not recorded');
            }
            // eslint-disable-next-line preserve-caught-error
            throw new Error(safeErrorMessage(error));
          }
        }
      });
    }
  })();

  return {
    async stop() {
      await init;
      if (bossInstance) {
        const instance = bossInstance;
        bossInstance = undefined;
        startPromise = undefined;
        await instance.stop();
      }
    },
  };
}
