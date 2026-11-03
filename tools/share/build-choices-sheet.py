"""Builds the Excel answer sheet for the choices list (D-179), for the owner and the manager.

    python tools/share/build-choices-sheet.py

Reads docs/CHOICES-EXPLAINED.md (the plain-English guide, one block per choice) and the answers already given in
docs/CHOICES.md, and writes share/YTP Nexus - Choices answer sheet.xlsx:
  - "How to answer": what the choices are and how to fill the sheet;
  - "Choices": one row per choice, grouped by topic, with what Nexus does now, the other option, the suggestion,
    who should answer, and columns to fill in (Answer: Keep / Change / Not sure, what exactly, answered by, comments);
  - "Summary": how many are answered per topic.
Anyone can answer only the rows they are sure about; a blank row means Keep. Send the filled sheet back to Claude,
who copies the answers into docs/CHOICES.md and updates the screens and documents together.
Needs openpyxl (pip install openpyxl).
"""
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'docs' / 'CHOICES-EXPLAINED.md'
LIST = ROOT / 'docs' / 'CHOICES.md'
OUT = ROOT / 'share' / 'YTP Nexus - Choices answer sheet.xlsx'
INK, WHITE = '1C3D36', 'FFFFFF'


def plain(s):
    return re.sub(r'\*\*|`', '', s).strip()


def guide():
    """Topics and choice blocks from the guide: '## Topic', then '### 47 · Title', a suggestion line and a 2-column table."""
    topic, out = '', []
    for block in re.split(r'\n(?=## |### )', SRC.read_text(encoding='utf-8')):
        h2 = re.match(r'## (?:\d+\.\s*)?(.+)', block)
        if h2 and not block.startswith('### '):
            topic = h2.group(1).strip()
            continue
        h3 = re.match(r'### (\d+) · (.+)', block)
        if not h3:
            continue
        rows = dict((plain(a), plain(b)) for a, b in re.findall(r'^\|\s*\*\*([^|*]+)\*\*\s*\|\s*(.+?)\s*\|\s*$', block, flags=re.M))
        who = re.search(r'\*\*Who should answer:\*\*\s*([^·\n]+)', block)
        sug = re.search(r'\*\*Suggestion:\*\*\s*(.+)', block)
        out.append({'n': int(h3.group(1)), 'title': h3.group(2).strip(), 'topic': topic,
                    'now': rows.get('What Nexus does now', ''), 'other': rows.get('The other option', ''),
                    'who': plain(who.group(1)) if who else '', 'suggestion': plain(sug.group(1)) if sug else ''})
    return out


def answers():
    """Answers already written in docs/CHOICES.md (last column), by choice number."""
    got = {}
    for line in LIST.read_text(encoding='utf-8').splitlines():
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) >= 5 and cells[0].isdigit() and cells[-1]:
            got[int(cells[0])] = cells[-1]
    return got


