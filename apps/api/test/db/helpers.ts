// TASK-0015 · Helpers for the database tests: clients for each account, an empty company set and the two test companies. Written by the planner; builders never edit this file.
import { Client } from 'pg';

type Account = 'DATABASE_URL_OWNER' | 'DATABASE_URL_APP' | 'DATABASE_URL_BACKUP';

// A client for one account on nexus_test, from the settings the db group loads (infra/.env.test).
export function clientFor(account: Account): Client {
  const url = new URL(process.env[account]!);
  return new Client({
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  });
}

// Every test file that uses companies starts from an empty company set (TEST-PLAN section 4): the companies go,
// and with them every company row that refers to them.
export async function resetCompanies(owner: Client): Promise<void> {
  await owner.query('TRUNCATE core.companies CASCADE');
}

// "Test Company A" and "Test Company B" (TEST-PLAN section 4), made by nexus_owner as the first-start command does.
export async function makeTestCompanies(owner: Client): Promise<{ a: string; b: string }> {
  const made = await owner.query(
    `INSERT INTO core.companies (name, slug) VALUES ('Test Company A', 'test-company-a'), ('Test Company B', 'test-company-b')
     RETURNING id, slug`,
  );
  const id = (slug: string) => String(made.rows.find((row) => row.slug === slug)!.id);
  return { a: id('test-company-a'), b: id('test-company-b') };
}
