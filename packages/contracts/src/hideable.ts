import { ZodArray, ZodNullable, ZodObject, ZodOptional, ZodReadonly } from 'zod';
import type { Contract } from './contract.js';

// The hideable fields a contract names (TECH-DESIGN 6.2, TASK-0031): each answer path a role may hide must be written
// in the agreed form, be in the answer, and be .optional() there, so the generated client never promises a field that
// the hidden-fields step removes; its hidden name is <module>.<record type>.<field>, for example finance.invoice.total.
const PATH = /^(\[\]\.)?([A-Za-z_][A-Za-z0-9_]*(\[\])?\.)*[A-Za-z_][A-Za-z0-9_]*$/;
const NAME = /^[a-z][a-z0-9]*\.[a-z][a-z0-9_]*\.[a-z][A-Za-z0-9]*$/;

// Entry by entry, in the map's order: the first problem of the entry's path, if any, then a problem with its name.
export function hideableProblems(contract: Contract): string[] {
  const problems: string[] = [];
  for (const [path, name] of Object.entries(contract.hideableFields ?? {})) {
    const entry = `${contract.operationId}: ${path}`;
    if (!PATH.test(path)) {
      problems.push(`${entry} is not a valid answer path`);
    } else {
      const field = fieldAt(contract.response, path.split('.'));
      if (field === null) {
        problems.push(`${entry} is not in the answer`);
      } else if (!(field instanceof ZodOptional)) {
        problems.push(`${entry} must be .optional() in the answer`);
      }
    }
    if (!NAME.test(name)) {
      problems.push(`${entry} is hidden as ${name}, which is not <module>.<record type>.<field>`);
    }
  }
  return problems;
}

// Follows a path in the agreed form through the answer's schema: into an object by its own key, into a list's items
// for [], walking through .optional(), .nullable() and .readonly() before each key and each []. Anything else (a
// union, a record, an object's catchall included) ends the walk with null. Gives back the field at the end as it is
// written, since the last part is always a plain key.
function fieldAt(response: unknown, parts: readonly string[]): unknown {
  let schema = response;
  for (const part of parts) {
    if (part !== '[]') {
      const key = part.endsWith('[]') ? part.slice(0, -2) : part;
      const parent = unwrapped(schema);
      if (!(parent instanceof ZodObject) || !Object.hasOwn(parent.shape, key)) {
        return null;
      }
      schema = parent.shape[key];
    }
    if (part.endsWith('[]')) {
      const list = unwrapped(schema);
      if (!(list instanceof ZodArray)) {
        return null;
      }
      schema = list.element;
    }
  }
  return schema;
}

function unwrapped(schema: unknown): unknown {
  let inner = schema;
  while (
    inner instanceof ZodOptional ||
    inner instanceof ZodNullable ||
    inner instanceof ZodReadonly
  ) {
    inner = inner.unwrap();
  }
  return inner;
}
