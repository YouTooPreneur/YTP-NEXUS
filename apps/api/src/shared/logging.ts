import type { RequestHandler } from 'express';
import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import { getContext } from './context.js';

export const REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  '*.password',
  '*.code',
  '*.token',
  '*.secret',
  '*.newPassword',
  '*.currentPassword',
];

export function createLogger(destination?: pino.DestinationStream): pino.Logger {
  return pino(
    {
      level: process.env.LOG_LEVEL ?? 'info',
      redact: { paths: REDACT_PATHS, censor: '[removed]' },
    },
    destination,
  );
}

export function httpLogger(logger: pino.Logger): RequestHandler {
  return pinoHttp({
    logger,
    genReqId: () => getContext().requestId,
  });
}
