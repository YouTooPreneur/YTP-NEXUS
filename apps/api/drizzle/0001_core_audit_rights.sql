-- Only the accounts reach Core's schemas (TECH-DESIGN 5.2). Each table gets its own grants in its own change.
REVOKE ALL ON SCHEMA core, audit FROM PUBLIC;
--> statement-breakpoint
GRANT USAGE ON SCHEMA core, audit TO nexus_app;
--> statement-breakpoint
-- A new function is never runnable by everyone: each change grants EXECUTE only to the account that needs it.
ALTER DEFAULT PRIVILEGES FOR ROLE nexus_owner REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
