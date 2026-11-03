"""Builds the review copy of the screens for the owner's senior (D-153, step 1.6).

    python tools/share/build-review.py [output folder]

Default output: <your Documents folder>/YTP Nexus Screen Review, plus a ZIP of it next to the folder.
It makes the same copy as tools/share/build-share.mjs (start page, every screen, screen notes, screen list,
tracker, design rules) and adds:
  - "Review comments.xlsx": one row per screen (from the preview home), with an Open link, a Decision list
    (OK / Change needed / Question), comments, priority and reviewer, a Summary tab that counts the answers
    per batch, and a "How to review" tab;
  - README.txt.
The folder is rebuilt each time, so a comment sheet saved inside it is replaced: ask the reviewer to send
the sheet back (or save it elsewhere) before rebuilding.
Needs Node.js and openpyxl (pip install openpyxl).
"""
import datetime as dt
import html
import re
import shutil
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Documents' / 'YTP Nexus Screen Review'
INK, WHITE = '1C3D36', 'FFFFFF'
WHO = {'O': 'Owner', 'M': 'Manager', 'A': 'Accounts', 'S': 'Staff', 'C': 'Client contact', 'St': 'Student', 'P': 'Public (no login)'}


def text(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def screens():
    """Batches and rows from the preview home source (the same list the viewer uses)."""
    src = (ROOT / 'docs/design/mockups/preview-hub.src.html').read_text(encoding='utf-8')
    out = []
    for sec in re.findall(r'<section class="batch">([\s\S]*?)</section>', src):
        title = text((re.search(r'<h2>([\s\S]*?)</h2>', sec) or [None, ''])[1])
        for row in re.findall(r'<div class="row">([\s\S]*?)</div></div>', sec):
            links = re.findall(r'<a [^>]*href="([^"]+)"[^>]*>', row)
            if not links:
                continue
            out.append({
                'batch': title,
                'id': text(re.search(r'<span class="id">([\s\S]*?)</span>', row).group(1)),
                'name': text(re.search(r'<b>([\s\S]*?)</b>', row).group(1)),
                'what': text((re.search(r'<span class="what">([\s\S]*?)</span>', row) or [None, ''])[1]),
                'href': links[0],
            })
    return out


def screen_list():
    """SCR id -> (who, build step) from docs/SCREENS.md."""
    info = {}
    for line in (ROOT / 'docs/SCREENS.md').read_text(encoding='utf-8').splitlines():
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) >= 7 and re.match(r'SCR-\d+$', cells[0]):
            who = cells[4]
            if re.fullmatch(r'(O|M|A|S|C|St|P)( (O|M|A|S|C|St|P))*', who):
                who = ', '.join(WHO[w] for w in who.split())
            info[cells[0]] = (who, cells[6])
        elif len(cells) == 5 and re.match(r'SCR-\d+$', cells[0]):  # documents table: ID, document, pattern, requirements, build
            info[cells[0]] = ('Document (PDF)', cells[4])
    return info


