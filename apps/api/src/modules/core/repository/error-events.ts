import { sql } from 'drizzle-orm';
import type { Transaction } from '../../../db/company.js';
import { securityWrite, securityWriteWithoutCompany } from '../../../db/database.js';
import { getContext, type RequestContext } from '../../../shared/context.js';
import { safeErrorMessage } from '../../../shared/logging.js';

// The error recorder (TASK-0019, CORE-140). It adds an error to core.error_events through the database function
// core.record_error, in a short security write of its own, so the error stays when the request's or job's own
// transaction is undone: under the context's company, or with no company (a system error) when there is none. Only the
// cleaned message is kept (safeErrorMessage, never the error itself), with the request's or job's ID.
export type ErrorSource = 'api' | 'worker';

// The request or job context, or none outside one (a command-line script, a test).
function currentContext(): RequestContext | undefined {
  try {
    return getContext();
  } catch {
    return undefined;
  }
}

export async function recordError(error: unknown, source: ErrorSource): Promise<string> {
  const context = currentContext();
  const message = safeErrorMessage(error);
  const requestId = context?.requestId ?? null;
  const add = async (tx: Transaction): Promise<string> => {
    const result = await tx.execute(
      sql`SELECT core.record_error(${source}, ${message}, ${requestId}) AS id`,
    );
    const id = result.rows[0]?.id;
    if (typeof id !== 'string') {
      throw new Error('the error was not recorded');
    }
    return id;
  };
  return context?.companyId
    ? securityWrite(context.companyId, add)
    : securityWriteWithoutCompany(add);
}
