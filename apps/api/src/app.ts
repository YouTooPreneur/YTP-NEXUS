import express, { type Express } from 'express';
import type { pino } from 'pino';
import { contextMiddleware } from './shared/context.js';
import { createLogger, httpLogger } from './shared/logging.js';
import { errorHandler, notFoundHandler } from './shared/errors.js';

export interface AppOptions {
  logger?: pino.Logger;
  routes?: (app: Express) => void;
}

export function createApp(options: AppOptions = {}): Express {
  const logger = options.logger ?? createLogger();
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(contextMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(httpLogger(logger));

  app.get('/api/health', (_request, response) => {
    response.status(200).json({ ok: true, service: 'api' });
  });

  options.routes?.(app);

  app.use(notFoundHandler());
  app.use(errorHandler(logger));

  return app;
}
