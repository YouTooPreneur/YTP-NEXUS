-- core.error_events is a company table whose system errors have no company (DATA-MODEL 3.4): the company row rule is
-- added while company_id is briefly required (the table is empty), so the rule stays written only in the procedure.
ALTER TABLE core.error_events ALTER COLUMN company_id SET NOT NULL;
--> statement-breakpoint
CALL core.add_company_rules('core.error_events');
--> statement-breakpoint
ALTER TABLE core.error_events ALTER COLUMN company_id DROP NOT NULL;
--> statement-breakpoint
-- The app reads its own company's errors and adds errors only through the function. The system account adds them,
-- makes their IDs, reads the system rows and counts the companies.
GRANT SELECT ON core.error_events TO nexus_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON core.error_events TO nexus_system;
--> statement-breakpoint
GRANT USAGE, CREATE ON SCHEMA core TO nexus_system;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION core.uuid_v7() TO nexus_system;
--> statement-breakpoint
GRANT SELECT ON core.companies TO nexus_system;
--> statement-breakpoint
SET ROLE nexus_system;
--> statement-breakpoint
-- Adds one error under the transaction's company (none: a system error) and returns its ID. The message is the cleaned
-- one (safeErrorMessage), kept to its first 2000 characters.
CREATE FUNCTION core.record_error(p_source text, p_message text, p_request_id text) RETURNS uuid
LANGUAGE sql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  INSERT INTO core.error_events (company_id, source, message, request_id)
  VALUES (NULLIF(current_setting('app.company_id', true), '')::uuid, p_source::core.error_source, left(p_message, 2000),
    p_request_id)
  RETURNING id
$$;
--> statement-breakpoint
-- The newest system errors (no company), at most p_limit of them (1 to 500), for the platform operator's Monitoring
-- door. Refused once Nexus has a second company, until the platform operator is settled (TECH-DESIGN section 12).
CREATE FUNCTION core.system_errors(p_limit integer) RETURNS SETOF core.error_events
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF (SELECT count(*) FROM core.companies) > 1 THEN
    RAISE EXCEPTION 'system rows need the platform operator';
  END IF;
  RETURN QUERY SELECT * FROM core.error_events WHERE company_id IS NULL
    ORDER BY at DESC, id DESC LIMIT least(greatest(p_limit, 1), 500);
END
$$;
--> statement-breakpoint
-- The security log's system chain (no company), newest first: the entries before number p_before_seq (none: from the
-- newest), at most p_limit of them (1 to 500), for the platform operator's Logs door. Refused like core.system_errors.
CREATE FUNCTION core.system_security_entries(p_before_seq bigint, p_limit integer) RETURNS SETOF audit.security_log
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF (SELECT count(*) FROM core.companies) > 1 THEN
    RAISE EXCEPTION 'system rows need the platform operator';
  END IF;
  RETURN QUERY SELECT * FROM audit.security_log WHERE company_id IS NULL AND (p_before_seq IS NULL OR seq < p_before_seq)
    ORDER BY seq DESC LIMIT least(greatest(p_limit, 1), 500);
END
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION core.record_error(text, text, text) TO nexus_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION core.system_errors(integer) TO nexus_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION core.system_security_entries(bigint, integer) TO nexus_app;
--> statement-breakpoint
RESET ROLE;
