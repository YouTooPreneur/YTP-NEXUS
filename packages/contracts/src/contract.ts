import type { ZodObject, ZodRawShape, ZodType } from 'zod';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** One API door, written once and shared by the backend and the frontend (D-187). */
export interface Contract {
  method: HttpMethod;
  /** OpenAPI style, for example '/api/core/users/{userId}'. */
  path: string;
  operationId: string;
  /** The Nexus module that owns the door: 'core', 'crm', … */
  module: string;
  summary: string;
  params?: ZodObject<ZodRawShape>;
  query?: ZodObject<ZodRawShape>;
  body?: ZodType;
  response: ZodType;
  /** Fields of the response that a role may hide (TECH-DESIGN 6.2). */
  hideableFields?: readonly string[];
}

export function defineContract<const C extends Contract>(contract: C): C {
  return contract;
}
