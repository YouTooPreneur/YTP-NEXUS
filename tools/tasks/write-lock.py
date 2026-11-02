"""Rebuild tests/LOCK: the fingerprints of every planner test and fixture file (TEST-PLAN section 3).

Run after the planner writes or changes tests:  python tools/tasks/write-lock.py

A planner test is a test file whose first line names its card and says "Written by the planner".
Fixture folders (tests/setup/fixtures/<name>/) belong to the card named in their README.md's first line.
Builders' own tests are never locked. The lock is planner-only; builders never edit it.
"""
from pathlib import Path
import hashlib
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
CARD = re.compile(r'TASK-\d{4}')
TEST_GLOBS = [
    'tests/setup/*.test.mjs',
    'tests/e2e/*.spec.ts',
    'apps/*/test/**/*.test.ts',
    'apps/*/test/**/*.test.tsx',
    'packages/*/test/**/*.test.ts',
    'packages/*/test/**/*.test.tsx',
]


def planner_tests():
    found = []
    for pattern in TEST_GLOBS:
        for path in ROOT.glob(pattern):
            if 'node_modules' in path.parts:
                continue
            first = path.read_text(encoding='utf-8').split('\n', 1)[0]
            match = CARD.search(first)
            if match and 'Written by the planner' in first:
                found.append((match.group(0), path))
    fixtures = ROOT / 'tests' / 'setup' / 'fixtures'
    if fixtures.exists():
        for folder in sorted(p for p in fixtures.iterdir() if p.is_dir()):
            readme = folder / 'README.md'
            match = CARD.search(readme.read_text(encoding='utf-8').split('\n', 1)[0]) if readme.exists() else None
            if not match:
                sys.exit(f'{folder.relative_to(ROOT).as_posix()}: README.md must name its card on the first line')
            for path in sorted(p for p in folder.rglob('*') if p.is_file()):
                found.append((match.group(0), path))
    return found


def main():
    rows = []
    for card, path in planner_tests():
        data = path.read_bytes()
        if b'\r\n' in data:
            sys.exit(f'{path.relative_to(ROOT).as_posix()} has Windows line endings; save it with LF only')
        rows.append((card, path.relative_to(ROOT).as_posix(), hashlib.sha256(data).hexdigest()))
    rows.sort(key=lambda r: (r[0], r[1]))
    lines = [
        '# Planner test lock (TEST-PLAN section 3). One line per planner test or fixture file:',
        '# TASK-ID  path  sha256. Written by the planner with tools/tasks/write-lock.py; builders never edit this file.',
        '',
    ] + [f'{card}  {path}  {digest}' for card, path, digest in rows]
    (ROOT / 'tests' / 'LOCK').write_text('\n'.join(lines) + '\n', encoding='utf-8', newline='\n')
    print(f'tests/LOCK written: {len(rows)} files')


if __name__ == '__main__':
    main()
