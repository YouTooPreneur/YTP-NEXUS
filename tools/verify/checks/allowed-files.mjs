import { execFileSync } from 'node:child_process';

export function readAllowedFiles(cardMarkdown) {
  const lines = cardMarkdown.split(/\r?\n/);
  let afterHeading = false;
  let inTable = false;
  let headerSeen = false;
  let separatorSeen = false;
  const result = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!afterHeading) {
      if (/^##\s+ALLOWED FILES/i.test(line)) {
        afterHeading = true;
      }
      continue;
    }

    if (!line.includes('|')) {
      if (inTable) {
        break;
      }
      continue;
    }

    inTable = true;

    if (!headerSeen) {
      headerSeen = true;
      continue;
    }

    const rawCells = line.split('|');
    const cells = (
      rawCells[0].trim() === '' && rawCells.length > 1 ? rawCells.slice(1) : rawCells
    ).map((c) => c.trim());
    if (cells.length > 0 && cells[cells.length - 1] === '') {
      cells.pop();
    }

    if (!separatorSeen) {
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        separatorSeen = true;
        continue;
      }
    }

    if (cells.length > 0) {
      const firstCell = cells[0];
      const match = firstCell.match(/`([^`]+)`/);
      if (match) {
        result.push(match[1]);
      }
    }
  }

  return result;
}

export function readStartPoint(logMarkdown) {
  const match = logMarkdown.match(
    /^[ \t]*-[ \t]*Start point \(commit\):[ \t]*([0-9a-fA-F]{7,40})[ \t]*$/m,
  );
  return match ? match[1] : null;
}

export function matchesPattern(filePath, pattern) {
  const normPath = filePath.replace(/\\/g, '/');
  const normPattern = pattern.replace(/\\/g, '/');
  if (normPath === normPattern) return true;

  const escaped = normPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regexStr =
    '^' +
    escaped
      .replace(/\*\*/g, '§§GLOBSTAR§§')
      .replace(/\*/g, '[^/]*')
      .replace(/§§GLOBSTAR§§/g, '.*') +
    '$';

  return new RegExp(regexStr).test(normPath);
}

export const IGNORED_PATTERNS = ['history/**', 'share/**', 'tracker.html'];

export function builderFiles(card) {
  return [
    `docs/logs/${card}.md`,
    `docs/evidence/${card}/**`,
    'docs/STATUS.md',
    'docs/tasks/INDEX.md',
  ];
}

export function changedFiles(root, startCommit, card) {
  const git = (args) =>
    execFileSync('git', ['-c', 'core.quotepath=off', ...args], {
      cwd: root,
      encoding: 'utf8',
    });

  if (card) {
    const logOut = git(['log', '--no-merges', '--format=%H\t%s', `${startCommit}..HEAD`]);
    const lines = logOut.split(/\r?\n/).filter(Boolean);
    const matchingCommits = [];
    const prefix = `${card}:`;
    for (const line of lines) {
      const tabIdx = line.indexOf('\t');
      if (tabIdx !== -1) {
        const hash = line.slice(0, tabIdx).trim();
        const subject = line.slice(tabIdx + 1).trim();
        if (subject.startsWith(prefix)) {
          matchingCommits.push(hash);
        }
      }
    }

    if (matchingCommits.length > 0) {
      const files = new Set();
      for (const commit of matchingCommits) {
        const out = git(['diff-tree', '--no-commit-id', '--name-only', '-r', commit]);
        for (const file of out.split(/\r?\n/).filter(Boolean)) {
          files.add(file.replace(/\\/g, '/').trim());
        }
      }
      return Array.from(files).sort();
    }
  }

  const files = new Set();
  const diffOut = git(['diff', '--name-only', '--no-renames', startCommit]);
  for (const file of diffOut.split(/\r?\n/).filter(Boolean)) {
    files.add(file.replace(/\\/g, '/').trim());
  }

  const untrackedOut = git(['ls-files', '--others', '--exclude-standard']);
  for (const file of untrackedOut.split(/\r?\n/).filter(Boolean)) {
    files.add(file.replace(/\\/g, '/').trim());
  }

  return Array.from(files).sort();
}

export function checkAllowedFiles({ changed, allowed, card }) {
  const allowedPatterns = [
    ...(allowed || []),
    ...IGNORED_PATTERNS,
    ...(card ? builderFiles(card) : []),
  ];
  const violations = [];

  for (const file of changed) {
    const isAllowed = allowedPatterns.some((pattern) => matchesPattern(file, pattern));
    if (!isAllowed) {
      violations.push(file);
    }
  }

  return violations.sort();
}

export function commitProblems(root, startCommit) {
  const git = (args, options = {}) =>
    execFileSync('git', ['-c', 'core.quotepath=off', ...args], {
      cwd: root,
      encoding: 'utf8',
      ...options,
    });

  let hasMain = false;
  try {
    git(['rev-parse', '--verify', '--quiet', 'refs/heads/main'], { stdio: 'pipe' });
    hasMain = true;
  } catch {
    // main branch does not exist
  }

  const logArgs = ['log', '--no-merges', '--reverse', '--format=%h%x09%s', `${startCommit}..HEAD`];
  if (hasMain) {
    logArgs.push('--not', 'main');
  }
  logArgs.push('--');

  const out = git(logArgs);
  const lines = out.split(/\r?\n/).filter(Boolean);
  const problems = [];

  for (const line of lines) {
    const tabIdx = line.indexOf('\t');
    if (tabIdx === -1) continue;
    const hash = line.slice(0, tabIdx).trim();
    const subject = line.slice(tabIdx + 1).trim();
    if (!/^TASK-\d{4}:/.test(subject)) {
      problems.push(`commit not named for a card: ${hash} ${subject}`);
    }
  }

  return problems;
}
