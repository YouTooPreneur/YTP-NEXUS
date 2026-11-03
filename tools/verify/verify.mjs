#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { steps } from './steps.mjs';
import { readLock, readIndexStatuses, listTestFiles, selectTests } from './lib.mjs';

const root = process.cwd();
const args = process.argv.slice(2);

let card = null;
let list = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--list') {
    list = true;
  } else if (arg === '--card') {
    i++;
    if (i >= args.length) {
      console.error('verify: unknown card');
      process.exit(2);
    }
    const val = args[i];
    if (!/^TASK-\d{4}$/.test(val) || !fs.existsSync(path.join(root, `docs/tasks/${val}.md`))) {
      console.error(`verify: unknown card ${val}`);
      process.exit(2);
    }
    card = val;
  } else if (arg.startsWith('--card=')) {
    const val = arg.slice('--card='.length);
    if (!/^TASK-\d{4}$/.test(val) || !fs.existsSync(path.join(root, `docs/tasks/${val}.md`))) {
      console.error(`verify: unknown card ${val}`);
      process.exit(2);
    }
    card = val;
  } else {
    console.error(`verify: unknown argument ${arg}`);
    process.exit(2);
  }
}

if (list) {
  for (const step of steps) {
    console.log(step.name);
  }
  process.exit(0);
}

let lock;
let statuses;
let files;
let selected;

try {
  const lockContent = fs.readFileSync(path.join(root, 'tests', 'LOCK'), 'utf8');
  const indexContent = fs.readFileSync(path.join(root, 'docs', 'tasks', 'INDEX.md'), 'utf8');

  lock = readLock(lockContent);
  statuses = readIndexStatuses(indexContent);
  files = listTestFiles(root);
  selected = selectTests({ files, lock, statuses, card });
} catch (err) {
  console.log(`verify: FAILED: ${err.message}`);
  process.exit(1);
}

console.log(
  `verify: running ${selected.run.length} test files, leaving out ${selected.left.length} (cards not Done)`,
);

const ctx = {
  root,
  card,
  selected: selected.run,
};

const failedSteps = [];
for (const step of steps) {
  console.log(`▶ ${step.name}`);
  let res;
  try {
    res = step.run(ctx);
  } catch (err) {
    res = { ok: false, note: `crashed: ${err.message}` };
  }
  const noteSuffix = res && res.note ? ` (${res.note})` : '';
  if (res && res.ok) {
    console.log(`✔ ${step.name}${noteSuffix}`);
  } else {
    console.log(`✖ ${step.name}${noteSuffix}`);
    failedSteps.push(step.name);
  }
}

if (failedSteps.length === 0) {
  console.log('verify: PASSED');
  process.exit(0);
} else {
  console.log(`verify: FAILED: ${failedSteps.join(', ')}`);
  process.exit(1);
}
