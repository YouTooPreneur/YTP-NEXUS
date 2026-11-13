-- core.idempotency_keys is a company table (DATA-MODEL 3.4): the company row rule; the app reads, adds and updates
-- keys (a key whose 24 hours are over is claimed again) and deletes none.
CALL core.add_company_rules('core.idempotency_keys');
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON core.idempotency_keys TO nexus_app;
