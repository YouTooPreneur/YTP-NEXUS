"""Check a builder's copy against tests/LOCK: every locked planner test and fixture is unchanged, and the card's commits touch no test.

Run in the copy being reviewed (the builder's worktree, or a clone that has the base branch):
    python <this file> [folder] [base]
The folder defaults to the current one and the base to `main`. In a single-branch clone of a task branch,
pass the card's start commit (from its log) as the base.
Exit codes: 0 everything matches; 1 a locked file changed or a test was touched (always wins);
2 the check could not run (no tests/LOCK in the folder, or the base cannot be found).
Planner tool for reviews; until TASK-0009 builds the real test-lock check into `pnpm verify`.
"""
from pathlib import Path
import hashlib
import subprocess
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
base = sys.argv[2] if len(sys.argv) > 2 else 'main'
lock = root / 'tests' / 'LOCK'
if not lock.exists():
    print(f'cannot check: no tests/LOCK in {root}')
    sys.exit(2)

problems = 0
checked = 0
for line in lock.read_text(encoding='utf-8').splitlines():
    parts = line.split()
    if len(parts) != 3 or not parts[0].startswith('TASK-'):
        continue
    _card, path, want = parts
    checked += 1
    file = root / path
    if not file.exists():
        print('MISSING', path)
        problems += 1
    elif hashlib.sha256(file.read_bytes()).hexdigest() != want:
        print('CHANGED', path)
        problems += 1

diff = subprocess.run(['git', '-C', str(root), 'diff', '--name-only', '--no-renames', f'{base}...HEAD'],
                      capture_output=True, text=True)
if diff.returncode != 0:
    print(f'lock entries checked: {checked}, problems: {problems}; cannot compare with "{base}": {diff.stderr.strip()}')
    sys.exit(1 if problems else 2)
touched = [f for f in diff.stdout.split() if f == 'tests/LOCK' or f.startswith('tests/') or '/test/' in f]
print(f'lock entries checked: {checked}, problems: {problems}, test files touched since {base}: {touched or "none"}')
sys.exit(1 if problems or touched else 0)
