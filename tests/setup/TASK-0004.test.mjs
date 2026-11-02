// TASK-0004 · Design tokens wired into the frontend. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const exact = (deps) => {
  for (const [name, version] of Object.entries(deps ?? {})) {
    assert.match(version, /^(\d+\.\d+\.\d+|workspace:\*)$/, `${name} must be pinned exactly, found ${version}`);
  }
};

test('the screen-parts package is set up', () => {
  const p = JSON.parse(read('packages/ui/package.json'));
  assert.equal(p.name, '@ytp/ui');
  assert.equal(p.exports['./tokens.css'], './src/tokens.css');
  assert.equal(p.exports['.'], './src/index.ts');
  exact(p.dependencies);
  exact(p.devDependencies);
});

test('the frontend uses Tailwind, the tokens and the self-hosted fonts', () => {
  const p = JSON.parse(read('apps/web/package.json'));
  assert.equal(p.dependencies['@ytp/ui'], 'workspace:*');
  assert.equal(p.dependencies['@fontsource/dm-sans'], '5.3.0');
  assert.equal(p.dependencies['@fontsource/sora'], '5.3.0');
  assert.equal(p.devDependencies.tailwindcss, '4.3.3');
  assert.equal(p.devDependencies['@tailwindcss/vite'], '4.3.3');
  exact(p.dependencies);
  exact(p.devDependencies);

  const css = read('apps/web/src/index.css');
  assert.match(css, /@import\s+"tailwindcss";/);
  assert.match(css, /@import\s+"@ytp\/ui\/tokens\.css";/);
  assert.match(css, /@source\s+"\.\.\/\.\.\/\.\.\/packages\/ui\/src";/);

  assert.match(read('apps/web/vite.config.ts'), /tailwindcss\(\)/);
  const main = read('apps/web/src/main.tsx');
  assert.match(main, /import\s+['"]\.\/index\.css['"]/);
  assert.match(main, /@fontsource\/dm-sans\/400\.css/);
  assert.match(main, /@fontsource\/sora\/600\.css/);
});

test('the page starts in Emerald', () => {
  assert.match(read('apps/web/index.html'), /<html lang="en" data-colour="emerald">/);
});
