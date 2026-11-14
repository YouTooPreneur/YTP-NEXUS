-- The four company tables of roles (DATA-MODEL 3.2): each gets the company row rule in its own change.
CALL core.add_company_rules('core.roles');
--> statement-breakpoint
CALL core.add_company_rules('core.role_permissions');
--> statement-breakpoint
CALL core.add_company_rules('core.role_hidden_fields');
--> statement-breakpoint
CALL core.add_company_rules('core.default_grants_applied');
--> statement-breakpoint
-- The app reads and keeps roles (a role is deleted by setting deleted_at, never removed), grants and removes permissions
-- and hidden fields, and registers the permission list (a system table) on every start.
GRANT SELECT, INSERT, UPDATE ON core.roles TO nexus_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON core.role_permissions TO nexus_app;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON core.role_hidden_fields TO nexus_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON core.permission_catalogue TO nexus_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON core.default_grants_applied TO nexus_app;
