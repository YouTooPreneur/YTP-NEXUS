import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { packageOf } from './lib.mjs';

export const steps = [
  {
    name: 'API client',
    run(ctx) {
      const res = spawnSync('pnpm', ['api:generate'], {
        cwd: ctx.root,
        shell: true,
        stdio: 'inherit',
      });
      return { ok: res.status === 0 };
    },
  },
  {
    name: 'Type check',
    run(ctx) {
      const baseDirs = ['apps', 'packages'];
      const folders = [];
      for (const base of baseDirs) {
        const fullBase = path.join(ctx.root, base);
        if (!fs.existsSync(fullBase)) continue;
        const entries = fs.readdirSync(fullBase, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const folderRel = `${base}/${entry.name}`;
            const tsconfigPath = path.join(ctx.root, folderRel, 'tsconfig.json');
            if (fs.existsSync(tsconfigPath)) {
              folders.push(folderRel);
            }
          }
        }
      }
      folders.sort();

      let allOk = true;
      for (const folder of folders) {
        const tsconfigPath = path.join(ctx.root, folder, 'tsconfig.json');
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        const originalInclude = Array.isArray(tsconfig.include) ? tsconfig.include : [];

        const relTestFiles = ctx.selected
          .filter((f) => packageOf(f) === folder)
          .map((f) => f.slice(folder.length + 1));

        const verifyTsconfig = {
          extends: './tsconfig.json',
          include: [...originalInclude, ...relTestFiles],
        };

        const verifyTsconfigPath = path.join(ctx.root, folder, 'tsconfig.verify.json');
        fs.writeFileSync(
          verifyTsconfigPath,
          JSON.stringify(verifyTsconfig, null, 2) + '\n',
          'utf8'
        );

        const pkgJsonPath = path.join(ctx.root, folder, 'package.json');
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        const pkgName = pkgJson.name;

        const res = spawnSync(
          'pnpm',
          ['--filter', pkgName, 'exec', 'tsc', '-p', 'tsconfig.verify.json', '--noEmit'],
          {
            cwd: ctx.root,
            shell: true,
            stdio: 'inherit',
          }
        );
        if (res.status !== 0) {
          allOk = false;
        }
      }
      return { ok: allOk };
    },
  },
  {
    name: 'Set-up tests',
    run(ctx) {
      const setupFiles = ctx.selected.filter((f) => f.startsWith('tests/setup/'));
      if (setupFiles.length === 0) {
        return { ok: true, note: 'no set-up tests to run' };
      }
      const res = spawnSync(
        'node',
        ['--test', ...setupFiles],
        {
          cwd: ctx.root,
          shell: true,
          stdio: 'inherit',
        }
      );
      return { ok: res.status === 0 };
    },
  },
  {
    name: 'Unit and API tests',
    run(ctx) {
      const unitFiles = ctx.selected.filter((f) => packageOf(f) !== null);
      if (unitFiles.length === 0) {
        return { ok: true, note: 'no unit tests to run' };
      }

      const groups = new Map();
      for (const file of unitFiles) {
        const pkgFolder = packageOf(file);
        if (!groups.has(pkgFolder)) {
          groups.set(pkgFolder, []);
        }
        const relFile = file.slice(pkgFolder.length + 1);
        groups.get(pkgFolder).push(relFile);
      }

      let allOk = true;
      for (const [pkgFolder, relFiles] of groups) {
        const pkgJsonPath = path.join(ctx.root, pkgFolder, 'package.json');
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        const pkgName = pkgJson.name;

        const res = spawnSync(
          'pnpm',
          ['--filter', pkgName, 'exec', 'vitest', 'run', ...relFiles],
          {
            cwd: ctx.root,
            shell: true,
            stdio: 'inherit',
          }
        );
        if (res.status !== 0) {
          allOk = false;
        }
      }
      return { ok: allOk };
    },
  },
];
