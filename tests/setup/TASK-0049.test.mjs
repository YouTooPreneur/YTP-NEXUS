// TASK-0049 · The sign-in screen's set-up: the three packages pinned, the test page's own address, the three new design tokens in both colours, Better Auth's one client made as agreed and never its session hooks, get-session asked in one place, the one query client, nothing kept in the browser or the console, every text of the sign-in page read from its texts module, Better Auth reached only through its one client, colours only from the tokens, a disabled or busy button never faded or filtered, Core's Screens line, and the end-to-end database wired into Playwright. Written by the planner; builders never edit this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, posix } from 'node:path';

const ts = createRequire(new URL('../../package.json', import.meta.url))('typescript');
const read = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const PAGE = 'apps/web/src/modules/core/SignIn.tsx';
const TEXTS = 'apps/web/src/modules/core/sign-in-texts.ts';

function parse(path) {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, kind);
}

// A file's code without its comments (TypeScript's own printer), so a comment may name what the code must not do.
function code(path) {
  return ts.createPrinter({ removeComments: true }).printFile(parse(path));
}

// Every string a file writes: its strings, the parts of its template strings and the text between its tags.
function literals(path) {
  const found = [];
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) found.push(node.text);
    if (ts.isTemplateExpression(node)) found.push(node.head.text, ...node.templateSpans.map((span) => span.literal.text));
    if (ts.isJsxText(node) && node.text.trim() !== '') found.push(node.text.trim());
    ts.forEachChild(node, visit);
  };
  visit(parse(path));
  return found;
}

// Every source file of the screens (the generated client left out), as [path, code without comments].
function sources(dir = 'apps/web/src') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) return path === 'apps/web/src/api' ? [] : sources(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [[path, code(path)]] : [];
  });
}

const CARD_FILES = [
  'apps/web/src/App.tsx',
  'apps/web/src/requests/auth-client.ts',
  'apps/web/src/requests/session.ts',
  'apps/web/src/requests/query-client.ts',
  PAGE,
  TEXTS,
];

test('the screens pin react-router 8.5.1 and better-auth 1.7.14, and MSW 3.0.4 for the tests only', () => {
  const web = JSON.parse(read('apps/web/package.json'));
  assert.equal(web.dependencies['react-router'], '8.5.1');
  assert.equal(web.dependencies['better-auth'], '1.7.14');
  assert.equal(web.devDependencies.msw, '3.0.4');
  assert.equal(web.dependencies.msw, undefined, 'MSW is for the tests only');
  assert.equal(web.dependencies['react-router-dom'], undefined, 'react-router alone');
});

test('the screen tests run on the screens’ own address', () => {
  assert.match(read('apps/web/vite.config.ts'), /environmentOptions: \{ jsdom: \{ url: 'http:\/\/localhost:5310\/' \} \}/);
});

