// TASK-0003 · Frontend app. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

test('the frontend package has the agreed name, scripts and exact versions', () => {
  const p = JSON.parse(read('apps/web/package.json'));
  assert.equal(p.name, '@ytp/web');
  assert.equal(p.type, 'module');
  for (const script of ['dev', 'build', 'preview', 'typecheck', 'test']) {
    assert.ok(p.scripts?.[script], `missing script: ${script}`);
  }
  const all = { ...p.dependencies, ...p.devDependencies };
  assert.equal(all.react, '19.3.1');
  assert.equal(all.vite, '8.3.5');
  for (const [name, version] of Object.entries(all)) {
    assert.match(version, /^(\d+\.\d+\.\d+|workspace:\*)$/, `${name} must be pinned exactly, found ${version}`);
  }
});

test('the page is English, fits phones and loads the app', () => {
  const html = read('apps/web/index.html');
  assert.match(html, /<html[^>]*\blang="en"/);
  assert.match(html, /name="viewport"[^>]*width=device-width/);
  assert.match(html, /<title>YTP Nexus<\/title>/);
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /src="\/src\/main\.tsx"/);
});

test('during development /api goes to the backend on port 3000', () => {
  const config = read('apps/web/vite.config.ts');
  assert.match(config, /['"]\/api['"]\s*:\s*['"]http:\/\/localhost:3000['"]/);
  // The screens use port 5310, not Vite's usual 5173, which other projects take first (CR-019, D-199).
  assert.match(config, /port:\s*5310,/);
  assert.match(config, /strictPort:\s*true/, 'the screens never move to another port by themselves');
});
