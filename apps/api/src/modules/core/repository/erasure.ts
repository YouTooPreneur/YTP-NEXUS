import { sql } from 'drizzle-orm';
import { getContext } from '../../../shared/context.js';
import { writeSecurity } from './security-log.js';

// Removing personal values on request (TASK-0025, DPDP, NFR-010). In the request's own transaction, every activity entry
// of one record loses its label and the old and new values of the named fields (core.erase_personal_values), and a
// data_erased entry is written in the security log last. Only the Owner's deletion-request action calls it.
export interface Erasure {
  recordType: string;
  recordId: string;
  fields: string[];
}

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function erasePersonalValues(erasure: Erasure): Promise<number> {
  const context = getContext();
  if (!context.tx) {
    throw new Error('the removal needs the transaction');
  }
  if (!ID.test(erasure.recordId)) {
    throw new Error('the removal needs a record ID');
  }
  if (
    !erasure.recordType ||
    !erasure.fields.every((field) => typeof field === 'string' && field !== '')
  ) {
    throw new Error('the removal needs a record type and field names');
  }
  const result = await context.tx.execute(
    sql`SELECT core.erase_personal_values(${erasure.recordType}, ${erasure.recordId}::uuid, ${JSON.stringify(erasure.fields)}::jsonb) AS changed`,
  );
  const changed = Number(result.rows[0]?.changed ?? 0);
  await writeSecurity({
    event: 'data_erased',
    recordType: erasure.recordType,
    recordId: erasure.recordId,
    details: { entries: changed, fields: erasure.fields },
  });
  return changed;
}
