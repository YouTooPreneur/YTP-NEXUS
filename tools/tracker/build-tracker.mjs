#!/usr/bin/env node
// Builds tracker.html: an interactive view of the project docs.
// The docs stay the single source of truth; this page is regenerated from them.
// Run from anywhere: node tools/tracker/build-tracker.mjs
// Share version for copies that go to other people (build-share.mjs uses it):
//   node tools/tracker/build-tracker.mjs --share <file>
// It leaves out everything private (History, Handover with the memory notes, Files, the last message, the early
// style pictures) because history/ is never sent to anyone (HANDOVER section 8).
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const shareAt = process.argv.indexOf('--share');
const SHARE = shareAt !== -1;
const outFile = SHARE ? resolve(process.argv[shareAt + 1] || 'tracker-share.html') : join(root, 'tracker.html');
const read = (p) => {
  const f = join(root, p);
  return existsSync(f) ? readFileSync(f, 'utf8').replace(/\r\n/g, '\n') : '';
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
const plain = (s) => String(s)
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\*([^*]+)\*/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

// Split a markdown file into "## " sections.
function sections(md) {
  const out = [];
  let cur = null;
  for (const line of md.split('\n')) {
    const m = line.match(/^## (.+)$/);
    if (m) { cur = { title: m[1].trim(), lines: [] }; out.push(cur); } else if (cur) cur.lines.push(line);
  }
  return out;
}

const isRow = (l) => /^\s*\|/.test(l || '');
const isSep = (l) => /^\s*\|(\s*:?-+:?\s*\|)+\s*$/.test(l || '');
const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

function tables(lines) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (isRow(lines[i]) && isSep(lines[i + 1])) {
      const head = splitRow(lines[i]);
      const rows = [];
      i += 2;
      while (i < lines.length && isRow(lines[i])) rows.push(splitRow(lines[i++]));
      out.push({ head, rows });
    } else i++;
  }
  return out;
}
// Drop placeholder rows such as "| — | — |".
const realRows = (rows) => rows.filter((r) => r[0] && r[0] !== '—' && r[0] !== '-');

const checks = (lines) => lines
  .map((l) => l.match(/^\s*[-*] \[( |x|X)\] (.+)$/))
  .filter(Boolean)
  .map((m) => ({ done: m[1].toLowerCase() === 'x', html: inline(m[2]), text: plain(m[2]) }));

// Paragraph notes of a phase, stopping at any "###" sub-section (those are parsed separately).
const notes = (lines) => {
  const stop = lines.findIndex((l) => /^#{3,} /.test(l));
  return (stop === -1 ? lines : lines.slice(0, stop))
    .filter((l) => l.trim() && !/^\s*[-*] \[/.test(l) && !isRow(l) && !/^-{3,}\s*$/.test(l.trim()))
    .map((l) => inline(l.trim()));
};

// Small markdown renderer: headings, tables, lists (with checkboxes), quotes, rules, code blocks, paragraphs.
function md2html(md) {
  const lines = md.split('\n');
  let html = '';
  let para = [];
  let i = 0;
  const flush = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = []; } };
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      flush();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html += `<pre><code>${esc(buf.join('\n'))}</code></pre>`;
      continue;
    }
    const h = l.match(/^(#{1,4}) (.+)$/);
    if (h) { flush(); const n = h[1].length; html += `<h${n}>${inline(h[2])}</h${n}>`; i++; continue; }
    if (isRow(l) && isSep(lines[i + 1])) {
      flush();
      const head = splitRow(l);
      i += 2;
      const rows = [];
      while (i < lines.length && isRow(lines[i])) rows.push(splitRow(lines[i++]));
      html += '<div class="tw"><table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'
        + rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
      continue;
    }
    if (/^\s*([-*]|\d+\.) /.test(l)) {
      flush();
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.) /.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.) /, ''));
      const tag = ordered ? 'ol' : 'ul';
      html += `<${tag}>` + items.map((t) => {
        const c = t.match(/^\[( |x|X)\] (.+)$/);
        return c ? `<li class="chk${c[1] === ' ' ? '' : ' on'}">${inline(c[2])}</li>` : `<li>${inline(t)}</li>`;
      }).join('') + `</${tag}>`;
      continue;
    }
    if (/^> /.test(l)) { flush(); html += `<blockquote>${inline(l.slice(2))}</blockquote>`; i++; continue; }
    if (/^-{3,}\s*$/.test(l)) { flush(); html += '<hr>'; i++; continue; }
    if (!l.trim()) { flush(); i++; continue; }
    para.push(l.trim());
    i++;
  }
  flush();
  return html;
}

