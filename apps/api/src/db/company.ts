import { eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core';
import type { PgColumn } from 'drizzle-orm/pg-core';

// The company context (TECH-DESIGN 5.1). Two locks keep one company's rows from another's: forCompany adds the
// company to every query on a company table (lock 1), and the database's row rules, put on each company table by
// core.add_company_rules, bind every query to the company that withCompany sets for the transaction (lock 2).
// withCompany takes any of the app's Drizzle databases, made with a schema or without one.
type Schema = Record<string, unknown>;
export type Database<S extends Schema = Record<string, never>> = NodePgDatabase<S>;
export type Transaction<S extends Schema = Record<string, never>> = Parameters<
  Parameters<Database<S>['transaction']>[0]
>[0];

const COMPANY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A value that is not a company ID is refused before it reaches the database: a failed ::uuid cast would repeat
// the value in its error, and the error must never name it.
function checkCompanyId(companyId: string): void {
  if (!COMPANY_ID.test(companyId)) throw new Error('the company is not a valid ID');
}

// Runs work in one transaction whose first statement sets the company (true: for this transaction only). It takes
// the database itself, never a transaction: inside one it would only open a savepoint, and the company it set would
// stay on the outer transaction after the savepoint ends.
export async function withCompany<T, S extends Schema = Record<string, never>>(
  db: Database<S>,
  companyId: string,
  work: (tx: Transaction<S>) => Promise<T>,
): Promise<T> {
  checkCompanyId(companyId);
  if (db instanceof PgTransaction) {
    throw new Error('withCompany needs the database, not a transaction');
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.company_id', ${companyId}, true)`);
    return work(tx);
  });
}

// Lock 1: the filter every query on a company table adds, for example .where(forCompany(table.companyId, id)).
export function forCompany(column: PgColumn, companyId: string): SQL {
  checkCompanyId(companyId);
  return eq(column, companyId);
}
