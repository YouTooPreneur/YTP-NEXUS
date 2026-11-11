// This computer's settings file, infra/.env (TECH-DESIGN section 12 point 46). The start commands read it
// first, through load-settings.ts; nothing that routes:list loads may (CR-012).
export const SETTINGS_FILE = new URL('../../../infra/.env', import.meta.url);

// Settings already in the environment win, and a missing file is fine: the end-to-end servers, the tests and
// GitHub's check run have none.
export function loadSettingsFile(path: string | URL = SETTINGS_FILE): void {
  try {
    process.loadEnvFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
}
