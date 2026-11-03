import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export interface RequestContext {
  requestId: string;
  background: boolean;
  userId?: string;
  companyId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function contextMiddleware(): RequestHandler {
  return (req, res, next) => {
    const requestId = randomUUID();
    const background = req.headers['x-nexus-background'] === '1';
    res.setHeader('x-request-id', requestId);
    const context: RequestContext = { requestId, background };
    storage.run(context, () => {
      next();
    });
  };
}

export function getContext(): RequestContext {
  const context = storage.getStore();
  if (!context) {
    throw new Error('No request context');
  }
  return context;
}

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}
