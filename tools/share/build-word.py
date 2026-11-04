"""Builds Word (.docx) copies of every project document for sharing on WhatsApp (D-178).

The Markdown files in docs/ stay the single source of truth (AI coders read them).
This script turns each one into an editable Word file in share/. Never edit the
Word files expecting the change to stick: send the edited file back to Claude,
who updates the Markdown source and rebuilds.

Covers docs/*.md, the design documents (docs/design/*.md), the screen notes
(docs/design/screens/*.md) and the review files (docs/review/*.md). Word copies
whose document no longer exists are removed.

Run from anywhere:  python tools/share/build-word.py
Uses only the Python standard library. The way of building follows the owner's
Dharsha project (process only).
"""
import re
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'share'
PREFIX = 'YTP Nexus - '
SOURCES = ['docs/*.md', 'docs/design/*.md', 'docs/design/screens/*.md', 'docs/review/*.md', 'docs/tasks/LANES.md']
NAMES = {
    'docs/tasks/LANES.md': 'Lanes (careful or fast, per card)',
    'docs/STATUS.md': 'Status',
    'docs/PLAN.md': 'Process (plan)',
    'docs/DECISIONS.md': 'Decisions',
    'docs/RAW-REQUIREMENTS.md': 'Raw requirements',
    'docs/SCOPE.md': 'Scope',
    'docs/ESTIMATE.md': 'Hours estimate',
    'docs/REQUIREMENTS.md': 'Requirements',
    'docs/TECH-DESIGN.md': 'Tech design',
    'docs/DATA-MODEL.md': 'Data model',
    'docs/RELEASES.md': 'Releases (18 small releases)',
    'docs/SCREENS.md': 'Screen list',
    'docs/CHANGES.md': 'Change requests',
    'docs/QUESTIONS.md': 'AI questions',
    'docs/CHOICES.md': 'Choices to confirm',
    'docs/CHOICES-EXPLAINED.md': 'Choices explained (for the manager)',
    'docs/HANDOVER.md': 'Handover (continue anywhere)',
    'docs/NEW-LAPTOP.md': 'Moving to another laptop',
    'docs/design/DESIGN-RULES.md': 'Design rules (colours, fonts, versions)',
    'docs/design/STYLE-PROMPTS.md': 'Style prompts (round 1)',
    'docs/design/STYLE-PROMPTS-ROUND2.md': 'Style prompts (round 2)',
    'docs/design/STYLE-REVIEW.md': 'Style review (round 1)',
    'docs/review/ROUND-16-CHANGE-LIST.md': 'Round 16 change list',
    'docs/review/ROUND-16-APPLIED.md': 'Round 16 applied',
}


def word_name(rel):
    if rel in NAMES:
        return NAMES[rel]
    m = re.match(r'docs/design/screens/BATCH-(\d+)\.md$', rel)
    if m:
        return f'Screen notes, batch {m.group(1)}'
    return Path(rel).stem.replace('-', ' ').title()
PAGE_W = 9638  # A4 width minus 2 cm margins, in twips
W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' \
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'


