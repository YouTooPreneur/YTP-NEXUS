#!/usr/bin/env node
// RETIRED (21 Oct 2026): it writes into docs/design/style and would overwrite the record pictures of the early style
// rounds (D-180). Take new pictures with tools/mockups/capture.mjs into a new folder in docs/design/versions/.
// It only runs with --replace-old-style-pictures, which the owner must ask for.
// Renders the coded style mockups (docs/design/mockups) to PNG images in docs/design/style.
// Round 2: 4 screens x 3 looks x 2 themes = 24 images, named R2-<screen>-<look>-<theme>-claude.png.
// Round 3: the chosen style (mixed, Bold font, grouped menu, airy spacing) in its two colours, Emerald and Navy,
// on the 4 screens, named R3-<screen>-<E|N>-mixed-claude.png.
// Needs Microsoft Edge or Google Chrome, and internet for the Google fonts.
// Run: node tools/mockups/render-mockups.mjs            (all 32)
//      node tools/mockups/render-mockups.mjs R3         (only names containing "R3")
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join, dirname, extname, normalize, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
if (!process.argv.includes('--replace-old-style-pictures')) {
  console.error('Retired: this would overwrite the early style pictures (D-180). Use: node tools/mockups/capture.mjs docs/design/versions/<new folder> NAME=PAGE ...');
  process.exit(1);
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = join(root, 'docs', 'design', 'style');
const scale = process.env.SCALE || '1.5';
const filter = process.argv.slice(2).find((a) => !a.startsWith('--')) || '';

const SCREENS = [
  { n: 1, page: 'dashboard.html', w: 1600, h: 1000 },
  { n: 2, page: 'client-profile.html', w: 1600, h: 1000 },
  { n: 3, page: 'pipeline.html', w: 1600, h: 1000 },
  { n: 4, page: 'phone.html', w: 1000, h: 1000 },
];
const JOBS = [];
for (const s of SCREENS) for (const look of ['E', 'N', 'M']) for (const theme of ['dark', 'light']) JOBS.push({ s, round: 2, look, theme, extra: '&font=serif&nav=wide' });
for (const s of SCREENS) for (const look of ['E', 'N']) JOBS.push({ s, round: 3, look, theme: 'mixed', extra: '&font=geo&nav=grouped' });

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/microsoft-edge',
];
const browser = BROWSERS.find((b) => existsSync(b));
if (!browser) { console.error('No Edge or Chrome found.'); process.exit(1); }

// Small static server for the project folder, so the pages load exactly as in a browser.
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/docs/design/mockups/`;
const profile = mkdtempSync(join(tmpdir(), 'nexus-mockups-'));

let done = 0;
try {
  for (const { s, round, look, theme, extra = '' } of JOBS) {
    const name = `R${round}-${s.n}-${look}-${theme}-claude.png`;
    if (filter && !name.includes(filter)) continue;
    await run(browser, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', `--force-device-scale-factor=${scale}`,
      `--window-size=${s.w},${s.h}`, '--virtual-time-budget=6000', `--user-data-dir=${profile}`,
      `--screenshot=${join(outDir, name)}`, `${base}${s.page}?look=${look}&theme=${theme}${extra}&shot=1`,
    ], { timeout: 60000 });
    done++;
    console.log(`✓ ${name}`);
  }
} finally {
  server.close();
  rmSync(profile, { recursive: true, force: true });
}
console.log(`${done} images written to docs/design/style/`);
