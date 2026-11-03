"""Puts the files to share into one folder in Downloads: the senior's review copy, the choices list (Word) and the preview.

    python tools/share/build-downloads.py

Run it after build-review.py, build-share.mjs and build-word.py. The folder "Downloads/YTP Nexus - to share" is replaced
each time, with a READ ME saying what to send to whom. Nothing private goes in it."""
import shutil
from datetime import date
import zipfile
from pathlib import Path

HOME = Path.home()
ROOT = Path(__file__).resolve().parents[2]
OUT = HOME / 'Downloads' / 'YTP Nexus - to share'
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

shutil.copy2(HOME / 'Documents/YTP Nexus Screen Review.zip', OUT / '1. For the senior - Screen review.zip')
shutil.copy2(ROOT / 'share/YTP Nexus - Choices to confirm.docx', OUT / '2. Choices - list and answers.docx')

src = HOME / 'Documents/YTP Nexus Preview'
dest = OUT / '3. Preview - all screens.zip'
with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(src.rglob('*')):
        if f.is_file():
            z.write(f, Path('YTP Nexus Preview') / f.relative_to(src))

note = f"""YTP Nexus - files to share ({date.today().strftime('%d %b %Y')})

1. For the senior - Screen review.zip
   Send this to your senior. Unzip it and open "START HERE" or index.html.
   All 184 screens, batch by batch; you and the senior approve them once.
   Comments go in "Review comments.xlsx" inside the folder; send that file back.

2. Choices - list and answers.docx
   Every small choice with your answer. The open ones are 100 to 106;
   blank means Keep.

3. Preview - all screens.zip
   For showing anyone the clickable screens. Unzip it and open index.html.

Nothing private is inside these files (no conversation, no passwords).
"""
(OUT / 'READ ME - what to send to whom.txt').write_text(note, encoding='utf-8')
for f in sorted(OUT.iterdir()):
    print(f'{f.stat().st_size / 1e6:6.1f} MB  {f.name}')
