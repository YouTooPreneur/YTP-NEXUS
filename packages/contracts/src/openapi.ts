import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { allContracts } from './all.js';
import type { Contract } from './contract.js';

export function generateOpenApi() {
  const registry = new OpenAPIRegistry();
  // Widen the const list so the optional params, query and body can be read.
  const contracts: readonly Contract[] = allContracts;
  for (const contract of contracts) {
    registry.registerPath({
      method: contract.method,
      path: contract.path,
      operationId: contract.operationId,
      summary: contract.summary,
      tags: [contract.module],
      request: {
        ...(contract.params ? { params: contract.params } : {}),
        ...(contract.query ? { query: contract.query } : {}),
        ...(contract.body ? { body: { content: { 'application/json': { schema: contract.body } } } } : {}),
      },
      responses: { 200: { description: 'OK', content: { 'application/json': { schema: contract.response } } } },
    });
  }
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: { title: 'YTP Nexus API', version: '0.1.0' },
  });
}
