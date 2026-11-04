import { getHealth } from '@ytp/contracts';
import { defineRoute } from '../../../shared/route.js';

export const healthRoute = defineRoute({
  contract: getHealth,
  public: true,
  handler: async () => ({ ok: true, service: 'api' }),
});
