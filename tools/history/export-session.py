"""Saves this project's Claude sessions inside the project folder (YTP Nexus, D-175; the idea comes from the Dharsha project's process).

Claude Code keeps each session only on the PC it ran on (in ~/.claude/projects/). This script copies
everything into history/ so the work continues on any PC, session or account:

  history/LATEST.md                where the last session stopped (loaded by CLAUDE.md in every new session)
  history/MEMORY-ALL.md            all of Claude's memory notes in one file (also loaded by CLAUDE.md)
  history/conversation.md          the whole conversation, readable (messages and replies, tool steps in one line)
  history/conversation.json        the same, for the tracker's History tab
  history/requests.md              every message from the owner, numbered, with date and time
  history/memory/                  Claude's memory notes, one file each
  history/sessions/<id>.jsonl.gz   the complete record: every message, tool call and result
                                   (pictures are kept as files in <id>-images/ so no file gets too big for GitHub)
  history/sessions/<id>-extras/    big tool results and other files Claude saved for that session
  history/sessions/<id>-helpers/   the working notes of every helper (subagent) Claude started in that session,
                                   compressed, with their pictures stored once in <id>-images/ (owner's choice, 21 Oct 2026)

It runs by itself after every reply and when a session ends (hooks in .claude/settings.json), and can be run by hand:
  python tools/history/export-session.py               save now and print a summary
  python tools/history/export-session.py --restore     on a new PC: put sessions and memory back where Claude Code looks
Uses only the Python standard library (Node.js is used, if installed, to rebuild tracker.html afterwards).
"""
import base64
import gzip
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'history')
IST = timezone(timedelta(hours=5, minutes=30))
PROJECTS = os.path.join(os.path.expanduser('~'), '.claude', 'projects')
NOTES = re.compile(r"<(system-reminder|artifact-view-context)[^>]*>.*?</(system-reminder|artifact-view-context)>", re.S)  # app notes, not the owner's words
EXT = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp'}
LATEST_CHARS = 24000  # about the last 10-15 exchanges
# Lines the app writes in Claude's place (usage limit, API error, empty turn): kept in the conversation, never used as "the answer".
SYNTHETIC = re.compile(r"^(No response requested\.|You've hit your (session|usage) limit|Your usage limit has been reached|API Error)")


def session_dirs():
    """Claude names a project's folder after its path; also accept a folder moved or copied elsewhere."""
    if not os.path.isdir(PROJECTS):
        return []
    mine = re.sub(r'[^A-Za-z0-9]', '-', ROOT)
    return [os.path.join(PROJECTS, d) for d in sorted(os.listdir(PROJECTS))
            if d == mine or d.endswith('-' + os.path.basename(ROOT))]


def when(ts):
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00')).astimezone(IST).strftime('%a %d %b %Y, %I:%M %p IST')
    except Exception:
        return ts or ''


def write(path, text):
    """Write to a temporary file first, so a reader never sees half a file."""
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(text)
    os.replace(tmp, path)


def user_text(content):
    if isinstance(content, str):
        return NOTES.sub('', content).strip()
    parts = []
    for b in content or []:
        if b.get('type') == 'text':
            parts.append(NOTES.sub('', b.get('text', '')).strip())
        elif b.get('type') == 'image':
            parts.append('[image attached]')
    return '\n'.join(p for p in parts if p)


def tool_line(b):
    i = b.get('input', {}) or {}
    if b.get('name') == 'AskUserQuestion' and isinstance(i.get('questions'), list):  # keep the questions, not just the tool name
        qs = [f"{q.get('question', '')} ({' / '.join(o.get('label', '') for o in q.get('options') or [])})" for q in i['questions']]
        return 'Question to the owner: ' + ' · '.join(qs)[:900]
    what = i.get('description') or i.get('file_path') or i.get('url') or i.get('pattern') or i.get('query') or i.get('action') or ''
    if not what and isinstance(i.get('command'), str):
        what = i['command'].splitlines()[0][:120]
    return f"{b.get('name', 'tool')}: {str(what)[:160]}"


