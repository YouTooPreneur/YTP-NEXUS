// TASK-0014 · The database tests read infra/.env.test (TEST-PLAN section 4). Written by the planner; builders never edit this file.
// Settings already in the environment win. Loaded into every file of the db group (setupFiles); the run's
// set-up only reads the file, so the unit group never sees these settings.
export const TEST_SETTINGS_FILE = new URL('../../../../infra/.env.test', import.meta.url);

export function loadTestSettings(): void {
  try {
    process.loadEnvFile(TEST_SETTINGS_FILE);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('infra/.env.test is missing: make it from infra/.env (TEST-PLAN section 4)');
    }
    throw error;
  }
}

loadTestSettings();
