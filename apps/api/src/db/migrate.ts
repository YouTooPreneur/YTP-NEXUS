import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// The database changes in apps/api/drizzle, applied in order as nexus_owner (TECH-DESIGN section 5.3).
// Each change runs once. Never edit a change that is already merged: the migrator skips a change by its
// time, never by its text, so an edited change is never applied again.
export const CHANGES_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

type Settings = Record<string, string | undefined>;

export async function runMigrations(
  settings: Settings = process.env,
): Promise<{ database: string; applied: number; total: number }> {
  const value = settings.DATABASE_URL_OWNER;
  if (!value) throw new Error('DATABASE_URL_OWNER is not set');
  if (!URL.canParse(value)) throw new Error('DATABASE_URL_OWNER is not a database address');
  const owner = new URL(value);
  if (owner.username !== 'nexus_owner') {
    throw new Error('DATABASE_URL_OWNER must sign in as nexus_owner');
  }
  const database = owner.pathname.slice(1);

  const client = new Client({
    host: owner.hostname,
    port: Number(owner.port) || 5432,
    user: owner.username,
    password: decodeURIComponent(owner.password),
    database,
  });
  await client.connect();
  try {
    // One run at a time: two runs at once would both try the same changes. The lock ends with the connection.
    await client.query("SELECT pg_advisory_lock(hashtext('nexus database changes'))");
    const done = async (): Promise<number> => {
      const found = await client.query(
        "SELECT count(*)::int AS n FROM pg_class WHERE oid = to_regclass('drizzle.__drizzle_migrations')",
      );
      if (found.rows[0].n === 0) return 0;
      return (await client.query('SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations'))
        .rows[0].n;
    };
    const before = await done();
    await migrate(drizzle(client), { migrationsFolder: CHANGES_FOLDER });
    const total = await done();
    return { database, applied: total - before, total };
  } finally {
    await client.end();
  }
}