def read_session(jsonl, sid):
    """The conversation as a list of items: owner messages, Claude replies (with their tool steps) and summaries."""
    items = []
    asked = set()  # ids of question-tool calls, so their answers can be shown
    opener = (lambda: gzip.open(jsonl, 'rt', encoding='utf-8')) if jsonl.endswith('.gz') else (lambda: open(jsonl, encoding='utf-8'))
    with opener() as f:
        for raw in f:
            try:
                o = json.loads(raw)
            except ValueError:
                continue
            if o.get('isSidechain'):
                continue
            t = o.get('type'); m = o.get('message') or {}; ts = o.get('timestamp')
            if t == 'user':
                c = m.get('content')
                if isinstance(c, list) and any(b.get('type') == 'tool_result' for b in c):
                    for b in c:  # the owner's answers to a question round
                        if b.get('type') == 'tool_result' and b.get('tool_use_id') in asked and items:
                            r = b.get('content')
                            r = r if isinstance(r, str) else ' '.join(x.get('text', '') for x in r or [] if isinstance(x, dict))
                            items[-1]['steps'].append('Owner answered: ' + ' '.join(r.split())[:900])
                    continue
                text = user_text(c)
                if not text or text.startswith(('<command-', '<local-command', '<task-notification', '[Request interrupted')):
                    continue
                if o.get('isCompactSummary'):
                    items.append({'role': 'summary', 'at': ts, 'text': text, 'steps': [], 'session': sid})
                elif not o.get('isMeta'):
                    items.append({'role': 'owner', 'at': ts, 'text': text, 'steps': [], 'session': sid})
            elif t == 'assistant':
                for b in m.get('content') or []:
                    last = items[-1] if items else None
                    if b.get('type') == 'text' and b.get('text', '').strip():
                        if last and last['role'] == 'claude' and not last['steps']:
                            last['text'] += '\n\n' + b['text'].strip()
                        else:
                            items.append({'role': 'claude', 'at': ts, 'text': b['text'].strip(), 'steps': [], 'session': sid})
                    elif b.get('type') == 'tool_use':
                        if b.get('name') == 'AskUserQuestion':
                            asked.add(b.get('id'))
                        if not last or last['role'] != 'claude':
                            items.append({'role': 'claude', 'at': ts, 'text': '', 'steps': [], 'session': sid})
                        items[-1]['steps'].append(tool_line(b))
    return items


def archive(jsonl, sid):
    """Gzipped copy of the session with each picture moved to its own file (named by its content). Skipped if unchanged."""
    gz = os.path.join(OUT, 'sessions', sid + '.jsonl.gz'); stamp = gz + '.stamp'
    mark = f'{os.path.getsize(jsonl)}:{os.path.getmtime(jsonl)}'
    if os.path.exists(gz) and os.path.exists(stamp) and open(stamp).read() == mark:
        return
    pack(jsonl, gz, os.path.join(OUT, 'sessions', sid + '-images'))
    open(stamp, 'w').write(mark)


def archive_helpers(folder, sid):
    """The helpers' working notes (subagents/) of one session, each file compressed and its pictures stored once,
    so a new PC has every detail. Only files that changed since the last save are packed again."""
    dest = os.path.join(OUT, 'sessions', sid + '-helpers')
    imgdir = os.path.join(OUT, 'sessions', sid + '-images')
    listf = os.path.join(dest, '.packed.json')
    try:
        packed = json.load(open(listf, encoding='utf-8'))
    except (OSError, ValueError):
        packed = {}
    changed = False
    for base, _, files in os.walk(folder):
        for name in files:
            src = os.path.join(base, name)
            rel = os.path.relpath(src, folder).replace(os.sep, '/')
            mark = f'{os.path.getsize(src)}:{os.path.getmtime(src)}'
            if packed.get(rel) == mark:
                continue
            out = os.path.join(dest, rel)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            if name.endswith('.jsonl'):
                pack(src, out + '.gz', imgdir)
            else:
                shutil.copy2(src, out)  # small files: meta, prefix
            packed[rel] = mark; changed = True
    if changed:
        os.makedirs(dest, exist_ok=True)
        write(listf, json.dumps(packed, indent=0))


