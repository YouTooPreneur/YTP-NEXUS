import { and, eq, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { forCompany } from '../../../db/company.js';
import { getContext } from '../../../shared/context.js';
import { AppError } from '../../../shared/errors.js';
import { writeActivity } from '../repository/activity-log.js';
import { settings } from '../schema/settings.js';

// The settings store (TASK-0024, CORE-012, DATA-MODEL 3.1). Each setting is defined once in code with defineSetting:
// its key, module, rule (a zod schema), default and help. Only the values a company changed are stored, and a setting
// with no stored value uses its default. Reads and saves run in the transaction on the request context; a save checks
// the value and the version it was based on, and writes its activity-log entry in the same transaction. A setting
// never holds a secret: keys and passwords live in the environment file or, later, in the doors.
export interface SettingDefinition<T> {
  key: string;
  module: string;
  schema: z.ZodType<T>;
  default: T;
  help: string;
}

export interface SavedSetting<T> {
  key: string;
  value: T;
  version: number;
  updatedAt: Date | null;
}

const KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;
const SECRET = /pass(word|code)|secret|token|apikey|privatekey/;
const STALE = 'This was just changed, please review';
const definitions = new Map<string, SettingDefinition<unknown>>();

export function defineSetting<T>(definition: SettingDefinition<T>): SettingDefinition<T> {
  const { key } = definition;
  if (!KEY.test(key)) {
    throw new Error(`the setting key ${key} is not <group>.<name> in lower case`);
  }
  if (SECRET.test(key.replace(/[^a-z]/g, ''))) {
    throw new Error(`the setting ${key} looks like a secret, which never goes in settings`);
  }
  if (definitions.has(key)) {
    throw new Error(`the setting ${key} is defined twice`);
  }
  if (definition.default === null || !definition.schema.safeParse(definition.default).success) {
    throw new Error(`the default of the setting ${key} does not fit its rule`);
  }
  definitions.set(key, definition as SettingDefinition<unknown>);
  return definition;
}

export function findSetting(key: string): SettingDefinition<unknown> | undefined {
  return definitions.get(key);
}

function place() {
  const { tx, companyId, userId } = getContext();
  if (!tx || !companyId) {
    throw new Error('settings need the request transaction and the company');
  }
  return { tx, companyId, userId };
}

const one = (companyId: string, key: string) =>
  and(forCompany(settings.companyId, companyId), eq(settings.key, key));

export async function getSetting<T>(definition: SettingDefinition<T>): Promise<T> {
  const { tx, companyId } = place();
  const [row] = await tx
    .select({ value: settings.value })
    .from(settings)
    .where(one(companyId, definition.key));
  if (!row) {
    return definition.default;
  }
  const checked = definition.schema.safeParse(row.value);
  if (!checked.success) {
    throw new Error(`the stored setting ${definition.key} no longer fits its rule`);
  }
  return checked.data;
}

export async function setSetting<T>(
  definition: SettingDefinition<T>,
  value: unknown,
  expectedVersion: number,
): Promise<SavedSetting<T>> {
  const { tx, companyId, userId } = place();
  const checked = definition.schema.safeParse(value);
  if (!checked.success || checked.data === null || checked.data === undefined) {
    const reason = checked.success
      ? 'A value is needed'
      : (checked.error.issues[0]?.message ?? 'Not valid');
    throw new AppError(400, 'invalid_input', 'Please check the form', { value: reason });
  }
  const [current] = await tx.select().from(settings).where(one(companyId, definition.key));
  const version = current?.version ?? 0;
  if (expectedVersion !== version) {
    throw new AppError(409, 'stale_version', STALE);
  }
  const old = current ? current.value : definition.default;
  if (JSON.stringify(old) === JSON.stringify(checked.data)) {
    return {
      key: definition.key,
      value: checked.data,
      version,
      updatedAt: current?.updatedAt ?? null,
    };
  }
  const [row] = current
    ? await tx
        .update(settings)
        .set({
          value: checked.data,
          updatedAt: sql`now()`,
          updatedBy: userId ?? null,
          version: version + 1,
        })
        .where(and(one(companyId, definition.key), eq(settings.version, version)))
        .returning()
    : await tx
        .insert(settings)
        .values({
          companyId,
          key: definition.key,
          module: definition.module,
          value: checked.data,
          updatedBy: userId ?? null,
        })
        .onConflictDoNothing()
        .returning();
  if (!row) {
    throw new AppError(409, 'stale_version', STALE);
  }
  await writeActivity({
    module: definition.module,
    recordType: 'setting',
    recordId: companyId,
    recordLabel: definition.key,
    action: 'update',
    changes: { [definition.key]: { old, new: checked.data } },
  });
  return {
    key: definition.key,
    value: checked.data,
    version: row.version,
    updatedAt: row.updatedAt,
  };
}
