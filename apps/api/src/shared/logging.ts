import type { RequestHandler } from 'express';
import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import { getContext } from './context.js';

const SECRET_KEYS = ['password', 'code', 'token', 'secret', 'newPassword', 'currentPassword'];

// Removed from every log line: sign-in headers, the Referer and redirect addresses (they can carry a
// one-time token in their query), and secret fields at the top level and up to three levels deep.
export const REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'req.headers.referer',
  'res.headers["set-cookie"]',
  'res.headers.location',
  ...SECRET_KEYS,
  ...SECRET_KEYS.map((key) => `*.${key}`),
  ...SECRET_KEYS.map((key) => `*.*.${key}`),
];

type ErrorLike = {
  message: string;
  stack?: unknown;
  code?: unknown;
  cause?: unknown;
  raw?: unknown;
};

function isErrorLike(value: unknown): value is ErrorLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

function describeError(error: ErrorLike): { type: string; message: string; errorCode?: string } {
  const type = error.constructor?.name || 'Error';
  // A failed database query repeats every value it was given after "params:" in its message.
  const cut = error.message.indexOf('\nparams: ');
  const message = cut === -1 ? error.message : error.message.slice(0, cut);
  const code = error.code;
  return typeof code === 'string' || typeof code === 'number'
    ? { type, message, errorCode: String(code) }
    : { type, message };
}

// Logs an error's type, message (without a query's values), code, stack frames and one level of
// cause. Every other property (params, input, detail, body, config) is dropped: it can hold secrets.
export function cleanError(value: unknown): unknown {
  const error = isErrorLike(value) && value.raw instanceof Error ? value.raw : value;
  if (!isErrorLike(error)) return { type: typeof error };
  const described = describeError(error);
  const frames = String(error.stack ?? '')
    .split('\n')
    .filter((line) => /^\s+at /.test(line));
  return {
    ...described,
    stack: [`${described.type}: ${described.message}`, ...frames].join('\n'),
    ...(isErrorLike(error.cause) ? { cause: describeError(error.cause) } : {}),
  };
}

export function createLogger(destination?: pino.DestinationStream): pino.Logger {
  return pino(
    {
      level: process.env.LOG_LEVEL || 'info',
      redact: { paths: REDACT_PATHS, censor: '[removed]' },
      serializers: { err: cleanError },
      hooks: {
        // With no message, pino writes the error's own message as `msg` before any printer runs,
        // a failed query's values included; this hands it the cleaned message instead.
        logMethod(args, method) {
          const [first, second] = args as unknown[];
          const object = (typeof first === 'object' && first !== null ? first : {}) as {
            err?: unknown;
            msg?: unknown;
          };
          const error =
            first instanceof Error ? first : object.msg === undefined ? object.err : undefined;
          if (second === undefined && isErrorLike(error)) {
            return method.apply(this, [first, describeError(error).message] as never);
          }
          return method.apply(this, args);
        },
      },
      formatters: {
        // An error logged under any other top-level key ({ error }, { cause }) is cleaned the same way.
        log: (object) =>
          Object.fromEntries(
            Object.entries(object).map(([key, value]) => [
              key,
              key !== 'err' && value instanceof Error ? cleanError(value) : value,
            ]),
          ),
      },
    },
    destination,
  );
}

export function httpLogger(logger: pino.Logger): RequestHandler {
  return pinoHttp({
    logger,
    genReqId: () => getContext().requestId,
    serializers: {
      // pino-http hands these its own copy of the request, so the real request is not changed.
      req: (req: { url?: string; query?: unknown }) => {
        req.url = req.url?.split('?')[0];
        delete req.query;
        return req;
      },
      err: cleanError,
    },
  });
}