def workbook(rows, info, made):
    wb = Workbook()
    head_font, head_fill = Font(bold=True, color=WHITE), PatternFill('solid', fgColor=INK)

    guide = wb.active
    guide.title = 'How to review'
    lines = [
        ('YTP Nexus · screen review', True), ('', False),
        ('1. Open "START HERE.html" in this folder (Chrome or Edge), then "Open the screens" or "Screen viewer".', False),
        ('2. Go to the tab "Screens to review". Each row is one screen; click "Open" to see it.', False),
        ('3. In "Decision" choose OK, Change needed or Question, and write your comments.', False),
        ('4. Use "Priority" for changes that matter most. The "Summary" tab counts your answers by batch.', False),
        ('5. Save this file and send it back.', False), ('', False),
        ('Good to know', True),
        ('· All names, numbers and invoices are sample data; nothing is live.', False),
        ('· Keep this sheet inside the folder, or the "Open" links stop working.', False),
        ('· Computer screens are designed for a full-size screen; on a smaller window they shrink to fit.', False),
        ('· ✦ marks an AI helper. In the preview it explains what it would do.', False),
        ('· "Screen notes" on the start page explain what each screen does and why.', False), ('', False),
        (f'{len(rows)} rows: all {sum(1 for r in rows if r["id"].startswith("SCR-") or r["id"] == "Phone")} screens, '
         'plus a few extra views (for example a phone version or a client page). Copy made ' + made + '.', False),
    ]
    for i, (t, bold) in enumerate(lines, 1):
        c = guide.cell(row=i, column=1, value=t)
        c.font = Font(bold=bold, size=14 if i == 1 else 11, color=INK)
    guide.column_dimensions['A'].width = 110

    ws = wb.create_sheet('Screens to review')
    heads = ['#', 'Batch', 'Screen ID', 'Screen', 'What it shows', 'Who uses it', 'Build step', 'Open', 'Decision', 'Comments', 'Priority', 'Reviewed by']
    widths = [5, 30, 11, 30, 52, 18, 10, 8, 16, 50, 11, 16]
    for c, (h, w) in enumerate(zip(heads, widths), 1):
        cell = ws.cell(row=1, column=c, value=h)
        cell.font, cell.fill = head_font, head_fill
        ws.column_dimensions[cell.column_letter].width = w
    wrap = Alignment(wrap_text=True, vertical='top')
    for n, r in enumerate(rows, 1):
        who, step = info.get(r['id'], ('', ''))
        vals = [n, r['batch'], r['id'], r['name'], r['what'], who, step, 'Open', None, None, None, None]
        for c, v in enumerate(vals, 1):
            cell = ws.cell(row=n + 1, column=c, value=v)
            cell.alignment = wrap
        link = ws.cell(row=n + 1, column=8)
        link.hyperlink = 'docs/design/mockups/' + r['href']
        link.font = Font(color='0563C1', underline='single')
    last = len(rows) + 1
    ws.freeze_panes = 'E2'
    ws.auto_filter.ref = f'A1:L{last}'
    dv = DataValidation(type='list', formula1='"OK,Change needed,Question"', allow_blank=True)
    pr = DataValidation(type='list', formula1='"High,Medium,Low"', allow_blank=True)
    ws.add_data_validation(dv)
    ws.add_data_validation(pr)
    dv.add(f'I2:I{last}')
    pr.add(f'K2:K{last}')
    for word, colour in [('Change needed', 'F8EAE6'), ('Question', 'F6EEDB'), ('OK', 'E5F2EA')]:
        ws.conditional_formatting.add(f'A2:L{last}', FormulaRule(formula=[f'$I2="{word}"'], fill=PatternFill('solid', fgColor=colour, bgColor=colour)))

    sm = wb.create_sheet('Summary')
    heads = ['Batch', 'Screens', 'OK', 'Change needed', 'Question', 'Not reviewed yet']
    for c, h in enumerate(heads, 1):
        cell = sm.cell(row=1, column=c, value=h)
        cell.font, cell.fill = head_font, head_fill
        sm.column_dimensions[cell.column_letter].width = 40 if c == 1 else 16
    rng = f"'Screens to review'!$B$2:$B${last}"
    dec = f"'Screens to review'!$I$2:$I${last}"
    batches = list(dict.fromkeys(r['batch'] for r in rows))
    for i, b in enumerate(batches, 2):
        sm.cell(row=i, column=1, value=b)
        sm.cell(row=i, column=2, value=f'=COUNTIF({rng},A{i})')
        for c, word in [(3, 'OK'), (4, 'Change needed'), (5, 'Question')]:
            sm.cell(row=i, column=c, value=f'=COUNTIFS({rng},A{i},{dec},"{word}")')
        sm.cell(row=i, column=6, value=f'=B{i}-C{i}-D{i}-E{i}')
    t = len(batches) + 2
    sm.cell(row=t, column=1, value='Total').font = Font(bold=True)
    for c, col in enumerate('BCDEF', 2):
        sm.cell(row=t, column=c, value=f'=SUM({col}2:{col}{t - 1})').font = Font(bold=True)
    wb.active = 1
    return wb


def main():
    made = dt.date.today().strftime('%-d %b %Y') if sys.platform != 'win32' else dt.date.today().strftime('%#d %b %Y')
    subprocess.run(['node', str(ROOT / 'tools/share/build-share.mjs'), str(OUT)], check=True)
    rows = screens()
    path = OUT / 'Review comments.xlsx'
    workbook(rows, screen_list(), made).save(path)
    (OUT / 'README.txt').write_text(
        'YTP Nexus · screens and plan\n\n'
        'Double-click "START HERE.html" (opens in your browser).\n\n'
        'To review: open the screens (or the screen viewer), then write your comments in "Review comments.xlsx"\n'
        '(one row per screen, with an Open link). Save it and send it back.\n'
        'Keep the sheet inside this folder so its links keep working.\n\n'
        '- Clickable screens: docs/design/mockups/index.html\n'
        '- Screen viewer (every screen, previous and next): docs/design/mockups/viewer.html\n'
        '- Project tracker: tracker.html\n'
        '- Screen notes: docs/design/screens/\n'
        '- Comment sheet: Review comments.xlsx\n\n'
        f'Sample data only. Copy made {made}.\n', encoding='utf-8')
    zip_base = OUT.parent / OUT.name
    archive = shutil.make_archive(str(zip_base), 'zip', root_dir=OUT.parent, base_dir=OUT.name)
    size = Path(archive).stat().st_size / 1e6
    print(f'review copy: {OUT}')
    print(f'comment sheet: {len(rows)} rows')
    print(f'zip: {archive} ({size:.1f} MB)' + ('  (over Gmail\'s 25 MB limit: send by Drive or WhatsApp)' if size > 25 else ''))


if __name__ == '__main__':
    sys.exit(main())
