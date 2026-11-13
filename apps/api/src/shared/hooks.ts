import type { RouteHooks } from './route.js';
import { inRequestTransaction } from '../db/database.js';
import { doubleClickKey } from './idempotency.js';

// The shared steps of every non-public door (TECH-DESIGN section 2), which route.ts runs in order. Each card that
// builds a step replaces its line here: TASK-0033 session, TASK-0034 idleTimeout, TASK-0037 twoStepGate,
// TASK-0035 personLimit, TASK-0057 featureSwitch, TASK-0031 permission and hideFields, TASK-0022 idempotency.
// A step not built yet refuses every request (500), so no door works without it. Making the hooks reads no
// setting and opens no connection.
function notBuilt(step: string): never {
  throw new Error(`${step} is not built yet`);
}

export function createHooks(): RouteHooks {
  return {
    session: async () => notBuilt('session'),
    inTransaction: async (_info, run) => inRequestTransaction(run),
    idleTimeout: async () => notBuilt('idleTimeout'),
    twoStepGate: async () => notBuilt('twoStepGate'),
    personLimit: async () => notBuilt('personLimit'),
    // On purpose, until TASK-0057 builds the feature switches: every feature counts as switched on. The
    // permission check after it still runs.
    featureSwitch: async () => {},
    permission: async () => notBuilt('permission'),
    idempotency: async (info, run) => doubleClickKey(info, run),
    hideFields: () => notBuilt('hideFields'),
  };
}
