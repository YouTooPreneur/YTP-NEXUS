#!/usr/bin/env node
// Builds a copy of the project to show other people: the clickable screen preview, the tracker,
// the screen notes, the screen list and the design rules, with a "START HERE.html" page.
// Everything opens from the folder by double-clicking; no server is needed (fonts need internet).
//
// Run:  node tools/share/build-share.mjs [output folder]
// Default output: <your Documents folder>/YTP Nexus Preview
// The folder is rebuilt each time. It is only deleted if it was made by this tool (it holds a ".ytp-share" marker).
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = process.argv[2] || join(homedir(), 'Documents', 'YTP Nexus Preview');
const MARKER = '.ytp-share';

if (existsSync(out)) {
  if (!existsSync(join(out, MARKER))) {
    console.error(`Stopped: "${out}" already exists and was not made by this tool. Choose another folder.`);
    process.exit(1);
  }
  rmSync(out, { recursive: true, force: true });
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, MARKER), 'Made by tools/share/build-share.mjs. Safe to delete; it is rebuilt each time.\n');

const read = (p) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

// 1. The share version of the tracker (no History, Handover or Files: the conversation and memory stay private),
//    the screen pages and the design-version pictures the tracker shows.
execFileSync(process.execPath, [join(root, 'tools', 'tracker', 'build-tracker.mjs'), '--share', join(out, 'tracker.html')], { stdio: 'ignore' });
const mockSrc = join(root, 'docs', 'design', 'mockups');
const mockOut = join(out, 'docs', 'design', 'mockups');
mkdirSync(mockOut, { recursive: true });
for (const f of readdirSync(mockSrc)) {
  if (f === 'preview-hub.src.html' || f === 'preview-hub.html') continue; // index.html is the same page, built for opening from a folder
  if (/\.(html|css|js)$/.test(f)) cpSync(join(mockSrc, f), join(mockOut, f));
}
const verSrc = join(root, 'docs', 'design', 'versions');
let images = 0;
for (const v of existsSync(verSrc) ? readdirSync(verSrc) : []) {
  const vdir = join(verSrc, v);
  if (!statSync(vdir).isDirectory()) continue;
  mkdirSync(join(out, 'docs', 'design', 'versions', v), { recursive: true });
  for (const f of readdirSync(vdir)) if (/\.(png|jpe?g|webp)$/i.test(f)) { cpSync(join(vdir, f), join(out, 'docs', 'design', 'versions', v, f)); images++; }
}

// 2. Markdown documents as readable pages.
function mdToHtml(md, mockupBase) {
  const inline = (t) => {
    let s = esc(t);
    s = s.replace(/`([^`]+)`/g, (m, c) => {
      const page = c.match(/^([a-z0-9-]+\.html)(#[a-z0-9-]+)?$/i);
      if (page && mockupBase !== null && page[1] !== 'index.html') return `<a class="pv" href="${mockupBase}${c}">${c}</a>`;
      if (c === 'docs/design/mockups/index.html' && mockupBase !== null) return `<a class="pv" href="${mockupBase}index.html">screen preview</a>`;
      return `<code>${c}</code>`;
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    s = s.replace(/~~([^~]+)~~/g, '<s>$1</s>');
    s = s.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:]|$)/g, '$1<i>$2</i>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    return s;
  };
  const lines = md.split('\n');
  let html = '';
  let para = [];
  const stack = []; // open lists: { type, indent }
  const flushPara = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>\n`; para = []; } };
  const closeLists = (toIndent = -1) => {
    while (stack.length && stack[stack.length - 1].indent > toIndent) { html += `</li></${stack.pop().type}>\n`; }
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { flushPara(); continue; }
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flushPara(); closeLists(); const n = h[1].length; html += `<h${n}>${inline(h[2])}</h${n}>\n`; continue; }
    if (/^(-{3,}|\*{3,})$/.test(t)) { flushPara(); closeLists(); html += '<hr>\n'; continue; }
    if (t.startsWith('|')) {
      flushPara(); closeLists();
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++; }
      i--;
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(1).filter((r) => !/^[|\s:-]+$/.test(r)); // drop the |---| line
      html += '<div class="tw"><table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
      for (const r of body) html += '<tr>' + cells(r).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>';
      html += '</tbody></table></div>\n';
      continue;
    }
    const li = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      flushPara();
      const indent = li[1].length;
      const type = /\d/.test(li[2]) ? 'ol' : 'ul';
      const top = stack[stack.length - 1];
      if (!top || indent > top.indent) { html += `<${type}><li>`; stack.push({ type, indent }); }
      else {
        closeLists(indent);
        const cur = stack[stack.length - 1];
        if (cur && cur.indent === indent && cur.type === type) html += '</li><li>';
        else { if (cur && cur.indent === indent) html += `</li></${stack.pop().type}>`; html += `<${type}><li>`; stack.push({ type, indent }); }
      }
      html += inline(li[3]);
      continue;
    }
    if (stack.length && /^\s+/.test(line)) { html += ' ' + inline(t); continue; } // a continuation line inside a list item
    closeLists();
    para.push(t);
  }
  flushPara(); closeLists();
  return html;
}

