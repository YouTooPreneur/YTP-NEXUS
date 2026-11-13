-- core.companies is a system table (no company row rule): the app may only read it; the first-start command
-- (nexus_owner) makes its rows.
GRANT SELECT ON core.companies TO nexus_app;
