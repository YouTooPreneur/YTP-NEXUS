import type { Request, Response, NextFunction, Express } from 'express';
import type { ZodType, z } from 'zod';
import type { Contract, HttpMethod } from '@ytp/contracts';
import { AppError } from './errors.js';

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export interface Permission {
  module: string;
  action: Action;
}

export interface RouteInfo {
  req: Request;
  route: RegisteredRoute;
}

export interface RouteHooks {
  session(info: RouteInfo): Promise<void>;
  inTransaction<T>(info: RouteInfo, run: () => Promise<T>): Promise<T>;
  idleTimeout(info: RouteInfo): Promise<void>;
  twoStepGate(info: RouteInfo): Promise<void>;
  personLimit(info: RouteInfo): Promise<void>;
  featureSwitch(info: RouteInfo): Promise<void>;
  permission(info: RouteInfo): Promise<void>;
  idempotency<T>(info: RouteInfo, run: () => Promise<T>): Promise<T>;
  hideFields(info: RouteInfo, answer: unknown): unknown;
}

export interface RegisteredRoute {
  operationId: string;
  method: HttpMethod;
  path: string;
  module: string;
  public: boolean;
  permission?: Permission;
  feature?: string;
  contract: Contract;
  handler(
    input: { params: unknown; query: unknown; body: unknown },
    info: RouteInfo,
  ): Promise<unknown>;
}

export const routeRegistry: RegisteredRoute[] = [];

export type RouteInput<C extends Contract> = {
  params: C['params'] extends ZodType ? z.infer<C['params']> : undefined;
  query: C['query'] extends ZodType ? z.infer<C['query']> : undefined;
  body: C['body'] extends ZodType ? z.infer<C['body']> : undefined;
};

export type RouteHandler<C extends Contract, Res> = (
  input: RouteInput<C>,
  info: RouteInfo,
) => Promise<Res>;

export interface PublicRouteDefinition<C extends Contract = Contract, Res = unknown> {
  contract: C;
  public: true;
  permission?: never;
  feature?: never;
  handler: RouteHandler<C, Res>;
}

export interface ProtectedRouteDefinition<C extends Contract = Contract, Res = unknown> {
  contract: C;
  public?: false;
  permission: Permission;
  feature: string;
  handler: RouteHandler<C, Res>;
}

export type RouteDefinition<C extends Contract = Contract, Res = unknown> =
  PublicRouteDefinition<C, Res> | ProtectedRouteDefinition<C, Res>;

export function defineRoute<const C extends Contract, Res>(
  def: RouteDefinition<C, Res>,
): RegisteredRoute {
  const operationId = def.contract?.operationId ?? 'unknown';
  const isPublic = Boolean((def as { public?: boolean }).public);
  const rawDef = def as { permission?: Permission; feature?: string };

  if (isPublic) {
    if (rawDef.permission !== undefined || rawDef.feature !== undefined) {
      throw new Error(
        `Route ${operationId} is public and cannot declare a permission or feature key`,
      );
    }
  } else {
    if (!rawDef.permission || !rawDef.feature) {
      throw new Error(
        `Route ${operationId} must declare its permission and feature key, or be public`,
      );
    }
  }

  const route: RegisteredRoute = {
    operationId: def.contract.operationId,
    method: def.contract.method,
    path: def.contract.path,
    module: def.contract.module,
    public: isPublic,
    ...(rawDef.permission ? { permission: rawDef.permission } : {}),
    ...(rawDef.feature ? { feature: rawDef.feature } : {}),
    contract: def.contract,
    handler: def.handler,
  };

  routeRegistry.push(route);
  return route;
}

function checkInput(
  contract: Contract,
  req: Request,
): { params: unknown; query: unknown; body: unknown } {
  const fields: Record<string, string> = {};

  let parsedParams: unknown = undefined;
  if (contract.params) {
    const result = contract.params.safeParse(req.params);
    if (result.success) {
      parsedParams = result.data;
    } else {
      for (const issue of result.error.issues) {
        const key = issue.path.length > 0 ? ['params', ...issue.path].join('.') : 'params';
        if (!fields[key]) {
          fields[key] = issue.message;
        }
      }
    }
  }

  let parsedQuery: unknown = undefined;
  if (contract.query) {
    const result = contract.query.safeParse(req.query);
    if (result.success) {
      parsedQuery = result.data;
    } else {
      for (const issue of result.error.issues) {
        const key = issue.path.length > 0 ? ['query', ...issue.path].join('.') : 'query';
        if (!fields[key]) {
          fields[key] = issue.message;
        }
      }
    }
  }

  let parsedBody: unknown = undefined;
  if (contract.body) {
    const result = contract.body.safeParse(req.body);
    if (result.success) {
      parsedBody = result.data;
    } else {
      for (const issue of result.error.issues) {
        const key = issue.path.length > 0 ? ['body', ...issue.path].join('.') : 'body';
        if (!fields[key]) {
          fields[key] = issue.message;
        }
      }
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError(400, 'invalid_input', 'Please check the form', fields);
  }

  return {
    params: parsedParams,
    query: parsedQuery,
    body: parsedBody,
  };
}

export function mountRoutes(
  app: Express,
  routes: readonly RegisteredRoute[],
  hooks?: RouteHooks,
): void {
  for (const route of routes) {
    if (!route.public && !hooks) {
      throw new Error(
        `Route ${route.operationId} needs the shared hooks; they come with steps 2.2 to 2.5`,
      );
    }

    const expressPath = route.path.replace(/\{([^}]+)\}/g, ':$1');

    app[route.method](expressPath, async (req: Request, res: Response, next: NextFunction) => {
      const info: RouteInfo = { req, route };

      try {
        if (route.public) {
          const input = checkInput(route.contract, req);
          const answer = await route.handler(input, info);
          res.status(200).json(answer);
          return;
        }

        const h = hooks!;
        await h.session(info);
        const answer = await h.inTransaction(info, async () => {
          await h.idleTimeout(info);
          await h.twoStepGate(info);
          await h.personLimit(info);
          await h.featureSwitch(info);
          await h.permission(info);
          const input = checkInput(route.contract, req);
          const rawAnswer = await h.idempotency(info, async () => {
            return route.handler(input, info);
          });
          return h.hideFields(info, rawAnswer);
        });

        res.status(200).json(answer);
      } catch (error) {
        next(error);
      }
    });
  }
}
