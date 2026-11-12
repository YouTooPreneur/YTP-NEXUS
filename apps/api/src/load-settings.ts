// The start commands import this file first, so infra/.env is read before any other file loads: every
// import runs before the importing file's own lines (TECH-DESIGN section 12 point 46).
import { loadSettingsFile } from './settings-file.js';

loadSettingsFile();
