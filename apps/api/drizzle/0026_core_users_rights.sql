-- People and their preferences (DATA-MODEL 3.2): each table gets the company row rule in its own change.
CALL core.add_company_rules('core.users');
--> statement-breakpoint
CALL core.add_company_rules('core.user_preferences');
--> statement-breakpoint
-- A person signs in with Google, a password or both: always at least one, and nothing else.
ALTER TABLE core.users ADD CONSTRAINT users_signin_methods_check CHECK (cardinality(signin_methods) > 0 AND signin_methods <@ ARRAY['google', 'password']::text[]);
--> statement-breakpoint
-- The app reads, adds and changes people and their preferences, and never deletes them: people are never removed.
GRANT SELECT, INSERT, UPDATE ON core.users TO nexus_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON core.user_preferences TO nexus_app;