const page = (title, body, homeHref) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · YTP Nexus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<style>
:root{--bg:#FAF8F3;--card:#FFFFFF;--ink:#1C3D36;--muted:#5F6E66;--line:#E7E3D8;--soft:#F2EFE7;--accent:#0B7A55;--band:#1C3D36}
@media (prefers-color-scheme:dark){:root{--bg:#0B1512;--card:#111E1A;--ink:#E8EEEA;--muted:#9AABA2;--line:#22352F;--soft:#16261F;--accent:#03FF96;--band:#0E201B}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 "DM Sans",system-ui,sans-serif}
.band{background:var(--band);color:#fff;padding:14px 20px}
.band .in{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:12px}
.band b{font-family:Sora,sans-serif;font-weight:600;font-size:17px}
.band a{margin-left:auto;color:#03FF96;font-weight:600;text-decoration:none;font-size:14px}
main{max-width:1080px;margin:0 auto;padding:24px 20px 60px}
h1,h2,h3,h4{font-family:Sora,sans-serif;font-weight:600;line-height:1.25;text-wrap:balance}
h1{font-size:30px;margin:6px 0 12px}
h2{font-size:22px;margin:32px 0 10px;padding-top:12px;border-top:1px solid var(--line)}
h3{font-size:18px;margin:26px 0 8px}
p,li{max-width:76ch}
a{color:var(--accent)}
a.pv{font-family:ui-monospace,Consolas,monospace;font-size:13px;font-weight:600;background:var(--soft);border:1px solid var(--line);border-radius:6px;padding:1px 6px;text-decoration:none}
code{font-family:ui-monospace,Consolas,monospace;font-size:13px;background:var(--soft);border-radius:5px;padding:1px 5px}
.tw{overflow-x:auto;margin:12px 0}
table{border-collapse:collapse;width:100%;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:14px}
th{text-align:left;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);background:var(--soft);padding:9px 12px}
td{padding:9px 12px;border-top:1px solid var(--line);vertical-align:top;min-width:90px}
hr{border:0;border-top:1px solid var(--line);margin:28px 0}
ul,ol{padding-left:22px}
li{margin:3px 0}
</style>
</head>
<body>
<div class="band"><div class="in"><b>YTP Nexus</b><span style="opacity:.75">${esc(title)}</span><a href="${homeHref}">← Start here</a></div></div>
<main>
${body}
<p style="color:var(--muted);font-size:13px;margin-top:40px">Copy made on ${today}. Sample data only.</p>
</main>
</body>
</html>
`;

const docs = [];
const screensDir = join(root, 'docs', 'design', 'screens');
const notesOut = join(out, 'docs', 'design', 'screens');
mkdirSync(notesOut, { recursive: true });
const batches = readdirSync(screensDir).filter((f) => /^BATCH-\d+\.md$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
for (const f of batches) {
  const md = read(`docs/design/screens/${f}`);
  const title = (md.match(/^#\s+(.*)$/m) || [null, f])[1];
  writeFileSync(join(notesOut, f.replace(/\.md$/, '.html')), page(title, mdToHtml(md, '../mockups/'), '../../../START%20HERE.html'));
  docs.push({ href: `docs/design/screens/${f.replace(/\.md$/, '.html')}`, title });
}
writeFileSync(join(out, 'docs', 'SCREENS.html'), page('All screens', mdToHtml(read('docs/SCREENS.md'), null), '../START%20HERE.html'));
writeFileSync(join(out, 'docs', 'design', 'DESIGN-RULES.html'), page('Design rules', mdToHtml(read('docs/design/DESIGN-RULES.md'), null), '../../START%20HERE.html'));

// 3. The start page.
const hub = readFileSync(join(mockSrc, 'index.html'), 'utf8');
const screensBuilt = (hub.match(/<div class="stat"><b>(\d+)<\/b>of (\d+) screens<\/div>/) || [null, '?', '?']);
const batchesBuilt = (hub.match(/<div class="stat"><b>(\d+)<\/b>of 9 batches ready<\/div>/) || [null, '?'])[1];
const logo = readFileSync(join(root, 'assets', 'brand', 'icon.svg'), 'utf8').replace(/<title>[\s\S]*?<\/title>/, '').replace(/fill="#03FF96"/, 'fill="currentColor" role="img" aria-label="YouTooPreneur"').trim();
const start = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>YTP Nexus · Start here</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<style>
:root{--bg:#FAF8F3;--card:#FFFFFF;--ink:#1C3D36;--muted:#5F6E66;--line:#E7E3D8;--soft:#F2EFE7;--accent:#0B7A55;--band:#1C3D36}
@media (prefers-color-scheme:dark){:root{--bg:#0B1512;--card:#111E1A;--ink:#E8EEEA;--muted:#9AABA2;--line:#22352F;--soft:#16261F;--accent:#03FF96;--band:#0E201B}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 "DM Sans",system-ui,sans-serif}
.hero{background:var(--band);color:#fff;padding:34px 20px 70px}
.hero .in{max-width:1040px;margin:0 auto;display:flex;flex-direction:column;gap:10px}
.brand{display:flex;align-items:center;gap:10px;font-family:Sora,sans-serif;font-weight:600;font-size:18px}
.brand svg{width:30px;height:33px;color:#03FF96}
h1{font-family:Sora,sans-serif;font-weight:600;font-size:clamp(28px,5vw,40px);line-height:1.15;margin:14px 0 0;text-wrap:balance}
.hero p{margin:0;color:rgba(255,255,255,.8);max-width:62ch}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.stats span{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:6px 14px;font-weight:600;font-size:13.5px}
.stats b{color:#03FF96;font-family:Sora,sans-serif}
main{max-width:1040px;margin:-44px auto 0;padding:0 20px 60px;display:flex;flex-direction:column;gap:18px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:20px 22px;box-shadow:0 10px 30px rgba(28,61,54,.08);display:flex;flex-direction:column;gap:8px;text-decoration:none;color:inherit;min-width:0}
a.card:hover{border-color:var(--accent)}
.card .k{font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.card h2{font-family:Sora,sans-serif;font-weight:600;font-size:21px;margin:0}
.card p{margin:0;color:var(--muted)}
.card .go{margin-top:auto;font-weight:700;color:var(--accent)}
.list{display:flex;flex-direction:column;gap:6px}
.list a{display:flex;justify-content:space-between;gap:10px;padding:9px 12px;border-radius:12px;background:var(--soft);text-decoration:none;color:var(--ink);font-weight:600}
.tips{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px 22px}
.tips h2{font-family:Sora,sans-serif;font-weight:600;font-size:18px;margin:0 0 8px}
.tips ul{margin:0;padding-left:20px;color:var(--muted)}
.tips li{margin:4px 0}
.foot{color:var(--muted);font-size:13px;text-align:center}
</style>
</head>
<body>
<div class="hero"><div class="in">
  <div class="brand">${logo}YouTooPreneur</div>
  <h1>YTP Nexus · screens and plan</h1>
  <p>The new internal app for YouTooPreneur, shown as clickable screens, with the full plan behind it. Nothing here is live: names, numbers and invoices are sample data.</p>
  <div class="stats"><span><b>${screensBuilt[1]}</b> of ${screensBuilt[2]} screens designed</span><span><b>${batchesBuilt}</b> of 9 batches</span><span>Copy made ${today}</span></div>
</div></div>
<main>
  <div class="cards">
    <a class="card" href="docs/design/mockups/index.html"><span class="k">Start with this</span><h2>Clickable screens</h2><p>All 184 screens, batch by batch. Click buttons and tabs, try the colour switch (Emerald or Navy) at the top, and open the phone versions.</p><span class="go">Open the screens →</span></a>
    <a class="card" href="tracker.html"><span class="k">The plan</span><h2>Project tracker</h2><p>Phases and status, decisions, requirements, the list of every screen, and the style history.</p><span class="go">Open the tracker →</span></a>
    <div class="card"><span class="k">What each screen does</span><h2>Screen notes</h2><p>For each screen: who uses it, what is on it, the rules it follows.</p><div class="list">${docs.map((d) => `<a href="${d.href}">${esc(d.title.replace(/: screen specs$/, ''))}<span>→</span></a>`).join('')}</div></div>
  </div>
  <div class="cards">
    <a class="card" href="docs/design/mockups/viewer.html"><span class="k">One window</span><h2>Screen viewer</h2><p>Every screen in a list by batch, with previous and next, the colour switch and a phone-width view.</p><span class="go">Open the viewer →</span></a>
    <a class="card" href="docs/SCREENS.html"><span class="k">Reference</span><h2>All 184 screens</h2><p>Every screen with its ID, what it is for, who uses it and the build step.</p><span class="go">Open the list →</span></a>
    <a class="card" href="docs/design/DESIGN-RULES.html"><span class="k">Reference</span><h2>Design rules</h2><p>Colours, type, spacing and the building blocks every screen uses.</p><span class="go">Open the rules →</span></a>
  </div>
  <div class="tips"><h2>Tips for showing it</h2><ul>
    <li>Open with Chrome or Edge. Everything works from this folder; fonts look best with internet on.</li>
    <li>Computer screens are designed for a full-size screen and shrink to fit a smaller window.</li>
    <li>Buttons for parts that come with a later step (for example e-signature) show a short notice instead.</li>
    <li>✦ marks an AI helper: here it explains what it would do; in Nexus it works within set limits, and everything can still be done by hand.</li>
  </ul></div>
  <p class="foot">YouTooPreneur · internal · sample data only</p>
</main>
</body>
</html>
`;
writeFileSync(join(out, 'START HERE.html'), start);
writeFileSync(join(out, 'README.txt'), `YTP Nexus · screens and plan\r\n\r\nDouble-click "START HERE.html" (opens in your browser).\r\n\r\n- Clickable screens: docs/design/mockups/index.html\r\n- Project tracker: tracker.html\r\n- Screen notes: docs/design/screens/\r\n\r\nSample data only. Copy made ${today}.\r\n`);

const count = readdirSync(mockOut).filter((f) => f.endsWith('.html')).length;
console.log(`Share folder ready: ${out}`);
console.log(`  ${count} screen pages, share tracker (no conversation or memory), ${batches.length} screen-note pages, ${images} design-version pictures`);
