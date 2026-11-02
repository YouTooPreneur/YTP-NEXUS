import { z } from 'zod';
import { defineContract } from '../contract.js';

export const HealthResponse = z.object({ ok: z.literal(true), service: z.literal('api') });

export const getHealth = defineContract({
  method: 'get',
  path: '/api/health',
  operationId: 'getHealth',
  module: 'core',
  summary: 'Is the API running?',
  response: HealthResponse,
});
