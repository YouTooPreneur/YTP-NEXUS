// pnpm --filter @ytp/api db:migrate: applies the database changes in apps/api/drizzle to this computer's
// database as nexus_owner (DATABASE_URL_OWNER in infra/.env). Prints counts only, never a password.
import '../src/load-settings.js';
import { runMigrations } from '../src/db/migrate.js';

try {
  const { database, applied, total } = await runMigrations();
  console.log(`database changes applied on ${database}: ${applied} new, ${total} in all`);
} catch (error) {
  // A refused connection to localhost fails on both ::1 and 127.0.0.1, and Node then reports one
  // AggregateError whose message is empty: say the reason in plain words instead.
  const code = error instanceof Error ? (error as NodeJS.ErrnoException).code : undefined;
  // A failed database change is a DrizzleQueryError: its message is the change's text, its cause says why.
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : '';
  const reason =
    code === 'ECONNREFUSED'
      ? 'the database is not running: run pnpm services:up'
      : error instanceof Error
        ? cause || error.message || (code ?? error.name)
        : typeof error;
  console.error(`db:migrate failed: ${reason}`);
  process.exitCode = 1;
}
