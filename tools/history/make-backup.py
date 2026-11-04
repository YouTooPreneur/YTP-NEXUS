"""Makes one dated ZIP of a project folder, to keep off this PC (Google Drive, a pen drive) (YTP Nexus, D-175).

  python tools/history/make-backup.py                      this project
  python tools/history/make-backup.py C:/path/to/folder  any other folder
  python tools/history/make-backup.py --with-git           the carry ZIP for another laptop (D-198)

The ZIP goes next to the folder, named with the date and time (24-hour, so they sort in order),
e.g. Downloads/YTP-SAAS-backup-2026-10-21_11-30.zip = 21 Oct 2026, 11:30 am.
With --with-git it also holds the save history (.git), so the copy can save and upload on its own,
and is named YTP-SAAS-carry-<date>.zip; docs/NEW-LAPTOP.md says how to use it.
It includes history/ (the private conversation), so share it with nobody. Uses only the Python standard library.
"""
import os
import sys
import zipfile
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WITH_GIT = '--with-git' in sys.argv
ARGS = [a for a in sys.argv[1:] if a != '--with-git']
SKIP = {'__pycache__', 'node_modules'} | (set() if WITH_GIT else {'.git'})


def main():
    src = os.path.abspath(ARGS[0]) if ARGS else ROOT
    name = os.path.basename(src)
    now = datetime.now()
    kind = 'carry' if WITH_GIT else 'backup'
    out = os.path.join(os.path.dirname(src), f'{name}-{kind}-{now:%Y-%m-%d_%H-%M}.zip')
    count = 0
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for folder, dirs, files in os.walk(src):
            dirs[:] = [d for d in dirs if d not in SKIP]
            for f in files:
                p = os.path.join(folder, f)
                z.write(p, os.path.join(name, os.path.relpath(p, src))); count += 1
    print(f'Backup made {now:%d %b %Y, %I:%M %p}: {out} ({count} files, {os.path.getsize(out) // 2**20} MB). Upload it to Google Drive or copy it off this PC.')


if __name__ == '__main__':
    main()
