-- Better Auth's tables (DATA-MODEL 3.2) are system tables with no row rule: they are read before the company is known.
-- Only Core's sign-in and users code touches them (the wall check); the app reads, adds, changes and removes their rows.
GRANT USAGE ON SCHEMA auth TO nexus_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON auth."user", auth.session, auth.account, auth.verification TO nexus_app;