def pack(jsonl, gz, imgdir):
    """Gzip a .jsonl file, moving every picture to its own file in imgdir (named by its content, so each is kept once)."""
    os.makedirs(imgdir, exist_ok=True)

    def strip(x):
        if isinstance(x, dict):
            if x.get('type') == 'base64' and isinstance(x.get('data'), str) and len(x['data']) > 200:
                name = hashlib.sha1(x['data'].encode()).hexdigest()[:20] + '.' + EXT.get(x.get('media_type'), 'bin')
                path = os.path.join(imgdir, name)
                if not os.path.exists(path):
                    with open(path, 'wb') as f:
                        f.write(base64.b64decode(x['data']))
                return {**x, 'data': '@file:' + name}
            return {k: strip(v) for k, v in x.items()}
        if isinstance(x, list):
            return [strip(v) for v in x]
        return x

    with open(jsonl, encoding='utf-8') as src, gzip.open(gz + '.tmp', 'wt', encoding='utf-8', compresslevel=6) as dst:
        for raw in src:
            try:
                dst.write(json.dumps(strip(json.loads(raw)), ensure_ascii=False) + '\n')
            except ValueError:
                dst.write(raw)
    os.replace(gz + '.tmp', gz)


def restore():
    """New PC: rebuild each session file (pictures put back) and the memory notes where Claude Code looks."""
    target = os.path.join(PROJECTS, re.sub(r'[^A-Za-z0-9]', '-', ROOT))
    os.makedirs(target, exist_ok=True)
    sdir = os.path.join(OUT, 'sessions')
    for name in sorted(os.listdir(sdir)):
        if not name.endswith('.jsonl.gz'):
            continue
        sid = name[:-9]; imgdir = os.path.join(sdir, sid + '-images')

        def put(x):
            if isinstance(x, dict):
                if x.get('type') == 'base64' and str(x.get('data', '')).startswith('@file:'):
                    with open(os.path.join(imgdir, x['data'][6:]), 'rb') as f:
                        return {**x, 'data': base64.b64encode(f.read()).decode()}
                return {k: put(v) for k, v in x.items()}
            if isinstance(x, list):
                return [put(v) for v in x]
            return x

        dest = os.path.join(target, sid + '.jsonl')
        if os.path.exists(dest):
            print('Already there, left as it is:', dest); continue
        with gzip.open(os.path.join(sdir, name), 'rt', encoding='utf-8') as src, open(dest, 'w', encoding='utf-8') as dst:
            for raw in src:
                try:
                    dst.write(json.dumps(put(json.loads(raw)), ensure_ascii=False) + '\n')
                except ValueError:
                    dst.write(raw)
        if os.path.isdir(os.path.join(sdir, sid + '-extras')):
            shutil.copytree(os.path.join(sdir, sid + '-extras'), os.path.join(target, sid), dirs_exist_ok=True)
        helpers = os.path.join(sdir, sid + '-helpers')
        if os.path.isdir(helpers):
            for base, _, files in os.walk(helpers):
                for fname in files:
                    if fname == '.packed.json':
                        continue
                    src = os.path.join(base, fname)
                    rel = os.path.relpath(src, helpers)
                    out = os.path.join(target, sid, 'subagents', rel[:-3] if fname.endswith('.jsonl.gz') else rel)
                    os.makedirs(os.path.dirname(out), exist_ok=True)
                    if os.path.exists(out):
                        continue
                    if fname.endswith('.jsonl.gz'):
                        with gzip.open(src, 'rt', encoding='utf-8') as fi, open(out, 'w', encoding='utf-8') as fo:
                            for raw in fi:
                                try:
                                    fo.write(json.dumps(put(json.loads(raw)), ensure_ascii=False) + '\n')
                                except ValueError:
                                    fo.write(raw)
                    else:
                        shutil.copy2(src, out)
        print('Session restored:', dest)
    if os.path.isdir(os.path.join(OUT, 'memory')):
        shutil.copytree(os.path.join(OUT, 'memory'), os.path.join(target, 'memory'), dirs_exist_ok=True)
        print('Memory notes restored:', os.path.join(target, 'memory'))


