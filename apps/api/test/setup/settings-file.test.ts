// TASK-0090 · Reading the settings file: the environment wins, a missing file is fine. Written by the planner; builders never edit this file.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSettingsFile, SETTINGS_FILE } from '../../src/settings-file.js';

const names = ['NEXUS_PROBE_ONE', 'NEXUS_PROBE_TWO'];
let dir = '';

afterEach(() => {
  for (const name of names) delete process.env[name];
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = '';
});

function settingsFile(text: string): string {
  dir = mkdtempSync(join(tmpdir(), 'nexus-settings-'));
  const path = join(dir, '.env');
  writeFileSync(path, text);
  return path;
}

describe('loadSettingsFile', () => {
  it('adds the settings that are not set yet', () => {
    loadSettingsFile(settingsFile('NEXUS_PROBE_ONE=from-file\n'));
    expect(process.env.NEXUS_PROBE_ONE).toBe('from-file');
  });

  it('never overwrites a setting that is already set', () => {
    process.env.NEXUS_PROBE_TWO = 'from-environment';
    loadSettingsFile(settingsFile('NEXUS_PROBE_TWO=from-file\n'));
    expect(process.env.NEXUS_PROBE_TWO).toBe('from-environment');
  });

  it('is fine when the file does not exist', () => {
    expect(() => loadSettingsFile(join(tmpdir(), 'no-such-folder-0090', '.env'))).not.toThrow();
  });

  it('reads infra/.env when it is given no path', () => {
    const read = vi.spyOn(process, 'loadEnvFile').mockImplementation(() => undefined);
    try {
      loadSettingsFile();
      expect(read).toHaveBeenCalledWith(SETTINGS_FILE);
    } finally {
      read.mockRestore();
    }
  });

  it('stops on any other problem, such as a folder in place of the file', () => {
    dir = mkdtempSync(join(tmpdir(), 'nexus-settings-'));
    expect(() => loadSettingsFile(dir)).toThrow();
  });
});
