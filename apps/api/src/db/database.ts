import { Pool, type PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getContext, runWithContext, type RequestContext } from '../shared/context.js';
import { withCompany, type Transaction } from './company.js';

// The app's two connection pools, both signed in as nexus_app (TECH-DESIGN section 2, steps 5 to 8). The request
// pool holds each request's transaction; the small security pool holds the short security writes, which commit
// whatever happens to the request. A request never waits for a second connection from its own pool, so the API
// cannot lock itself when many requests arrive at once (CR-012). Nothing here reads a setting or opens a
// connection until first use.

type Settings = Record<string, string | undefined>;

// An optional pool size (TECH-DESIGN 6.6): a whole number above 0, or the default.
export function poolSize(value: string | undefined, fallback: number): number {
  const size = Number(value);
  return Number.isInteger(size) && size > 0 ? size : fallback;
}

// Both pools wait at most 10 seconds for a free connection, so a full pool answers 500 instead of hanging; the
// security pool's connections wait at most 5 seconds for a lock.
export function poolSettings(settings: Settings = process.env): {
  request: PoolConfig;
  security: PoolConfig;
} {
  const value = settings.DATABASE_URL_APP;
  if (!value) throw new Error('DATABASE_URL_APP is not set');
  if (!URL.canParse(value)) throw new Error('DATABASE_URL_APP is not a database address');
  const app = new URL(value);
  if (app.username !== 'nexus_app') throw new Error('DATABASE_URL_APP must sign in as nexus_app');
  const address: PoolConfig = {
    host: app.hostname,
    port: Number(app.port) || 5432,
    user: app.username,
    password: decodeURIComponent(app.password),
    database: app.pathname.slice(1),
    connectionTimeoutMillis: 10_000,
  };
  return {
    request: { ...address, max: poolSize(settings.DB_POOL_SIZE, 10) },
    security: { ...address, max: poolSize(settings.DB_SECURITY_POOL_SIZE, 3), lock_timeout: 5_000 },
  };
}

interface Pools {
  request: Pool;
  security: Pool;
}

let pools: Pools | undefined;

// A connection that breaks is dropped from its pool and replaced on next use. Without these listeners the error
// would stop the API: the pool's listener covers a connection while it waits in the pool, and each connection's
// own listener covers it while a request or a security write holds it (its query then fails, so only that
// request answers 500).
function makePool(config: PoolConfig): Pool {
  const pool = new Pool(config);
  pool.on('error', () => {});
  pool.on('connect', (client) => client.on('error', () => {}));
  return pool;
}

function getPools(): Pools {
  if (!pools) {
    const settings = poolSettings();
    pools = { request: makePool(settings.request), security: makePool(settings.security) };
  }
  return pools;
}

// Runs work in one transaction with the company set, on a connection taken here and always given back, even when
// its BEGIN fails: Drizzle's own transaction on a pool would keep such a connection, and the pool would shrink for
// good. A broken connection is dropped when it is given back.
export async function onConnection<T>(
  pool: Pick<Pool, 'connect'>,
  companyId: string,
  work: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    return await withCompany(drizzle(client), companyId, work);
  } finally {
    client.release();
  }
}

// Step 5: runs the rest of a request in one transaction on the request pool, with the request's company set
// (TECH-DESIGN 5.1). The transaction is on the request context while it runs, and the repositories read it there.
export async function inRequestTransaction<T>(run: () => Promise<T>): Promise<T> {
  const context = getContext();
  if (!context.companyId) throw new Error('the request transaction needs the company');
  return onConnection(getPools().request, context.companyId, async (tx) => {
    context.tx = tx;
    try {
      return await run();
    } finally {
      delete context.tx;
    }
  });
}

// The request context, or none outside a request (a job, a test).
function currentContext(): RequestContext | undefined {
  try {
    return getContext();
  } catch {
    return undefined;
  }
}

// A short security write (TECH-DESIGN section 2): its own transaction on the security pool, with the company set,
// committed whatever happens to the request. While it runs, the request context holds this transaction instead of
// the request's, so code that reads the transaction there writes into the security write; the request's comes back
// afterwards. Await nothing inside it that needs the request pool.
export async function securityWrite<T>(
  companyId: string,
  work: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const context = currentContext();
  return onConnection(getPools().security, companyId, (tx) =>
    context ? runWithContext({ ...context, companyId, tx }, () => work(tx)) : work(tx),
  );
}

// A short security write with no company (TASK-0018): for an entry in the security log's system chain, such as a failed
// sign-in for an email nobody has. Its own transaction on the security pool, with no company set, committed whatever
// happens to the request; the connection is always given back.
export async function securityWriteWithoutCompany<T>(
  work: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const context = currentContext();
  const client = await getPools().security.connect();
  try {
    return await drizzle(client).transaction(async (tx) =>
      context ? runWithContext({ ...context, companyId: undefined, tx }, () => work(tx)) : work(tx),
    );
  } finally {
    client.release();
  }
}

// Ends both pools (in the tests now, and when the API stops once a later card wires that up); the next use makes
// them again from the settings.
export async function closePools(): Promise<void> {
  const open = pools;
  pools = undefined;
  if (open) await Promise.all([open.request.end(), open.security.end()]);
}
