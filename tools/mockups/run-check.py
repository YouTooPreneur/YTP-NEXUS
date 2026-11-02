"""Runs the screen check (tools/mockups/check.html) headless, in parts, and prints the problems (D-181).

The preview server must be running first (.claude/launch.json -> "tracker", port 8765).
Usage:  python tools/mockups/run-check.py            (every page)
        python tools/mockups/run-check.py 0 20       (pages 0 to 19 of the list)
        python tools/mockups/run-check.py --pages leads.html,deal.html
Prints "CHECKED n pages · m problems" per part and a total. Exit code 1 when any problem is found.
"""
import html
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

URL = 'http://localhost:8765/tools/mockups/check.html'
PART = 20


def browser():
    for p in [os.environ.get('EDGE', ''),
              r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
              r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
              r'C:\Program Files\Google\Chrome\Application\chrome.exe']:
        if p and os.path.exists(p):
            return p
    sys.exit('Microsoft Edge or Google Chrome not found (set EDGE to its path).')


def run(query):
    profile = tempfile.mkdtemp(prefix='nx-check-')
    try:
        out = subprocess.run([browser(), '--headless=new', '--disable-gpu', '--no-first-run', f'--user-data-dir={profile}',
                              '--virtual-time-budget=900000', '--dump-dom', f'{URL}?auto=1&{query}'],
                             capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=900).stdout
    finally:
        shutil.rmtree(profile, ignore_errors=True)
    head = re.search(r'id="result">([^<]*)<', out)
    out = out.split('<div id="out">', 1)[-1].split('<div id="stage">', 1)[0]
    rows = re.findall(r'<tr><td>(.*?)</td><td class="bad">(.*?)</td><td>(.*?)</td></tr>', out)
    return (head.group(1) if head else 'NO RESULT (the check did not finish)'), [tuple(html.unescape(c) for c in r) for r in rows]


def count_pages():
    page = urllib.request.urlopen(URL, timeout=10).read().decode('utf-8')
    block = page.split('window.PAGES = [', 1)[1].split('];', 1)[0]
    return len(re.findall(r"'([^']+\.html)'", block))


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    try:
        total = count_pages()
    except OSError:
        sys.exit('The preview server is not running: start "tracker" from .claude/launch.json (port 8765).')
    args = sys.argv[1:]
    if args[:1] == ['--pages']:
        parts = [f'pages={args[1]}']
    else:
        lo = int(args[0]) if args else 0
        hi = int(args[1]) if len(args) > 1 else total
        parts = [f'from={a}&to={min(a + PART, hi)}' for a in range(lo, hi, PART)]
    problems, ok = 0, True
    for q in parts:
        head, rows = run(q)
        print(f'[{q}] {head}')
        if not head.startswith('CHECKED'):
            ok = False
        for page, issue, where in rows:
            problems += 1
            print(f'  {page}: {issue}  [{where}]')
    print(f'TOTAL: {problems} problems' + ('' if ok else ' (some parts did not finish)'))
    return 1 if problems or not ok else 0


if __name__ == '__main__':
    sys.exit(main())
