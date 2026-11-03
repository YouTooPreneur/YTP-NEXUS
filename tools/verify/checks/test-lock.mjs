import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function sha256Of(filePath) {
  const bytes = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(bytes).digest('hex').toLowerCase();
}

export function checkTestLock(root, entries) {
  const problems = [];
  const counts = new Map();
  for (const entry of entries) {
    counts.set(entry.path, (counts.get(entry.path) || 0) + 1);
  }

  for (const [p, count] of counts) {
    if (count > 1) {
      problems.push(`listed twice: ${p}`);
    }
  }

  for (const entry of entries) {
    const fullPath = path.join(root, entry.path);
    if (!fs.existsSync(fullPath)) {
      const msg = `missing: ${entry.path}`;
      if (!problems.includes(msg)) {
        problems.push(msg);
      }
    } else {
      const actual = sha256Of(fullPath);
      if (actual !== entry.sha256) {
        const msg = `changed: ${entry.path}`;
        if (!problems.includes(msg)) {
          problems.push(msg);
        }
      }
    }
  }

  return problems;
}