def markdown(items):
    out = ['# Full conversation\n\nEvery message from the owner and every reply from Claude, oldest first. '
           'Tool steps are shown in one line each; their full output is in `sessions/`. Times are IST.\n']
    session = None
    for it in items:
        if it['session'] != session:
            session = it['session']; out.append(f'\n# Session {session}\n')
        if it['role'] == 'summary':
            out.append(f"\n---\n\n### Conversation summarised here ({when(it['at'])})\n\n<details><summary>Summary Claude continued from</summary>\n\n{it['text']}\n\n</details>\n")
        elif it['role'] == 'owner':
            out.append(f"\n---\n\n## Owner · {when(it['at'])}\n\n{it['text']}\n")
        else:
            if it['text']:
                out.append(f"\n## Claude · {when(it['at'])}\n\n{it['text']}\n")
            if it['steps']:
                out.append('\n' + '\n'.join(f'- *{s}*' for s in it['steps']) + '\n')
    return '\n'.join(out) + '\n'


def mark_final(items):
    """Flag Claude's last real reply to each owner message (the answer); the replies before it are progress notes.
    A line the app wrote in Claude's place (usage limit, "No response requested.") is the answer only when there is no other."""
    pending = None; fallback = None
    for it in items:
        if it['role'] == 'owner':
            if pending or fallback:
                (pending or fallback)['final'] = True
            pending = None; fallback = None
        elif it['role'] == 'claude' and it['text']:
            if SYNTHETIC.match(it['text']):
                fallback = it
            else:
                pending = it
    if pending or fallback:
        (pending or fallback)['final'] = True


def latest(items):
    """The end of the most recent session as owner message + Claude's answer, so a new session continues from here."""
    turns = []
    for it in items:
        if it['role'] == 'owner':
            turns.append([it, None])
        elif it.get('final') and turns:
            turns[-1][1] = it
    turns.sort(key=lambda t: t[0]['at'] or '')  # newest last, even when several sessions overlap
    picked = []; size = 0
    for t in reversed(turns):
        size += len(t[0]['text']) + len(t[1]['text'] if t[1] else '')
        if picked and size > LATEST_CHARS:
            break
        picked.append(t)
    picked.reverse()
    out = [f'# Where we stopped\n\nSaved automatically {datetime.now(IST).strftime("%a %d %b %Y, %I:%M %p IST")}. '
           "The latest messages from the owner, each with Claude's final answer, so a new session continues exactly from here. "
           'Everything in between (progress notes, tool steps) and all older history: `history/conversation.md` (search it).\n']
    for f, a in picked:
        out.append(f"\n## Owner · {when(f['at'])}\n\n{f['text']}\n")
        out.append(f"\n### Claude's answer\n\n{a['text']}\n" if a else "\n### Claude's answer\n\n(Not answered yet: this is the message being worked on.)\n")
    return '\n'.join(out)


def memory_all():
    mdir = os.path.join(OUT, 'memory')
    if not os.path.isdir(mdir):
        return ''
    out = ['# Claude\'s memory notes for this project\n\nAll notes in one file, copied from Claude\'s memory folder on every save. '
           'One note per section; the newest facts in `docs/` win if they differ.\n']
    for name in sorted(os.listdir(mdir)):
        if not name.endswith('.md') or name == 'MEMORY.md':
            continue
        text = open(os.path.join(mdir, name), encoding='utf-8').read()
        text = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.S).strip()
        out.append(f'\n## {name[:-3]}\n\n{text}\n')
    return '\n'.join(out)


