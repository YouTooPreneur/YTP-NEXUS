import { defineConfig } from 'drizzle-kit';

// `pnpm --filter @ytp/api db:generate` writes the database changes for the tables in the modules' schema
// files into ./drizzle (TECH-DESIGN section 5.3). The files are named as paths, never imported here.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/*/schema/*.ts',
  out: './drizzle',
});
