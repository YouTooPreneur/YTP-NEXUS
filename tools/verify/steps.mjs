import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { packageOf, readLock } from './lib.mjs';
import { checkTestLock } from './checks/test-lock.mjs';
import {
  readAllowedFiles,
  readStartPoint,
  changedFiles,
  checkAllowedFiles,
  commitProblems,
} from './checks/allowed-files.mjs';
import { compareRoutesToContracts } from './checks/contract.mjs';
import { checkDoors } from './checks/doors.mjs';
import { checkModuleCards } from './checks/module-cards.mjs';

function getRoutesData(ctx) {
  if (ctx.routesData) {
    return ctx.routesData;
  }
  const res = spawnSync('pnpm', ['--filter', '@ytp/api', '--silent', 'routes:list'], {
    cwd: ctx.root,
    shell: true,
    encoding: 'utf8',
  });
  if (res.status !== 0 || !res.stdout) {
    throw new Error(
      res.stderr ? res.stderr.trim() : `routes:list failed with status ${res.status}`,
    );
  }
  const data = JSON.parse(res.stdout);
  ctx.routesData = data;
  return data;
}

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
          'utf8',
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
          },
        );
        if (res.status !== 0) {
          allOk = false;
        }
      }
      return { ok: allOk };
    },
  },
  {
    name: 'Lint',
    run(ctx) {
      const res = spawnSync('pnpm', ['lint'], {
        cwd: ctx.root,
        shell: true,
        stdio: 'inherit',
      });
      return { ok: res.status === 0 };
    },
  },
  {
    name: 'Format',
    run(ctx) {
      const res = spawnSync('pnpm', ['format:check'], {
        cwd: ctx.root,
        shell: true,
        stdio: 'inherit',
      });
      return { ok: res.status === 0 };
    },
  },
  {
    name: 'Architecture',
    run(ctx) {
      const res = spawnSync('pnpm', ['depcruise'], {
        cwd: ctx.root,
        shell: true,
        stdio: 'inherit',
      });
      return { ok: res.status === 0 };
    },
  },
  {
    name: 'Contract',
    run(ctx) {
      const data = getRoutesData(ctx);
      const openapiPath = path.join(ctx.root, 'packages', 'contracts', 'openapi.json');
      const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
      const problems = compareRoutesToContracts(data.routes, openapi);
      if (problems.length > 0) {
        return { ok: false, note: problems.join('; ') };
      }
      return { ok: true };
    },
  },
  {
    name: 'Doors',
    run(ctx) {
      const data = getRoutesData(ctx);
      const authRoutesPath = path.join(ctx.root, 'tools', 'verify', 'auth-routes.json');
      const allowedAuthRoutes = JSON.parse(fs.readFileSync(authRoutesPath, 'utf8'));
      const problems = checkDoors({
        routes: data.routes,
        authRoutes: data.authRoutes,
        allowedAuthRoutes,
      });
      if (problems.length > 0) {
        return { ok: false, note: problems.join('; ') };
      }
      return { ok: true };
    },
  },
  {
    name: 'Module cards',
    run(ctx) {
      const data = getRoutesData(ctx);
      const modulesDir = path.join(ctx.root, 'apps', 'api', 'src', 'modules');
      const modules = [];
      if (fs.existsSync(modulesDir)) {
        const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const cardPath = path.join(modulesDir, entry.name, 'MODULE.md');
            const card = fs.existsSync(cardPath) ? fs.readFileSync(cardPath, 'utf8') : null;
            modules.push({ name: entry.name, card });
          }
        }
      }
      const problems = checkModuleCards({
        modules,
        routes: data.routes,
        announcements: data.announcements,
      });
      if (problems.length > 0) {
        return { ok: false, note: problems.join('; ') };
      }
      return { ok: true };
    },
  },
  {
    name: 'Test lock',
    run(ctx) {
      const lockPath = path.join(ctx.root, 'tests', 'LOCK');
      const lockContent = fs.readFileSync(lockPath, 'utf8');
      const entries = readLock(lockContent);
      const problems = checkTestLock(ctx.root, entries);
      if (problems.length > 0) {
        return { ok: false, note: problems.join(', ') };
      }
      return { ok: true };
    },
  },
  {
    name: 'Set-up tests',
    run(ctx) {
      const setupFiles = ctx.selected.filter((f) => f.startsWith('tests/setup/'));
      if (setupFiles.length === 0) {
        return { ok: true, note: 'no set-up tests to run' };
      }
      const res = spawnSync('node', ['--test', ...setupFiles], {
        cwd: ctx.root,
        shell: true,
        stdio: 'inherit',
      });
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

        const res = spawnSync('pnpm', ['--filter', pkgName, 'exec', 'vitest', 'run', ...relFiles], {
          cwd: ctx.root,
          shell: true,
          stdio: 'inherit',
        });
        if (res.status !== 0) {
          allOk = false;
        }
      }
      return { ok: allOk };
    },
  },
  {
    name: 'End-to-end smoke',
    run(ctx) {
      const e2eFiles = ctx.selected.filter((f) => f.startsWith('tests/e2e/'));
      if (e2eFiles.length === 0) {
        return { ok: true, note: 'no end-to-end tests to run' };
      }
      const res = spawnSync(
        'pnpm',
        ['exec', 'playwright', 'test', '--grep', '@smoke', ...e2eFiles],
        {
          cwd: ctx.root,
          shell: true,
          stdio: 'inherit',
        },
      );
      return { ok: res.status === 0 };
    },
  },
  {
    name: 'Allowed files',
    run(ctx) {
      if (!ctx.card) {
        return { ok: true, note: 'only with --card' };
      }
      const logPath = path.join(ctx.root, 'docs', 'logs', `${ctx.card}.md`);
      if (!fs.existsSync(logPath)) {
        return { ok: false, note: `no start point in docs/logs/${ctx.card}.md` };
      }
      const logContent = fs.readFileSync(logPath, 'utf8');
      const startPoint = readStartPoint(logContent);
      if (!startPoint) {
        return { ok: false, note: `no start point in docs/logs/${ctx.card}.md` };
      }
      const cardPath = path.join(ctx.root, 'docs', 'tasks', `${ctx.card}.md`);
      const cardContent = fs.readFileSync(cardPath, 'utf8');
      const allowed = readAllowedFiles(cardContent);
      const changed = changedFiles(ctx.root, startPoint, ctx.card);
      const violations = checkAllowedFiles({ changed, allowed, card: ctx.card });
      const commits = commitProblems(ctx.root, startPoint);
      const parts = [];
      if (violations.length > 0) {
        parts.push(`not allowed: ${violations.join(', ')}`);
      }
      if (commits.length > 0) {
        parts.push(...commits);
      }
      if (parts.length > 0) {
        return { ok: false, note: parts.join('; ') };
      }
      return { ok: true };
    },
  },
];
