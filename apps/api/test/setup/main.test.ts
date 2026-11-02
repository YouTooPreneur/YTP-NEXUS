// TASK-0010 · The API start command says "api listening" only when it really listens. Written by the planner; builders never edit this file.
import { afterEach, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:net';
import { fileURLToPath } from 'node:url';

const apiFolder = fileURLToPath(new URL('../../', import.meta.url));
const children: ChildProcess[] = [];
const blockers: Server[] = [];

afterEach(async () => {
  for (const child of children.splice(0)) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
  await Promise.all(blockers.splice(0).map(close));
});

function listenOnAnyPort(): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, () => resolve(server));
  });
}

function portOf(server: Server): number {
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('The test server has no port');
  return address.port;
}

function close(server: Server): Promise<void> {
  return new Promise((done) => server.close(() => done()));
}

// Starts `src/main.ts` the way `pnpm dev` does (through tsx), on the given port.
function startApi(port: number) {
  let text = '';
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    cwd: apiFolder,
    env: { ...process.env, PORT: String(port), LOG_LEVEL: 'info' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);
  child.stdout?.on('data', (chunk) => (text += String(chunk)));
  child.stderr?.on('data', (chunk) => (text += String(chunk)));
  const closed = new Promise<number | null>((resolve) => child.once('close', (code) => resolve(code)));
  return { output: () => text, closed };
}

async function waitUntil(check: () => boolean, ms: number): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (check()) return true;
    await new Promise((wait) => setTimeout(wait, 100));
  }
  return check();
}

describe('the API start command (src/main.ts)', () => {
  it('logs "api listening" with the port, and answers the health door, when the port is free', async () => {
    const probe = await listenOnAnyPort();
    const port = portOf(probe);
    await close(probe);
    const api = startApi(port);
    const listening = await waitUntil(() => api.output().includes('api listening'), 20_000);
    expect(listening, api.output()).toBe(true);
    expect(api.output()).toContain(String(port));
    const res = await fetch(`http://localhost:${port}/api/health`);
    expect(res.status).toBe(200);
  }, 30_000);

  it('stops with exit code 1, and never says "api listening", when the port is already taken', async () => {
    const blocker = await listenOnAnyPort();
    blockers.push(blocker);
    const api = startApi(portOf(blocker));
    const timeout = new Promise<'still running'>((resolve) => setTimeout(() => resolve('still running'), 20_000));
    const code = await Promise.race([api.closed, timeout]);
    expect(code, api.output()).toBe(1);
    expect(api.output()).toContain('api could not start');
    expect(api.output()).not.toContain('api listening');
  }, 30_000);
});
