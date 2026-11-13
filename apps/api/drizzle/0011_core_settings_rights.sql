-- core.settings is a company table (DATA-MODEL 3.1): the company row rule; the app reads, adds and changes values and
-- deletes none (a setting goes back to its default by saving the default).
CALL core.add_company_rules('core.settings');
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON core.settings TO nexus_app;
