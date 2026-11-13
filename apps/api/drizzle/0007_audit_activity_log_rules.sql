-- audit.activity_log is a company table (DATA-MODEL 3.3): the company row rule, and the app may only add and read
-- entries; no account may change or delete one except through the delete-on-request path (TASK-0025).
CALL core.add_company_rules('audit.activity_log');
--> statement-breakpoint
GRANT SELECT, INSERT ON audit.activity_log TO nexus_app;
