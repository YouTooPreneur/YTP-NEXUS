// TASK-0005 · Shared API list. Written by the planner; builders never edit this file.
import { describe, expect, it } from 'vitest';
import { allContracts, generateOpenApi, getHealth, HealthResponse } from '../src/index.js';

describe('the API list', () => {
  it('contains the health door', () => {
    expect(allContracts).toContain(getHealth);
    expect(getHealth).toMatchObject({ method: 'get', path: '/api/health', operationId: 'getHealth', module: 'core' });
  });

  it('checks the health answer', () => {
    expect(HealthResponse.parse({ ok: true, service: 'api' })).toEqual({ ok: true, service: 'api' });
    expect(() => HealthResponse.parse({ ok: false, service: 'api' })).toThrow();
  });

  it('every operationId is unique, and every path starts with /api/', () => {
    const ids = allContracts.map((c) => c.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of allContracts) expect(c.path.startsWith('/api/')).toBe(true);
  });
});

describe('the OpenAPI description', () => {
  const doc = generateOpenApi() as {
    openapi: string;
    info: { title: string; version: string };
    paths: Record<string, Record<string, { operationId?: string; tags?: string[]; responses?: Record<string, unknown> }>>;
  };

  it('is OpenAPI 3.1 for the YTP Nexus API', () => {
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.title).toBe('YTP Nexus API');
  });

  it('describes every door in the list, and nothing else', () => {
    const described = Object.entries(doc.paths).flatMap(([path, methods]) =>
      Object.entries(methods).map(([method, op]) => `${method} ${path} ${op.operationId}`),
    );
    const listed = allContracts.map((c) => `${c.method} ${c.path} ${c.operationId}`);
    expect(described.sort()).toEqual([...listed].sort());
  });

  it('tags the health door with its module and gives it a 200 answer', () => {
    const op = doc.paths['/api/health']?.get;
    expect(op?.operationId).toBe('getHealth');
    expect(op?.tags).toEqual(['core']);
    expect(op?.responses?.['200']).toBeDefined();
  });
});
