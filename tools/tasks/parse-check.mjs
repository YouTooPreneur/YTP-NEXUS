// Planner tool (14 Nov 2026): parse each given TypeScript or JavaScript file with TypeScript's own parser and report syntax errors only (no type checking).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(new URL('../../package.json', import.meta.url));
const ts = require('typescript');
let bad = 0;
for (const file of process.argv.slice(2)) {
  const text = readFileSync(file, 'utf8');
  // .tsx files hold JSX (the screen tests, from TASK-0049): parsed as TSX, never as plain TypeScript.
  const kind = /\.(mjs|cjs|js)$/.test(file)
    ? ts.ScriptKind.JS
    : file.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const problems = source.parseDiagnostics ?? [];
  if (problems.length === 0) {
    console.log(`ok   ${file}`);
  } else {
    bad += 1;
    for (const p of problems.slice(0, 3)) {
      const { line, character } = source.getLineAndCharacterOfPosition(p.start ?? 0);
      console.log(`FAIL ${file}:${line + 1}:${character + 1} ${ts.flattenDiagnosticMessageText(p.messageText, ' ')}`);
    }
  }
}
process.exit(bad ? 1 : 0);
