import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { pino } from 'pino';
import { getContext } from './context.js';
import { recordError } from '../modules/core/repository/error-events.js';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(): RequestHandler {
  return (_req, _res, next) => {
    next(new AppError(404, 'not_found', 'Not found'));
  };
}

// Keeps a server error for Monitoring (TASK-0019) without making the answer wait for it; a failure to keep it is
// logged as a warning, never thrown.
function keepError(logger: pino.Logger, error: unknown, requestId: string): void {
  recordError(error, 'api').catch((failure: unknown) => {
    logger.warn({ err: failure, requestId }, 'error not recorded');
  });
}

export function errorHandler(logger: pino.Logger): ErrorRequestHandler {
  return (error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    const requestId = getContext().requestId;

    if (error instanceof AppError) {
      // An AppError of 500 or more (an outside service that is down, for example) is a server error: logged and kept
      // like an unexpected one, then answered with its own status and format.
      if (error.status >= 500) {
        logger.error({ err: error, requestId }, 'server error');
        keepError(logger, error, requestId);
      }
      const errorBody: {
        code: string;
        message: string;
        requestId: string;
        fields?: Record<string, string>;
      } = {
        code: error.code,
        message: error.message,
        requestId,
      };
      if (error.fields !== undefined) {
        errorBody.fields = error.fields;
      }
      res.status(error.status).json({ error: errorBody });
      return;
    }

    const isBodyError =
      typeof error === 'object' &&
      error !== null &&
      'expose' in error &&
      (error as { expose?: unknown }).expose === true &&
      typeof (error as { status?: unknown }).status === 'number' &&
      (error as { status: number }).status >= 400 &&
      (error as { status: number }).status <= 499;

    if (isBodyError) {
      const bodyError = error as { status: number; type?: string };
      logger.warn(
        { requestId, status: bodyError.status, type: bodyError.type },
        'request body refused',
      );
      const code = bodyError.status === 413 ? 'too_large' : 'invalid_input';
      const message = bodyError.status === 413 ? 'This is too large' : 'Please check the form';
      res.status(bodyError.status).json({
        error: {
          code,
          message,
          requestId,
        },
      });
      return;
    }

    logger.error({ err: error, requestId }, 'server error');
    keepError(logger, error, requestId);
    res.status(500).json({
      error: {
        code: 'server_error',
        message: 'Something went wrong. Please try again.',
        requestId,
      },
    });
  };
}
