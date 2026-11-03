import fs from 'node:fs';
import path from 'node:path';

export function readLock(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const parts = trimmed.split(/\s+/);
    const n = i + 1;
    if (
      parts.length !== 3 ||
      !/^TASK-\d{4}$/.test(parts[0]) ||
      parts[1].includes('\\') ||
      !/^[0-9a-f]{64}$/.test(parts[2])
    ) {
      throw new Error(`tests/LOCK line ${n}: ${line}`);
    }
    entries.push({ card: parts[0], path: parts[1], sha256: parts[2] });
  }
  return entries;
}

export function readIndexStatuses(markdown) {
  const lines = markdown.split(/\r?\n/);
  const statuses = new Map();
  let taskIdx = -1;
  let statusIdx = -1;
  let inTargetTable = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.includes('|')) {
      if (inTargetTable) {
        break;
      }
      continue;
    }

    const rawCells = line.split('|');
    const cells = (
      rawCells[0].trim() === '' && rawCells.length > 1 ? rawCells.slice(1) : rawCells
    ).map((c) => c.trim());
    if (cells.length > 0 && cells[cells.length - 1] === '') {
      cells.pop();
    }

    if (!inTargetTable) {
      const tIdx = cells.indexOf('Task');
      const sIdx = cells.indexOf('Status');
      if (tIdx !== -1 && sIdx !== -1) {
        taskIdx = tIdx;
        statusIdx = sIdx;
        inTargetTable = true;
      }
      continue;
    }

    if (cells.every((c) => /^:?-+:?$/.test(c))) {
      continue;
    }

    if (taskIdx < cells.length && statusIdx < cells.length) {
      const card = cells[taskIdx];
      const status = cells[statusIdx];
      if (/^TASK-\d{4}$/.test(card)) {
        statuses.set(card, status);
      }
    }
  }
  return statuses;
}

function walk(dir, root, extRegex, files) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'fixtures') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, root, extRegex, files);
    } else if (entry.isFile()) {
      const rel = path.relative(root, fullPath).replace(/\\/g, '/');
      if (extRegex.test(entry.name)) {
        files.push(rel);
      }
    }
  }
}

export function listTestFiles(root) {
  const files = [];

  const setupDir = path.join(root, 'tests', 'setup');
  if (fs.existsSync(setupDir)) {
    const entries = fs.readdirSync(setupDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
        const fullPath = path.join(setupDir, entry.name);
        const rel = path.relative(root, fullPath).replace(/\\/g, '/');
        files.push(rel);
      }
    }
  }

  const appsDir = path.join(root, 'apps');
  if (fs.existsSync(appsDir)) {
    const apps = fs.readdirSync(appsDir, { withFileTypes: true });
    for (const app of apps) {
      if (app.isDirectory() && app.name !== 'node_modules') {
        const testDir = path.join(appsDir, app.name, 'test');
        walk(testDir, root, /\.test\.(ts|tsx)$/, files);
      }
    }
  }

  const packagesDir = path.join(root, 'packages');
  if (fs.existsSync(packagesDir)) {
    const pkgs = fs.readdirSync(packagesDir, { withFileTypes: true });
    for (const pkg of pkgs) {
      if (pkg.isDirectory() && pkg.name !== 'node_modules') {
        const testDir = path.join(packagesDir, pkg.name, 'test');
        walk(testDir, root, /\.test\.(ts|tsx)$/, files);
      }
    }
  }

  const filtered = files.filter(
    (f) => !f.includes('node_modules') && !f.startsWith('tests/setup/fixtures/'),
  );

  return filtered.sort();
}

export function selectTests({ files, lock, statuses, card }) {
  const lockMap = new Map();
  for (const entry of lock) {
    lockMap.set(entry.path, entry);
  }

  const run = [];
  const left = [];

  for (const file of files) {
    const entry = lockMap.get(file);
    if (!entry) {
      run.push(file);
    } else {
      const isDone = statuses.get(entry.card) === 'Done';
      const isCurrentCard = card != null && entry.card === card;
      if (isDone || isCurrentCard) {
        run.push(file);
      } else {
        left.push(file);
      }
    }
  }

  run.sort();
  left.sort();
  return { run, left };
}

export function packageOf(path) {
  if (typeof path !== 'string') return null;
  const normalized = path.replace(/\\/g, '/');
  const match = normalized.match(/^(apps|packages)\/([^/]+)\/.+/);
  return match ? `${match[1]}/${match[2]}` : null;
}
