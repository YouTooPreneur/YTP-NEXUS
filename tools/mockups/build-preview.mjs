#!/usr/bin/env node
// Builds the clickable-preview home page from docs/design/mockups/preview-hub.src.html:
//   preview-hub.html  page body for the private online link (the publish step adds <html>, <head>, <body>)
//   index.html        the same page as a full document, for opening on this computer and from the tracker
// The YouTooPreneur icon (assets/brand/icon.svg) is inlined in place of __LOGO__.
// Run: node tools/mockups/build-preview.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dir = join(root, 'docs', 'design', 'mockups');
const src = readFileSync(join(dir, 'preview-hub.src.html'), 'utf8');
const svg = readFileSync(join(root, 'assets', 'brand', 'icon.svg'), 'utf8')
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace(/fill="#03FF96"/, 'fill="currentColor" role="img" aria-label="YouTooPreneur"')
  .trim();
const body = src.replace('__LOGO__', () => svg);
writeFileSync(join(dir, 'preview-hub.html'), body);

const title = (body.match(/<title>[\s\S]*?<\/title>/) || ['<title>Nexus Screen Preview</title>'])[0];
const style = (body.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
const rest = body.replace(title, '').replace(style, '').replace(/<link [^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '').trim(); // the fonts go once, in the head
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">';
writeFileSync(join(dir, 'index.html'), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${title}\n${fonts}\n${style}\n</head>\n<body>\n${rest}\n</body>\n</html>\n`);

// The screen viewer (viewer.html): the same list of screens, by batch, beside a frame that shows the chosen screen.
// It reads the batches and rows of preview-hub.src.html, so the two never disagree.
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const batches = [...src.matchAll(/<section class="batch">([\s\S]*?)<\/section>/g)].map(([, sec]) => ({
  title: text((sec.match(/<h2>([\s\S]*?)<\/h2>/) || ['', ''])[1]),
  rows: [...sec.matchAll(/<div class="row">([\s\S]*?)<\/div><\/div>/g)].map(([, row]) => ({
    id: text((row.match(/<span class="id">([\s\S]*?)<\/span>/) || ['', ''])[1]),
    name: text((row.match(/<b>([\s\S]*?)<\/b>/) || ['', ''])[1]),
    what: text((row.match(/<span class="what">([\s\S]*?)<\/span>/) || ['', ''])[1]),
    links: [...row.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(([, href, label]) => ({ href, label: text(label) })),
  })).filter((r) => r.links.length),
})).filter((b) => b.rows.length);
const template = readFileSync(join(root, 'tools', 'mockups', 'viewer.template.html'), 'utf8');
writeFileSync(join(dir, 'viewer.html'), template.replace('__LOGO__', () => svg).replace('__SCREENS__', () => JSON.stringify(batches)));
const count = batches.reduce((n, b) => n + b.rows.length, 0);
console.log(`preview home written: preview-hub.html (online) and index.html (this computer); viewer.html with ${count} rows (screens and extra views) in ${batches.length} batches`);
