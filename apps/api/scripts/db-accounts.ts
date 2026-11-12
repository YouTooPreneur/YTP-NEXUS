// pnpm --filter @ytp/api db:accounts: makes or puts right the database accounts of this computer's
// database (the DATABASE_URL_* settings in infra/.env). Prints role names only, never a password.
import '../src/load-settings.js';
import { ensureAccounts } from '../src/db/accounts.js';

try {
  const { database, roles } = await ensureAccounts();
  console.log(`database accounts ready on ${database}: ${roles.join(', ')}`);
} catch (error) {
  // A refused connection to localhost fails on both ::1 and 127.0.0.1, and Node then reports one
  // AggregateError whose message is empty: say the reason in plain words instead.
  const code = error instanceof Error ? (error as NodeJS.ErrnoException).code : undefined;
  const reason =
    code === 'ECONNREFUSED'
      ? 'the database is not running: run pnpm services:up'
      : error instanceof Error
        ? error.message || (code ?? error.name)
        : typeof error;
  console.error(`db:accounts failed: ${reason}`);
  process.exitCode = 1;
}
