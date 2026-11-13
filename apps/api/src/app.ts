import express, { type Express } from 'express';
import type { pino } from 'pino';
import { contextMiddleware } from './shared/context.js';
import { createLogger, httpLogger } from './shared/logging.js';
import { errorHandler, notFoundHandler } from './shared/errors.js';
import { mountRoutes, type RouteHooks } from './shared/route.js';
import { createHooks } from './shared/hooks.js';
import { allRoutes } from './routes.js';

export interface AppOptions {
  logger?: pino.Logger;
  hooks?: RouteHooks;
  routes?: (app: Express) => void;
}

export function createApp(options: AppOptions = {}): Express {
  const logger = options.logger ?? createLogger();
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(contextMiddleware());
  app.use(httpLogger(logger));
  app.use(express.json({ limit: '1mb' }));

  mountRoutes(app, allRoutes, options.hooks ?? createHooks());

  options.routes?.(app);

  app.use(notFoundHandler());
  app.use(errorHandler(logger));

  return app;
}
