import { pgSchema } from 'drizzle-orm/pg-core';

// Core's two schemas (TECH-DESIGN section 3): `core` for its tables, `audit` for the activity and security logs.
export const core = pgSchema('core');
export const audit = pgSchema('audit');