// ---- STATUS.md ----
const status = sections(read('docs/STATUS.md'));
const find = (re) => status.find((s) => re.test(s.title));

const resumeSec = find(/Resume here/i);
const resume = resumeSec
  ? ((tables(resumeSec.lines)[0] || {}).rows || []).map((r) => ({ key: plain(r[0]), raw: plain(r[1] || ''), html: inline(r[1] || '') }))
  : [];
const currentPhase = parseInt((resume.find((x) => /current phase/i.test(x.key)) || {}).raw, 10) || 1;

const todoSec = find(/^Owner to-do/i);
const todo = todoSec ? checks(todoSec.lines) : [];

const phases = status
  .filter((s) => /^Phase \d+:/.test(s.title))
  .map((s) => {
    const m = s.title.match(/^Phase (\d+):\s*(.+)$/);
    return { n: +m[1], name: m[2], steps: checks(s.lines.filter((l) => /^[-*] \[/.test(l))), notes: notes(s.lines) };
  });

// Review rounds table: a "### Review rounds" sub-section anywhere in STATUS.md.
const statusLines = read('docs/STATUS.md').split('\n');
const rrStart = statusLines.findIndex((l) => /^#{3,} Review rounds/i.test(l));
const rrTable = rrStart === -1 ? null : tables(statusLines.slice(rrStart + 1))[0];
const reviewHead = rrTable ? rrTable.head.map(inline) : [];
const reviewRounds = rrTable ? realRows(rrTable.rows).map((r) => r.map(inline)) : [];

const logSec = find(/^Task log/i);
const logTable = logSec ? tables(logSec.lines)[0] : null;
const taskLogHead = logTable ? logTable.head.map(inline) : [];
const taskLog = logTable ? realRows(logTable.rows).map((r) => r.map(inline)) : [];

// ---- DECISIONS.md ----
const decisions = sections(read('docs/DECISIONS.md'))
  .map((s) => ({
    section: s.title,
    rows: realRows((tables(s.lines)[0] || {}).rows || []).map((r) => ({
      id: plain(r[0]), html: inline(r[1] || ''), reason: inline(r[2] || ''), text: plain(r.join(' ')),
    })),
  }))
  .filter((s) => s.rows.length);

// ---- tasks, questions, changes ----
const indexTable = tables(read('docs/tasks/INDEX.md').split('\n'))[0] || { head: [], rows: [] };
// Lanes (D-196): docs/tasks/LANES.md says careful or fast for each card; show it next to the title.
const laneTable = existsSync(join(root, 'docs/tasks/LANES.md')) ? tables(read('docs/tasks/LANES.md').split('\n'))[0] : null;
const laneOf = new Map(laneTable ? realRows(laneTable.rows).map((r) => [plain(r[0]).trim(), r[2] || '']) : []);
const titleCol = indexTable.head.findIndex((h) => /^title$/i.test(plain(h).trim()));
if (laneOf.size && titleCol >= 0) {
  indexTable.head.splice(titleCol + 1, 0, 'Lane');
  indexTable.rows = indexTable.rows.map((r) => [...r.slice(0, titleCol + 1), laneOf.get(plain(r[0] || '').trim()) || '', ...r.slice(titleCol + 1)]);
}
const statusCol = Math.max(0, indexTable.head.findIndex((h) => /^status$/i.test(plain(h).trim())));
const tasks = realRows(indexTable.rows).map((r) => ({ cells: r.map(inline), status: plain(r[statusCol] || '').toLowerCase() }));
const qTable = tables(read('docs/QUESTIONS.md').split('\n'))[0] || { head: [], rows: [] };
const cTable = tables(read('docs/CHANGES.md').split('\n'))[0] || { head: [], rows: [] };

// ---- brand icon ----
const icon = read('assets/brand/icon.svg')
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace('<svg ', '<svg class="logo" aria-hidden="true" ');

// ---- Design versions (DESIGN-RULES.md "Design versions" table; pictures never overwritten, D-180) ----
const IMG = /\.(png|jpe?g|webp)$/i;
const href = (p) => encodeURI(p);
const globRe = (g) => new RegExp('^' + g.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
function pictures(p) {
  if (!p) return [];
  if (/[*?[]/.test(p)) {
    const dir = p.slice(0, p.lastIndexOf('/'));
    const re = globRe(p.slice(p.lastIndexOf('/') + 1));
    return existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((n) => IMG.test(n) && re.test(n)).sort().map((n) => `${dir}/${n}`) : [];
  }
  const f = join(root, p);
  if (!existsSync(f)) return [];
  if (statSync(f).isFile()) return IMG.test(p) ? [p] : [];
  return readdirSync(f).filter((n) => IMG.test(n)).sort().map((n) => p.replace(/\/?$/, '/') + n);
}
const backtick = (s) => (String(s).match(/`([^`]+)`/) || [])[1] || '';
const caption = (p) => p.split('/').pop().replace(IMG, '').replace(/^\d+-/, '').replace(/-/g, ' ');
const verSec = sections(read('docs/design/DESIGN-RULES.md')).find((s) => /Design versions/i.test(s.title));
const verTable = verSec ? tables(verSec.lines)[0] : null;
const versions = (verTable ? realRows(verTable.rows) : []).map((r) => {
  const col = (name) => r[verTable.head.findIndex((h) => new RegExp(name, 'i').test(h))] || '';
  return { version: plain(col('Version')), date: plain(col('Date')), round: plain(col('Round')), what: inline(col('What')),
    live: backtick(col('Live')), folder: backtick(col('Pictures')), pics: SHARE && /^docs\/design\/style\//.test(backtick(col('Pictures'))) ? [] : pictures(backtick(col('Pictures'))) };
}).reverse();
const thumbs = (pics) => (pics.length
  ? `<div class="thumbs">${pics.map((p) => `<a href="${href(p)}" target="_blank" rel="noopener"><img src="${href(p)}" alt="${esc(caption(p))}" loading="lazy"><span>${esc(caption(p))}</span></a>`).join('')}</div>`
  : `<p class="muted">${SHARE ? 'Pictures of the early style rounds are kept in the project folder, not in this copy.' : 'No pictures found.'}</p>`);
const designHtml = versions.length ? `<p class="muted">Every design version keeps its own pictures; nothing is overwritten. Newest first. Click a picture to open it full size.</p>
<div class="versions">${versions.map((v, i) => `<div class="version${i === 0 ? ' latest' : ''}">
  <div class="vhead"><strong>${esc(v.version)}</strong>${i === 0 ? '<span class="chip done">Current</span>' : ''}<span class="muted">${esc(v.date)} · round ${esc(v.round)} · ${v.pics.length} pictures</span>
  <span class="vlinks">${v.live ? `<a href="${href(v.live)}" target="_blank" rel="noopener">Open live page</a>` : ''}</span></div>
  <p>${v.what}</p>${thumbs(v.pics)}</div>`).join('')}</div>` : '';

// ---- History (history/conversation.json, saved after every reply by tools/history/export-session.py, D-176) ----
const conv = (() => { try { return JSON.parse(read('history/conversation.json') || '[]'); } catch { return []; } })();
const ownerMsgs = conv.filter((c) => c.role === 'owner').length;
const lastSaved = existsSync(join(root, 'history/conversation.json'))
  ? statSync(join(root, 'history/conversation.json')).mtime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '';
const historyHtml = conv.length ? (() => {
  const out = []; let n = 0; let work = []; let turn = null;
  const flush = () => {
    if (!work.length) return '';
    const steps = work.reduce((t, w) => t + w.steps.length, 0); const notes = work.filter((w) => w.text);
    const h = `<details class="work"><summary>Work in between: ${notes.length} progress note${notes.length === 1 ? '' : 's'}, ${steps} step${steps === 1 ? '' : 's'}</summary>${work.map((w) => `${w.text ? `<div class="wn"><span class="muted">${esc(w.when)}</span>${md2html(w.text)}</div>` : ''}${w.steps.length ? `<ul class="hsteps">${w.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`).join('')}</details>`;
    work = []; return h;
  };
  const close = () => { if (turn) { turn.push(flush(), '</article>'); out.push(turn.join('')); turn = null; } };
  for (const c of conv) {
    if (c.role === 'owner') { close(); n += 1; turn = [`<article class="turn"><div class="msg mine"><div class="who"><strong>#${n} · You</strong><span class="muted">${esc(c.when)}</span></div>${md2html(c.text)}</div>`]; }
    else if (c.role === 'summary') { close(); out.push(`<details class="turn summary"><summary>Conversation summarised here (${esc(c.when)}): the summary Claude continued from</summary>${md2html(c.text)}</details>`); }
    else if (turn && c.final) turn.push(flush(), `<div class="msg claude"><div class="who"><strong>Claude</strong><span class="muted">${esc(c.when)}</span></div>${md2html(c.text)}</div>`);
    else if (turn) work.push(c);
  }
  close();
  return `<div class="hnote">Everything said in this project with Claude: <strong>${ownerMsgs}</strong> messages from you, each with Claude's answer; the work in between is folded under each answer. Saved automatically after every reply${lastSaved ? `; last saved ${esc(lastSaved)} IST` : ''}. Also in <code>history/</code>: <a href="history/conversation.md" target="_blank" rel="noopener">full conversation</a> · <a href="history/requests.md" target="_blank" rel="noopener">your messages</a> · <a href="history/LATEST.md" target="_blank" rel="noopener">where we stopped</a> · <a href="history/MEMORY-ALL.md" target="_blank" rel="noopener">Claude's memory notes</a></div>
<div class="hist-tools"><input type="search" id="hq" placeholder="Search everything said (e.g. GST, renewals, Tamil)" aria-label="Search the conversation"><label><input type="checkbox" id="h-mine"> Only my messages</label><label><input type="checkbox" id="h-old"> Oldest first</label><span class="muted" id="h-count"></span></div>
<div class="hist" id="hist">${out.reverse().join('\n')}</div>`;
})() : '';
const lastMsg = (() => { const l = [...conv].reverse().find((c) => c.role === 'owner'); return l ? { n: ownerMsgs, when: l.when, text: l.text.length > 220 ? l.text.slice(0, 220) + '…' : l.text } : null; })();

// ---- Handover (how to continue anywhere) ----
const latestMd = read('history/LATEST.md');
const memoryMd = read('history/MEMORY-ALL.md');
const handoverHtml = `<div class="hnote">Everything a new session, PC or account needs to continue exactly from here. These three parts also load into every new Claude session automatically (<code>CLAUDE.md</code>).</div>
${latestMd ? `<details class="turn" open><summary><strong>Where we stopped</strong> · the latest messages with Claude's answers</summary>${md2html(latestMd.replace(/^# .*\n/, ''))}</details>` : ''}
<article class="prose">${md2html(read('docs/HANDOVER.md'))}</article>
${memoryMd ? `<h2 class="sech">Claude's memory notes</h2><details class="turn"><summary>All memory notes (${(memoryMd.match(/^## /gm) || []).length})</summary>${md2html(memoryMd.replace(/^# .*\n/, ''))}</details>` : ''}`;

// ---- Files (built by scanning the folders, so anything new appears by itself) ----
const walkFiles = (p, re) => { const out = []; const go = (d) => { if (!existsSync(join(root, d))) return; for (const n of readdirSync(join(root, d)).sort()) { if (n === 'node_modules' || n.startsWith('.')) continue; const rel = `${d}/${n}`; if (statSync(join(root, rel)).isDirectory()) go(rel); else if (re.test(n)) out.push(rel); } }; go(p); return out; };
const listDir = (p, re = /./) => (existsSync(join(root, p)) ? readdirSync(join(root, p)).filter((n) => re.test(n) && !/^(~\$|\.)/.test(n)).sort() : []);
const fileLink = (p, label) => `<a href="${href(p)}" target="_blank" rel="noopener">${esc(label || p.split('/').pop())}</a>`;
const fileList = (title, note, items) => (items.length ? `<h2 class="sech">${esc(title)}</h2>${note ? `<p class="muted">${note}</p>` : ''}<ul class="files">${items.map(([p, label, extra]) => `<li>${fileLink(p, label)}${extra ? ` <span class="muted">· ${extra}</span>` : ''}</li>`).join('')}</ul>` : '');
const TOOLS = [
  ['node tools/tracker/build-tracker.mjs', 'Rebuild this tracker (also happens by itself after every reply)'],
  ['python tools/history/export-session.py', 'Save the whole conversation and memory into history/ (by itself after every reply); add --restore on a new PC'],
  ['python tools/share/build-word.py', 'Word copies of every document into share/ (close open Word files first)'],
  ['node tools/share/build-share.mjs', 'Copy for showing others: Documents/YTP Nexus Preview'],
  ['python tools/share/build-review.py', 'Review copy for the senior, with the Excel comment sheet and a ZIP'],
  ['python tools/share/build-downloads.py', 'One folder in Downloads to share: the review copy, the choices list and the preview, with a READ ME'],
  ['python tools/share/build-choices-sheet.py', 'Excel answer sheet for the choices (share/), from the plain-words guide'],
  ['node tools/mockups/build-preview.mjs', 'Rebuild the preview home of the screens'],
  ['node tools/mockups/capture.mjs', 'Record pictures of screens for docs/design/versions/'],
  ['python tools/mockups/run-check.py', 'Screen check of every page in both colours, headless (preview server on port 8765 first); show screens only with 0 problems'],
  ['tools/mockups/check.html', 'The same screen check in a browser (through the preview server, port 8765)'],
  ['python tools/history/make-backup.py', 'Dated ZIP backup of the whole folder'],
];
const filesHtml = `<div class="hnote">Every file in the project, in one place. This list is built from the folders, so anything new appears here by itself.</div>
${fileList('Project documents', 'The source of truth. Word copies are below.', listDir('docs', /\.md$/).map((n) => [`docs/${n}`, n]))}
${fileList('Design documents and screen notes', '', [...listDir('docs/design', /\.md$/).map((n) => [`docs/design/${n}`, n]), ...listDir('docs/design/screens', /\.md$/).map((n) => [`docs/design/screens/${n}`, n])])}
${fileList('Word copies (for WhatsApp)', 'Rebuilt from the documents; edit the documents, not these.', listDir('share', /\.docx$/).map((n) => [`share/${n}`, n.replace(/^YTP Nexus - /, '')]))}
${fileList('Screens', '', [['docs/design/mockups/index.html', 'Preview home', 'all 184 screens by batch'], ['docs/design/mockups/viewer.html', 'Screen viewer', 'pick any screen and colour'], ['tools/mockups/check.html', 'Screen check', 'open through the preview server'], ['../../Documents/YTP Nexus Screen Review/START HERE.html', 'Review copy for the senior', 'Documents/YTP Nexus Screen Review']])}
${fileList('Design versions', 'Pictures of every version, never overwritten. Also shown in the Design tab.', [...listDir('docs/design/versions').map((n) => [`docs/design/versions/${n}/`, n]), ['docs/design/style/', 'style/', 'the early style rounds']])}
${fileList('Conversation and memory', 'Everything said, saved by itself after every reply. Also in the History and Handover tabs.', [...listDir('history', /\.(md|json)$/).map((n) => [`history/${n}`, n]), ['history/memory/', 'memory/', "Claude's memory notes, one file each"], ['history/sessions/', 'sessions/', 'complete session records']])}
${fileList('Reviews', 'Round 16 review: the change list and what was applied.', listDir('docs/review', /\.md$/).map((n) => [`docs/review/${n}`, n]))}
${fileList('Sources', 'What the owner gave us, unedited.', listDir('docs/sources').filter((n) => n !== 'README.md').map((n) => [`docs/sources/${n}`, n]))}
${fileList('All screen pages', 'Every page in docs/design/mockups, A to Z (the shared mockup.css and mockup.js style and build them).', listDir('docs/design/mockups', /\.(html|css|js)$/).map((n) => [`docs/design/mockups/${n}`, n]))}
${fileList('Brand files', 'Logos and the icon (see assets/brand/README.md for which one to use where).', listDir('assets/brand').map((n) => [`assets/brand/${n}`, n]))}
${fileList('Task cards, logs and proof', 'The card list is docs/tasks/INDEX.md; full cards are written one step at a time.', [...listDir('docs/tasks').map((n) => [`docs/tasks/${n}`, `tasks/${n}`]), ...listDir('docs/templates').map((n) => [`docs/templates/${n}`, `templates/${n}`]), ...listDir('docs/logs').map((n) => [`docs/logs/${n}`, `logs/${n}`]), ...listDir('docs/evidence').map((n) => [`docs/evidence/${n}`, `evidence/${n}`])])}
${fileList('Planner tests', 'Written by the planner before any code; builders never edit them. tests/LOCK holds their fingerprints (python tools/tasks/write-lock.py).', [...(existsSync(join(root, 'tests/LOCK')) ? [['tests/LOCK', 'tests/LOCK']] : []), ...walkFiles('tests', /\.(mjs|ts|tsx|md)$/).map((f) => [f, f]), ...['apps', 'packages'].flatMap((top) => listDir(top).flatMap((pkg) => walkFiles(`${top}/${pkg}/test`, /\.(ts|tsx)$/).map((f) => [f, f])))])}
${fileList('Tool files', 'The scripts behind the tools table below.', ['tools/tracker', 'tools/share', 'tools/mockups', 'tools/mockups/frames', 'tools/history'].flatMap((d) => listDir(d, /\.(mjs|py|html)$/).map((n) => [`${d}/${n}`, `${d.replace('tools/', '')}/${n}`])))}
${fileList('Rules and settings', '', [['AGENTS.md', 'AGENTS.md', 'rulebook for every AI'], ['CLAUDE.md', 'CLAUDE.md', 'notes Claude reads first; loads the handover'], ['README.md', 'README.md', 'what lives where'], ['.claude/settings.json', '.claude/settings.json', 'auto-save after every reply'], ['.claude/launch.json', '.claude/launch.json', 'preview server']])}
<h2 class="sech">Tools</h2><div class="tw"><table><thead><tr><th>Run</th><th>What it does</th></tr></thead><tbody>${TOOLS.map(([c, w]) => `<tr><td><code>${esc(c)}</code></td><td>${esc(w)}</td></tr>`).join('')}</tbody></table></div>`;

// ---- Choices (small decisions made while building, for the owner, D-179) ----
const choicesMd = read('docs/CHOICES.md');
const openChoices = sections(choicesMd).reduce((n, s) => n + tables(s.lines).reduce((m, t) => {
  const a = t.head.findIndex((h) => /your answer/i.test(h));
  return m + (a === -1 ? 0 : t.rows.filter((r) => r[0] && !(r[a] || '').trim()).length);
}, 0), 0);

const data = {
  share: SHARE, versionCount: versions.length, designHtml,
  historyHtml: SHARE ? '' : historyHtml, historyCount: SHARE ? 0 : ownerMsgs, lastMsg: SHARE ? null : lastMsg,
  handoverHtml: SHARE ? '' : handoverHtml, filesHtml: SHARE ? '' : filesHtml,
  openChoices, choicesHtml: md2html(choicesMd), choicesExplainedHtml: md2html(read('docs/CHOICES-EXPLAINED.md')),
  scopeHtml: md2html(read('docs/SCOPE.md')), estimateHtml: md2html(read('docs/ESTIMATE.md')), techHtml: md2html(read('docs/TECH-DESIGN.md')),
  releasesHtml: existsSync(join(root, 'docs/RELEASES.md')) ? md2html(read('docs/RELEASES.md')) : '',
  dataModelHtml: existsSync(join(root, 'docs/DATA-MODEL.md')) ? md2html(read('docs/DATA-MODEL.md')) : '',
  resume, currentPhase, todo, phases, taskLogHead, taskLog, decisions, reviewHead, reviewRounds,
  indexHead: indexTable.head.map(inline), tasks,
  qHead: qTable.head.map(inline), questions: realRows(qTable.rows).map((r) => r.map(inline)),
  cHead: cTable.head.map(inline), changes: realRows(cTable.rows).map((r) => r.map(inline)),
  planHtml: md2html(read('docs/PLAN.md')),
  requirementsHtml: md2html(read('docs/REQUIREMENTS.md')),
  rawRequirementsHtml: md2html(read('docs/RAW-REQUIREMENTS.md')),
  round16Html: md2html(read('docs/review/ROUND-16-CHANGE-LIST.md')),
  screensHtml: md2html(read('docs/SCREENS.md')),
  stylePromptsHtml: md2html(read('docs/design/STYLE-PROMPTS.md')),
  stylePrompts2Html: md2html(read('docs/design/STYLE-PROMPTS-ROUND2.md')),
  styleReviewHtml: md2html(read('docs/design/STYLE-REVIEW.md')),
  styleImages: (() => {
    if (SHARE) return [];
    const dir = join(root, 'docs', 'design', 'style');
    if (!existsSync(dir)) return [];
    const top = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort().map((f) => ({ file: `docs/design/style/${f}`, name: f.replace(/\.[^.]+$/, '') }));
    // round 2 ChatGPT pictures live in a sub-folder; their names say "chatgpt" so they don't mix with Claude's coded ones
    const r2 = existsSync(join(dir, 'round2')) ? readdirSync(join(dir, 'round2')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort().map((f) => ({ file: `docs/design/style/round2/${f}`, name: f.replace(/\.[^.]+$/, '') + '-chatgpt' })) : [];
    return [...top, ...r2];
  })(),
};

const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const out = readFileSync(join(here, 'template.html'), 'utf8')
  .replace('__DATA_JSON__', () => json)
  .replace('__ICON_SVG__', () => icon)
  .replace(/__GENERATED_AT__/g, () => generatedAt);

writeFileSync(outFile, out);
if (SHARE) { console.log(`share tracker written (no History, Handover or Files): ${outFile}`); process.exit(0); }
const nDec = decisions.reduce((n, s) => n + s.rows.length, 0);
console.log(`tracker.html updated (${generatedAt} IST): ${phases.length} phases, ${todo.length} to-dos, ${nDec} decisions, ${tasks.length} tasks.`);
