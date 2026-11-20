import { getContext } from './context.js';
import type { RouteInfo } from './route.js';

// The hidden-fields step (TECH-DESIGN section 2, step 14, and 6.2; TASK-0031), run after the answer is checked against
// its contract: every field the person's role does not see is removed at the answer paths the door's contract maps to
// its hidden name (hideableFields). It works on a copy, copying only along the paths it changes, so the answer it is
// given (perhaps the double-click step's kept answer) never changes. A door that names no hideable field gets its
// answer back as it is, with nothing read. Plain and synchronous.
export function hideFields(info: RouteInfo, answer: unknown): unknown {
  const hideable = info.route.contract.hideableFields;
  if (hideable === undefined || Object.keys(hideable).length === 0) {
    return answer;
  }
  const { access } = getContext();
  if (!access) {
    throw new Error(`${info.route.operationId}: hidden fields need the permission step`);
  }
  let result = answer;
  for (const [path, name] of Object.entries(hideable)) {
    if (access.hiddenFields.includes(name)) {
      result = without(result, path.split('.'));
    }
  }
  return result;
}

// A path has dots between keys: `key[]` means each item of the list at key, a first part `[]` each item of an answer
// that is a list, and the last part is a plain key, which is deleted. A part whose parent is missing, null or not what
// the path expects (a plain object for a key, a list for []) is skipped; list items that are not objects stay as they
// are. Gives back the value itself when nothing changed, otherwise a copy.
function without(value: unknown, parts: readonly string[]): unknown {
  const [part, ...rest] = parts;
  if (part === undefined) {
    return value;
  }
  if (part === '[]') {
    return eachWithout(value, rest);
  }
  const key = part.endsWith('[]') ? part.slice(0, -2) : part;
  if (!isPlainObject(value) || !Object.hasOwn(value, key)) {
    return value;
  }
  if (rest.length === 0) {
    const copy = { ...value };
    delete copy[key];
    return copy;
  }
  const child = value[key];
  const changed = key === part ? without(child, rest) : eachWithout(child, rest);
  return changed === child ? value : { ...value, [key]: changed };
}

function eachWithout(list: unknown, rest: readonly string[]): unknown {
  if (!Array.isArray(list)) {
    return list;
  }
  const items = list.map((item: unknown) => without(item, rest));
  return items.some((item, index) => item !== list[index]) ? items : list;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