def save(quiet=False):
    """Live sessions on this PC are saved; sessions from other PCs or earlier are read back from history/sessions/,
    so the readable conversation and the tracker always hold everything, on any PC or account."""
    sdir = os.path.join(OUT, 'sessions')
    os.makedirs(sdir, exist_ok=True)
    live = {}
    for d in session_dirs():
        for name in os.listdir(d):
            if name.endswith('.jsonl'):
                live[name[:-6]] = os.path.join(d, name)
        mem = os.path.join(d, 'memory')
        if os.path.isdir(mem):
            shutil.copytree(mem, os.path.join(OUT, 'memory'), dirs_exist_ok=True)
    for sid, p in live.items():
        archive(p, sid)
        extras = os.path.join(os.path.dirname(p), sid)
        if os.path.isdir(extras):  # the helpers' notes (subagents/) are packed separately, compressed
            shutil.copytree(extras, os.path.join(sdir, sid + '-extras'), dirs_exist_ok=True, ignore=shutil.ignore_patterns('subagents'))
            if os.path.isdir(os.path.join(extras, 'subagents')):
                archive_helpers(os.path.join(extras, 'subagents'), sid)
    sources = dict(live)
    for name in os.listdir(sdir):
        if name.endswith('.jsonl.gz') and name[:-9] not in sources:
            sources[name[:-9]] = os.path.join(sdir, name)
    if not sources:
        if quiet:
            return
        sys.exit('No Claude sessions found for this project (looked in ' + PROJECTS + ' and ' + sdir + ').')
    sessions = [read_session(p, sid) for sid, p in sources.items()]
    sessions.sort(key=lambda its: (its[0]['at'] or '') if its else '')
    items, seen = [], set()
    for its in sessions:  # a forked or resumed session repeats earlier items; keep each one once
        for it in its:
            key = (it['role'], it['at'], it['text'][:300], len(it['steps']))
            if key not in seen:
                seen.add(key); items.append(it)
    items.sort(key=lambda it: it['at'] or '')  # time order, even when sessions overlap (stable within a session)
    count = len(sources)
    mark_final(items)
    write(os.path.join(OUT, 'conversation.md'), markdown(items))
    write(os.path.join(OUT, 'conversation.json'), json.dumps([{**it, 'when': when(it['at'])} for it in items], ensure_ascii=False))
    write(os.path.join(OUT, 'LATEST.md'), latest(items))
    write(os.path.join(OUT, 'MEMORY-ALL.md'), memory_all())
    reqs = [it for it in items if it['role'] == 'owner']
    body = ['# Every message from the owner\n\nNumbered, oldest first, times in IST. The replies are in `conversation.md`.\n']
    for i, it in enumerate(reqs, 1):
        body.append(f"\n**{i}. {when(it['at'])}**\n\n" + '\n'.join('> ' + ln for ln in it['text'].splitlines()) + '\n')
    write(os.path.join(OUT, 'requests.md'), '\n'.join(body))
    tracker = bool(shutil.which('node'))
    if tracker:
        subprocess.run(['node', os.path.join(ROOT, 'tools', 'tracker', 'build-tracker.mjs')], cwd=ROOT, capture_output=True)
    if not quiet:
        size = sum(os.path.getsize(os.path.join(a, f)) for a, _, fs in os.walk(OUT) for f in fs) // 2**20
        print(f'History saved: {count} session(s), {len(reqs)} owner messages, {len(items)} items, {size} MB in {OUT}; ' + ('tracker rebuilt.' if tracker else 'install Node.js to rebuild the tracker.'))


def save_locked():
    """Used by the hooks: one save at a time; a request that arrives meanwhile runs once more at the end."""
    os.makedirs(OUT, exist_ok=True)
    lock = os.path.join(OUT, '.saving'); again = os.path.join(OUT, '.save-again')
    if os.path.exists(lock) and time.time() - os.path.getmtime(lock) < 900:
        open(again, 'w').close(); return
    open(lock, 'w').write(str(os.getpid()))
    try:
        while True:
            if os.path.exists(again):
                os.remove(again)
            save(quiet=True)
            if not os.path.exists(again):
                break
    except Exception as e:  # never disturb Claude; leave a note instead
        with open(os.path.join(OUT, '.save-error.log'), 'a', encoding='utf-8') as f:
            f.write(f'{datetime.now(IST).isoformat()} {e!r}\n')
    finally:
        if os.path.exists(lock):
            os.remove(lock)


def background():
    """Start the save in the background and return at once, so Claude never waits for it."""
    kw = dict(stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, close_fds=True, cwd=ROOT)
    if os.name == 'nt':
        kw['creationflags'] = 0x00000008 | 0x00000200  # detached, own process group
    else:
        kw['start_new_session'] = True
    subprocess.Popen([sys.executable, os.path.abspath(__file__), '--locked'], **kw)


if __name__ == '__main__':
    if '--restore' in sys.argv:
        restore()
    elif '--background' in sys.argv:
        background()
    elif '--locked' in sys.argv:
        save_locked()
    else:
        save()
