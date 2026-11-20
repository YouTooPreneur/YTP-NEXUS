"""Find files that are entirely zero bytes (damaged by an interrupted write), without printing any content.
Usage: python zero-scan.py <folder> [--skip-node-modules]"""
import os
import sys
from pathlib import Path

root = Path(sys.argv[1])
skip_nm = '--skip-node-modules' in sys.argv
damaged = []
checked = 0
for folder, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if d != '.git' and not (skip_nm and d == 'node_modules')]
    for name in files:
        path = Path(folder) / name
        try:
            size = path.stat().st_size
            if size == 0 or size > 20_000_000:
                continue
            with open(path, 'rb') as handle:
                data = handle.read()
        except OSError:
            continue
        checked += 1
        if data.count(0) == len(data):
            damaged.append((str(path.relative_to(root)), size))
print(f'checked {checked} files under {root}')
for rel, size in damaged:
    print(f'ALL ZERO: {rel} ({size} bytes)')
if not damaged:
    print('no all-zero files')