class Doc:
    def __init__(self):
        self.body = []
        self.links = []          # external hyperlink targets
        self.lists = 0           # numbered-list instances (restart numbering)

    # ---------- inline text ----------
    def runs(self, text, base=''):
        out = []
        pattern = re.compile(r'(\*\*[^*]+\*\*|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)\s]+\))')
        for part in pattern.split(text):
            if not part:
                continue
            if part.startswith('**') and part.endswith('**'):
                out.append(self.run(part[2:-2], base + '<w:b/>'))
            elif part.startswith('`') and part.endswith('`'):
                out.append(self.run(part[1:-1], base, code=True))
            elif part.startswith('~~') and part.endswith('~~'):
                out.append(self.run(part[2:-2], base + '<w:strike/>'))
            elif part.startswith('['):
                m = re.match(r'\[([^\]]+)\]\(([^)\s]+)\)', part)
                label, url = m.group(1).strip('`'), m.group(2)
                if url.startswith('http'):
                    self.links.append(url)
                    rid = f'rIdL{len(self.links)}'
                    out.append(f'<w:hyperlink r:id="{rid}">' + self.run(label, base, link=True) + '</w:hyperlink>')
                else:
                    out.append(self.run(label, base))
            else:
                out.append(self.run(part, base))
        return ''.join(out)

    @staticmethod
    def run(text, props='', code=False, link=False):
        fonts = '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>' if code else ''
        bold = '<w:b/>' if '<w:b/>' in props else ''
        strike = '<w:strike/>' if '<w:strike/>' in props else ''
        color = '<w:color w:val="0563C1"/>' if link else ''
        size = '<w:sz w:val="19"/>' if code else ''
        underline = '<w:u w:val="single"/>' if link else ''
        shade = '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>' if code else ''
        rpr = fonts + bold + strike + color + size + underline + shade
        return f'<w:r>{"<w:rPr>" + rpr + "</w:rPr>" if rpr else ""}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'

    # ---------- blocks ----------
    def para(self, text, style=None, num=None, keep=False):
        ppr = ''
        if style:
            ppr += f'<w:pStyle w:val="{style}"/>'
        if keep:
            ppr += '<w:keepNext/>'
        if num:
            ppr += f'<w:numPr><w:ilvl w:val="{num[1]}"/><w:numId w:val="{num[0]}"/></w:numPr>'
        self.body.append(f'<w:p>{"<w:pPr>" + ppr + "</w:pPr>" if ppr else ""}{self.runs(text)}</w:p>')

    def code(self, lines):
        for line in lines or ['']:
            self.body.append('<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr>' + self.run(line, code=True) + '</w:p>')

    def table(self, head, rows):
        cols = max([len(head)] + [len(r) for r in rows])
        head = head + [''] * (cols - len(head))
        rows = [r + [''] * (cols - len(r)) for r in rows]
        weights = []
        for c in range(cols):
            longest = max(len(re.sub(r'[*`]', '', r[c])) for r in [head] + rows)
            weights.append(min(max(longest, 6), 60))
        total = sum(weights)
        widths = [max(int(PAGE_W * w / total), 700) for w in weights]
        grid = ''.join(f'<w:gridCol w:w="{w}"/>' for w in widths)
        border = 'w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"'
        tblpr = ('<w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>'
                 f'<w:top {border}/><w:left {border}/><w:bottom {border}/><w:right {border}/>'
                 f'<w:insideH {border}/><w:insideV {border}/></w:tblBorders><w:tblLayout w:type="autofit"/>'
                 '<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/>'
                 '<w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>')
        xml = [f'<w:tbl>{tblpr}<w:tblGrid>{grid}</w:tblGrid>']
        for i, row in enumerate([head] + rows):
            header = i == 0
            trpr = '<w:trPr><w:tblHeader/></w:trPr>' if header else ''
            cells = []
            for c, text in enumerate(row):
                shade = '<w:shd w:val="clear" w:color="auto" w:fill="E6F2EE"/>' if header else ''
                content = self.runs(text, '<w:b/>' if header else '')
                cells.append(f'<w:tc><w:tcPr><w:tcW w:w="{widths[c]}" w:type="dxa"/>{shade}</w:tcPr>'
                             f'<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>{content}</w:p></w:tc>')
            xml.append(f'<w:tr>{trpr}{"".join(cells)}</w:tr>')
        xml.append('</w:tbl>')
        self.body.append(''.join(xml))
        self.body.append('<w:p/>')

    def new_list(self):
        self.lists += 1
        return 100 + self.lists


def is_row(line):
    return bool(re.match(r'^\s*\|.*\|\s*$', line or ''))


def is_sep(line):
    return bool(re.match(r'^\s*\|(\s*:?-{2,}:?\s*\|)+\s*$', line or ''))


def cells(line):
    # split on unescaped pipes; a "\|" inside a cell stays as a pipe character
    parts = re.split(r'(?<!\\)\|', line.strip()[1:-1])
    return [c.strip().replace('\\|', '|') for c in parts]


def convert(md):
    doc = Doc()
    lines = md.replace('\r\n', '\n').split('\n')
    i, title_done, numbered = 0, False, None
    while i < len(lines):
        line = lines[i]
        if line.startswith('```'):
            buf = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                buf.append(lines[i])
                i += 1
            i += 1
            doc.code(buf)
            numbered = None
            continue
        if is_row(line) and is_sep(lines[i + 1] if i + 1 < len(lines) else ''):
            head = cells(line)
            i += 2
            rows = []
            while i < len(lines) and is_row(lines[i]):
                rows.append(cells(lines[i]))
                i += 1
            doc.table(head, rows)
            numbered = None
            continue
        h = re.match(r'^(#{1,4})\s+(.*)$', line)
        if h:
            level = len(h.group(1))
            if level == 1 and not title_done:
                doc.para(h.group(2), 'Title')
                title_done = True
            else:
                doc.para(h.group(2), f'Heading{min(level, 3)}', keep=True)
            numbered = None
            i += 1
            continue
        cb = re.match(r'^(\s*)[-*]\s+\[( |x|X)\]\s+(.*)$', line)
        ul = re.match(r'^(\s*)[-*]\s+(.*)$', line)
        ol = re.match(r'^(\s*)\d+\.\s+(.*)$', line)
        if cb:
            mark = '☑ ' if cb.group(2) != ' ' else '☐ '
            doc.para(mark + cb.group(3))
            i += 1
            continue
        if ul:
            doc.para(ul.group(2), num=(1, 1 if len(ul.group(1)) >= 2 else 0))
            i += 1
            continue
        if ol:
            if numbered is None:
                numbered = doc.new_list()
            doc.para(ol.group(2), num=(numbered, 1 if len(ol.group(1)) >= 2 else 0))
            i += 1
            continue
        if line.strip() == '':
            numbered = None
            i += 1
            continue
        if re.match(r'^\s*>', line):
            doc.para(re.sub(r'^\s*>\s?', '', line), 'Quote')
            i += 1
            continue
        buf = [line.strip()]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#{1,4}\s|\s*[-*]\s|\s*\d+\.\s|```|\s*\|)', lines[i]):
            buf.append(lines[i].strip())
            i += 1
        doc.para(' '.join(buf))
        numbered = None
    return doc


