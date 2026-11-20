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
  /**
   * Fields of the answer that a role may hide (TECH-DESIGN 6.2): each answer path maps to the hidden field's name,
   * `<module>.<record type>.<field>`: the Nexus module, the record type as the activity log writes it (singular, for
   * example `invoice_line`) and the field's name in the record's contract, for example `finance.invoice.total`; the
   * module's permission list offers exactly these names. A path has dots between keys; `[]` after a key means each item
   * of that list, and a path starting `[].` means each item of an answer that is a list. Every such field is
   * `.optional()` in the answer.
   */
  hideableFields?: Readonly<Record<string, string>>;
}

export function defineContract<const C extends Contract>(contract: C): C {
  return contract;
}
