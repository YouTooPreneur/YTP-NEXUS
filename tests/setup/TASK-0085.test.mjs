// TASK-0085 · The screens' API client settings: the generated client uses the screens' own fetch, the query library's own retries and refetches are off, the fetch lives outside the generated folder, and no screen lint rule is left at warning level. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const run = (args, input) => spawnSync(pnpm, args, { input, encoding: 'utf8', shell: process.platform === 'win32' });
const lint = (filename, text) => run(['exec', 'eslint', '--format', 'json', '--stdin', '--stdin-filename', filename], text);
const messages = (result) => JSON.parse(result.stdout || '[]').flatMap((file) => file.messages);

test('the generated client calls the screens’ own fetch, keeps forceSuccessResponse and switches off the query library’s retries and refetches', () => {
  const config = read('apps/web/orval.config.ts');
  assert.match(config, /mutator: \{ path: '\.\/src\/requests\/nexus-fetch\.ts', name: 'nexusFetch' \}/);
  assert.match(config, /fetch: \{ forceSuccessResponse: true \}/);
  assert.match(config, /options: \{ retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false \}/);
});

test('the screens’ own fetch lives outside the generated folder, takes two parts and never sets the browser’s own headers', () => {
  const source = read('apps/web/src/requests/nexus-fetch.ts');
  const imports = source.split('\n').filter((line) => /^import\b/.test(line));
  assert.ok(imports.every((line) => !/['"]\.\.?\/(api|\.\.\/api)/.test(line)), 'never imports the generated client');
  assert.match(source, /^export type ErrorType<Info> = Error & \{ info\?: Info; status\?: number \};$/m);
  assert.match(source, /^export const nexusFetch = async <T>\(url: string, init: NexusRequestInit = \{\}\): Promise<T> => \{$/m);
  assert.doesNotMatch(source, /\.(set|append)\('(Origin|Sec-Fetch-Site)'/i, 'the browser sets Origin and Sec-Fetch-Site itself');
});

test('no screen lint rule is left at warning level: unsupported syntax is an error and the library warning is off', () => {
  const printed = run(['exec', 'eslint', '--print-config', 'apps/web/src/App.tsx']);
  assert.equal(printed.status, 0, printed.stderr);
  const rules = JSON.parse(printed.stdout).rules;
  const warnings = Object.entries(rules).filter(([name, value]) => name.startsWith('react-hooks/') && (Array.isArray(value) ? value[0] : value) === 1);
  assert.deepEqual(warnings, [], 'no react-hooks rule at warning level');
  assert.equal((Array.isArray(rules['react-hooks/unsupported-syntax']) ? rules['react-hooks/unsupported-syntax'][0] : rules['react-hooks/unsupported-syntax']), 2);
  assert.equal((Array.isArray(rules['react-hooks/incompatible-library']) ? rules['react-hooks/incompatible-library'][0] : rules['react-hooks/incompatible-library']), 0);
});

test('lint fails on eval in a screen, and stays quiet about a form library hook', () => {
  const evalProbe = 'export function Probe() {\n  const value = eval("1 + 1");\n  return <p>{value}</p>;\n}\n';
  const found = messages(lint('apps/web/src/probe-0085.tsx', evalProbe));
  assert.ok(found.some((m) => m.ruleId === 'react-hooks/unsupported-syntax' && m.severity === 2), JSON.stringify(found));
  const formProbe =
    "import { useForm } from 'react-hook-form';\n\nexport function Probe() {\n  const form = useForm();\n  return <p>{String(form.formState.isDirty)}</p>;\n}\n";
  const quiet = messages(lint('apps/web/src/probe-0085-form.tsx', formProbe));
  assert.ok(quiet.every((m) => m.ruleId !== 'react-hooks/incompatible-library'), JSON.stringify(quiet));
});
