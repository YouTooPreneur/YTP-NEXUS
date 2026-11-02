#!/usr/bin/env node
// Takes record pictures of mockup screens for docs/design/versions/ (D-180).
// It starts its own small local server, so nothing else needs to run.
//
//   node tools/mockups/capture.mjs docs/design/versions/v1.10-something  01-leads=leads.html  02-phone=phone.html@1400x1000
//
// Each picture is NAME=PAGE, where PAGE is a file in docs/design/mockups/ (with #tab or ?look=N if needed).
// Computer screens are 1600 x 1000 by default; add @WIDTHxHEIGHT for another size (phone pages: @1400x1000).
// Long (scrolling) pages are cut at the window height: give them a taller size, e.g. dashboard.html@1600x2600.
// Phone width for portal and public pages: NAME=../../../tools/mockups/frames/phone.html?p=page.html@520x900
// Pictures are never overwritten: a new version gets a new folder (D-180). Needs Microsoft Edge or Google Chrome.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join, dirname, extname, normalize, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [outArg, ...jobs] = process.argv.slice(2);
if (!outArg || !jobs.length) {
  console.error('Usage: node tools/mockups/capture.mjs <output folder> NAME=PAGE[@WxH] ...');
  process.exit(1);
}
const outDir = resolve(root, outArg); // a folder inside the project, or any absolute path
mkdirSync(outDir, { recursive: true });

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

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
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

let done = 0;
try {
  for (const job of jobs) {
    const m = job.match(/^([^=]+)=(.+?)(?:@(\d+)x(\d+))?$/);
    if (!m) { console.log('skipped (not NAME=PAGE):', job); continue; }
    const [, name, page, w = '1600', h = '1000'] = m;
    const file = join(outDir, `${name}.png`);
    if (existsSync(file)) { console.log('kept (never overwritten):', name); continue; }
    const profile = mkdtempSync(join(tmpdir(), 'nexus-capture-'));
    try {
      await run(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
        `--window-size=${w},${h}`, '--virtual-time-budget=7000', `--user-data-dir=${profile}`, `--screenshot=${file}`, base + page], { timeout: 90000 });
      done++;
      console.log('✓', name);
    } catch (e) {
      console.log('failed:', name, e.message.split('\n')[0]);
    } finally {
      rmSync(profile, { recursive: true, force: true });
    }
  }
} finally {
  server.close();
}
console.log(`${done} picture(s) saved in ${outArg}`);