STYLES = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles {W}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="en-IN"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="200"/></w:pPr><w:rPr><w:b/><w:color w:val="1C3D36"/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="1C3D36"/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="100"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="1C3D36"/><w:sz w:val="27"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:color w:val="1C3D36"/><w:sz w:val="23"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="17"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360"/></w:pPr><w:rPr><w:i/><w:color w:val="5D6763"/></w:rPr></w:style>
</w:styles>'''


def numbering(doc):
    lvl = lambda i, fmt, text, left: (f'<w:lvl w:ilvl="{i}"><w:start w:val="1"/><w:numFmt w:val="{fmt}"/>'
                                     f'<w:lvlText w:val="{text}"/><w:lvlJc w:val="left"/>'
                                     f'<w:pPr><w:ind w:left="{left}" w:hanging="300"/></w:pPr></w:lvl>')
    bullets = ('<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>'
               + lvl(0, 'bullet', '•', 360) + lvl(1, 'bullet', '◦', 720) + '</w:abstractNum>')
    decimal = ('<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>'
               + lvl(0, 'decimal', '%1.', 360) + lvl(1, 'decimal', '%2.', 720) + '</w:abstractNum>')
    nums = '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>'
    for n in range(1, doc.lists + 1):
        nums += (f'<w:num w:numId="{100 + n}"><w:abstractNumId w:val="1"/>'
                 '<w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>')
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:numbering {W}>{bullets}{decimal}{nums}</w:numbering>'


def write_docx(doc, path, title, note=True):
    if note:
        built = datetime.now().strftime('%d %b %Y, %H:%M')
        doc.para(f'Copy of the project file, built {built}. Edits here do not change the source; send the edited file to Claude.', 'Quote')
    document = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document {W}><w:body>'
                + ''.join(doc.body)
                + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" '
                  'w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>')
    rels = ['<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
            '<Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>']
    for n, url in enumerate(doc.links, 1):
        rels.append(f'<Relationship Id="rIdL{n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" '
                    f'Target="{escape(url, {chr(34): "&quot;"})}" TargetMode="External"/>')
    doc_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + ''.join(rels) + '</Relationships>')
    root_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
                 '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
                 '</Relationships>')
    content_types = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                     '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                     '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                     '<Default Extension="xml" ContentType="application/xml"/>'
                     '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
                     '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
                     '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
                     '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
                     '</Types>')
    core = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            f'<dc:title>{escape(title)}</dc:title><dc:creator>YouTooPreneur</dc:creator></cp:coreProperties>')
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', root_rels)
        z.writestr('docProps/core.xml', core)
        z.writestr('word/document.xml', document)
        z.writestr('word/_rels/document.xml.rels', doc_rels)
        z.writestr('word/styles.xml', STYLES)
        z.writestr('word/numbering.xml', numbering(doc))


def main():
    OUT.mkdir(exist_ok=True)
    built, skipped, wanted = [], [], set()
    for pattern in SOURCES:
        for src in sorted(ROOT.glob(pattern)):
            rel = src.relative_to(ROOT).as_posix()
            title = PREFIX + word_name(rel)
            wanted.add(f'{title}.docx')
            doc = convert(src.read_text(encoding='utf-8'))
            try:
                write_docx(doc, OUT / f'{title}.docx', title)
                built.append(title)
            except PermissionError:
                skipped.append(title)
    removed = []
    for old in sorted(OUT.glob(PREFIX + '*.docx')):
        if old.name not in wanted:
            try:
                old.unlink()
                removed.append(old.name)
            except PermissionError:
                skipped.append(old.stem)
    print(f'share/: {len(built)} Word files built')
    for t in built:
        print(' -', t + '.docx')
    for t in removed:
        print(' x removed (its document no longer exists):', t)
    for t in skipped:
        print(f' ! skipped (open in another program, close it and run again): {t}.docx')


if __name__ == '__main__':
    sys.exit(main())