def main():
    items = guide()
    if not items:
        sys.exit('No choices found in docs/CHOICES-EXPLAINED.md')
    done = answers()
    wb = Workbook()
    hf, hfill = Font(bold=True, color=WHITE), PatternFill('solid', fgColor=INK)
    wrap = Alignment(wrap_text=True, vertical='top')

    g = wb.active
    g.title = 'How to answer'
    lines = [
        ('YTP Nexus · choices to confirm', True, 14),
        ('', False, 11),
        ('What these are: while the 184 screens were being drawn, Claude had to pick many small things on its own, such as times, limits', False, 11),
        ('and who can see what. The screens already work that way. Before Nexus is built, someone who knows the business should confirm them.', False, 11),
        ('', False, 11),
        ('How to answer', True, 12),
        ('1. Read the guide "YTP Nexus - Choices explained (for the manager)" (Word file). Each choice has an example and what changes either way.', False, 11),
        ('2. In the tab "Choices", pick Keep, Change or Not sure in the Answer column. For Change, write what you want in the next column.', False, 11),
        ('3. Answer only the rows you are sure about. A blank row means Keep. "Who should answer" suggests who knows best.', False, 11),
        ('4. Write your name in "Answered by", save the file and send it back to the owner (or to Claude).', False, 11),
        ('', False, 11),
        ('Good to know', True, 12),
        ('· Most of these can still be changed later inside Nexus, without new building work. Nothing here is permanent.', False, 11),
        ('· Rows marked "CA must check" are tax or labour rules: ask the accountant before answering.', False, 11),
        ('· The names and amounts in the examples are sample data, not real clients.', False, 11),
        ('', False, 11),
        (f'{len(items)} choices, grouped by topic. {len(done)} already answered.', False, 11),
    ]
    for i, (t, b, size) in enumerate(lines, 1):
        g.cell(row=i, column=1, value=t).font = Font(bold=b, size=size, color=INK)
    g.column_dimensions['A'].width = 130

    ws = wb.create_sheet('Choices')
    heads = ['#', 'Topic', 'Choice', 'What Nexus does now', 'The other option', 'Suggestion', 'Who should answer',
             'Answer', 'If Change: what exactly?', 'Answered by', 'Comments']
    widths = [5, 24, 30, 56, 40, 40, 20, 13, 36, 16, 36]
    for c, (h, w) in enumerate(zip(heads, widths), 1):
        cell = ws.cell(row=1, column=c, value=h)
        cell.font, cell.fill = hf, hfill
        ws.column_dimensions[cell.column_letter].width = w
    for r, it in enumerate(items, 2):
        prev = done.get(it['n'], '')
        ans = 'Keep' if prev.lower().startswith('keep') else ('Change' if prev else None)
        vals = [it['n'], it['topic'], it['title'], it['now'], it['other'], it['suggestion'], it['who'], ans,
                prev if ans == 'Change' else None, None, None]
        for c, v in enumerate(vals, 1):
            ws.cell(row=r, column=c, value=v).alignment = wrap
    last = len(items) + 1
    ws.freeze_panes = 'D2'
    ws.auto_filter.ref = f'A1:K{last}'
    dv = DataValidation(type='list', formula1='"Keep,Change,Not sure"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f'H2:H{last}')
    for word, colour in [('Change', 'F8EAE6'), ('Not sure', 'F6EEDB'), ('Keep', 'E5F2EA')]:
        ws.conditional_formatting.add(f'A2:K{last}', FormulaRule(formula=[f'$H2="{word}"'], fill=PatternFill('solid', fgColor=colour, bgColor=colour)))

    sm = wb.create_sheet('Summary')
    heads = ['Topic', 'Choices', 'Keep', 'Change', 'Not sure', 'Not answered yet']
    for c, h in enumerate(heads, 1):
        cell = sm.cell(row=1, column=c, value=h)
        cell.font, cell.fill = hf, hfill
        sm.column_dimensions[cell.column_letter].width = 40 if c == 1 else 16
    rng, ansr = f"Choices!$B$2:$B${last}", f"Choices!$H$2:$H${last}"
    topics = list(dict.fromkeys(it['topic'] for it in items))
    for i, t in enumerate(topics, 2):
        sm.cell(row=i, column=1, value=t)
        sm.cell(row=i, column=2, value=f'=COUNTIF({rng},A{i})')
        for c, w in [(3, 'Keep'), (4, 'Change'), (5, 'Not sure')]:
            sm.cell(row=i, column=c, value=f'=COUNTIFS({rng},A{i},{ansr},"{w}")')
        sm.cell(row=i, column=6, value=f'=B{i}-C{i}-D{i}-E{i}')
    t = len(topics) + 2
    sm.cell(row=t, column=1, value='Total').font = Font(bold=True)
    for c, col in enumerate('BCDEF', 2):
        sm.cell(row=t, column=c, value=f'=SUM({col}2:{col}{t - 1})').font = Font(bold=True)
    wb.active = 1
    OUT.parent.mkdir(exist_ok=True)
    try:
        wb.save(OUT)
    except PermissionError:
        sys.exit(f'Close the sheet in Excel first, then run again: {OUT}')
    print(f'choices answer sheet: {len(items)} choices in {len(topics)} topics, {len(done)} already answered -> {OUT}')


if __name__ == '__main__':
    sys.exit(main())