test('both colours define the "on" green, the firmer edge and the brand panel', () => {
  const css = read('packages/ui/src/tokens.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = (selector) => {
    for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (selectors.split(',').map((s) => s.trim()).includes(selector)) return body.replace(/\s+/g, ' ');
    }
    throw new Error(`no rule for ${selector}`);
  };
  const emerald = rule('[data-colour="emerald"]');
  assert.match(emerald, /--on: #0E874D;/);
  assert.match(emerald, /--edge: #B8C2BC;/);
  assert.match(emerald, /--brand-panel: linear-gradient\(160deg, #21483F 0%, #122B24 100%\);/);
  const navy = rule('[data-colour="navy"]');
  assert.match(navy, /--on: #0E874D;/);
  assert.match(navy, /--edge: #B3BFCC;/);
  assert.match(navy, /--brand-panel: linear-gradient\(160deg, #1A3954 0%, #0C1D2C 100%\);/);
});

test('Better Auth has one client, made from better-auth/client as agreed, and no screen uses its session hooks', () => {
  const client = read('apps/web/src/requests/auth-client.ts');
  assert.match(client, /^import \{ createAuthClient \} from 'better-auth\/client';$/m);
  assert.match(client, /sessionOptions: \{ refetchOnWindowFocus: false \}/);
  assert.match(client, /customFetchImpl: \(input, init\) => fetch\(input, init\)/);
  assert.doesNotMatch(code('apps/web/src/requests/auth-client.ts'), /baseURL|nexusFetch|basePath/);
  const all = sources();
  assert.deepEqual(
    all.filter(([, text]) => /\bcreateAuthClient\(/.test(text)).map(([path]) => path),
    ['apps/web/src/requests/auth-client.ts'],
    'one Better Auth client',
  );
  for (const [path, text] of all) {
    assert.doesNotMatch(text, /better-auth\/react|\buseSession\b|\$store|\$sessionSignal/, `${path} uses Better Auth's session hooks`);
  }
  assert.deepEqual(
    all.filter(([, text]) => /\.getSession\(/.test(text)).map(([path]) => path),
    ['apps/web/src/requests/session.ts'],
    'get-session is asked in one place',
  );
});

test('the one query client lives in src/requests/query-client.ts and App.tsx provides it', () => {
  const made = sources().filter(([, text]) => /new QueryClient\(/.test(text)).map(([path]) => path);
  assert.deepEqual(made, ['apps/web/src/requests/query-client.ts']);
  assert.match(read('apps/web/src/requests/query-client.ts'), /^export const queryClient = new QueryClient\(\{$/m);
  const app = read('apps/web/src/App.tsx');
  assert.match(app, /<QueryClientProvider client=\{queryClient\}>/);
  assert.match(app, /from '\.\/requests\/query-client'/);
});

test('nothing of this card keeps anything in the browser or writes to the console', () => {
  for (const path of CARD_FILES) {
    assert.doesNotMatch(code(path), /localStorage|sessionStorage|indexedDB|document\.cookie|\bconsole\./, path);
  }
});

// The words a page writes in its own markup: text between its tags, a string as a child, and a label, title, alternative
// or placeholder written as a string.
function wordsInMarkup(path) {
  const source = parse(path);
  const found = [];
  const visit = (node) => {
    if (ts.isJsxText(node) && node.text.trim() !== '') found.push(node.text.trim());
    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      (ts.isStringLiteral(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression)) &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
    ) {
      found.push(node.expression.text);
    }
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const name = node.name.getText(source);
      if (['aria-label', 'title', 'alt', 'placeholder'].includes(name)) found.push(`${name}="${node.initializer.text}"`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

test('the sign-in page writes no words of its own: every text comes from its texts module', () => {
  assert.deepEqual(wordsInMarkup(PAGE), []);
});

test('the sign-in page types none of its texts (labels, busy words, messages, the title): it reads every one from signInTexts', () => {
  const texts = new Set(literals(TEXTS).map((text) => text.trim()).filter((text) => text !== ''));
  assert.ok(texts.has('Sign in to Nexus'), 'the texts module holds the page’s texts');
  const typed = literals(PAGE)
    .map((text) => text.trim())
    .filter((text) => texts.has(text));
  assert.deepEqual(typed, []);
});

test('the sign-in page reaches Better Auth only through its one client, and never uses nexusFetch, the query client or the generated client', () => {
  const specifiers = [];
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(parse(PAGE));
  assert.ok(specifiers.length > 0, 'the page has its imports');
  for (const from of specifiers) {
    const target = from.startsWith('.') ? posix.join('apps/web/src/modules/core', from) : from;
    assert.doesNotMatch(target, /^better-auth(\/|$)/, `${from}: Better Auth only through ../../requests/auth-client`);
    assert.doesNotMatch(
      target,
      /^apps\/web\/src\/requests\/(nexus-fetch|query-client)(\.[jt]sx?)?$/,
      `${from}: never nexusFetch or the query client`,
    );
    assert.doesNotMatch(target, /^apps\/web\/src\/api(\/|$)/, `${from}: never the generated client`);
  }
});

test('the sign-in page takes every colour from the tokens (only Google’s mark keeps its own four, and the brand panel’s words are white), never fades anything, and keeps the keyboard in reading order', () => {
  const page = code(PAGE);
  const hexes = [...page.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toUpperCase());
  assert.deepEqual([...new Set(hexes)].sort(), ['#34A853', '#4285F4', '#EA4335', '#FBBC05']);
  assert.doesNotMatch(page, /\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb|color-mix)\(/, 'no colour written as a function');
  assert.doesNotMatch(
    page,
    /\b(bg|text|border|outline|ring|fill|stroke|from|via|to|accent|caret|decoration|shadow|divide|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black)\b/,
    'no colour from Tailwind’s own palette',
  );
  assert.doesNotMatch(
    page,
    /\b(bg|border|outline|ring|fill|stroke|from|via|to|accent|caret|decoration|shadow|divide|placeholder)-white\b/,
    'white only as the brand panel’s words (text-white)',
  );
  for (const [, alpha] of page.matchAll(/\btext-white\/([^\s'"`]+)/g)) {
    assert.ok(/^\d+$/.test(alpha) && Number(alpha) >= 80, `text-white/${alpha}: the brand panel’s words are at least 80 % white`);
  }
  assert.doesNotMatch(page, /opacity/, 'nothing is faded');
  assert.doesNotMatch(page, /tabIndex=\{?["']?[1-9]/, 'no positive tab order');
});

// A Tailwind class as its variants (md:, disabled:, [&:disabled]: ...) and its utility: split at the colons outside brackets.
function variantsAndUtility(word) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of word) {
    if (char === '[' || char === '(') depth += 1;
    if (char === ']' || char === ')') depth -= 1;
    if (char === ':' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  return { variants: parts, utility: current };
}

test('a disabled or busy button keeps its look: only its pointer changes, and nothing on the page is filtered', () => {
  const words = literals(PAGE)
    .flatMap((text) => text.split(/\s+/))
    .filter((word) => word !== '');
  for (const word of words) {
    const { variants, utility } = variantsAndUtility(word);
    if (variants.some((variant) => /disabled|enabled|busy/i.test(variant))) {
      assert.equal(word, 'disabled:cursor-not-allowed', `${word}: a disabled or busy button changes only its pointer`);
    }
    assert.doesNotMatch(
      utility.replace(/^[!-]+/, ''),
      /^(filter|backdrop|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|blur|drop-shadow)(-|$)|^\[[^\]]*filter\s*:/,
      `${word}: nothing is filtered`,
    );
  }
  assert.doesNotMatch(code(PAGE), /\b(filter|backdropFilter|WebkitFilter|WebkitBackdropFilter)\s*:/, 'no filter in a style');
});

test('Core’s module card lists the sign-in screen', () => {
  const lines = read('apps/api/src/modules/core/MODULE.md').split('\n');
  const screens = lines.indexOf('## Screens');
  assert.ok(screens > 0, 'a Screens section');
  assert.equal(lines[screens + 1], '- SCR-001 Sign in (frontend, apps/web/src/modules/core/)');
  assert.ok(!lines.includes('- (Release 1 screens come with steps 2.4 to 2.7)'));
});

test('the end-to-end API uses infra/.env.test, and a fresh nexus_test with the test person is made before the tests', () => {
  const config = read('playwright.config.ts');
  assert.match(config, /^import \{ endToEndSettings \} from '\.\/tests\/e2e\/e2e-database\.js';$/m);
  assert.match(config, /globalSetup: '\.\/tests\/e2e\/e2e-database\.ts',/);
  assert.match(config, /env: \{ \.\.\.endToEndSettings\(\), LOG_LEVEL: 'warn' \},/);
});
