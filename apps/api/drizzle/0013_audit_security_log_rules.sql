-- audit.security_log is a company table whose system chain has no company (DATA-MODEL 3.3): the company row rule is
-- added while company_id is briefly required (the table is empty), so the rule stays written only in the procedure.
ALTER TABLE audit.security_log ALTER COLUMN company_id SET NOT NULL;
--> statement-breakpoint
CALL core.add_company_rules('audit.security_log');
--> statement-breakpoint
ALTER TABLE audit.security_log ALTER COLUMN company_id DROP NOT NULL;
--> statement-breakpoint
-- Nobody changes or deletes an entry; only the owner account may empty the table (the tests do, before each run).
CREATE FUNCTION audit.security_log_refuse_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF TG_OP = 'TRUNCATE' AND current_user = 'nexus_owner' THEN
    RETURN NULL;
  END IF;
  RAISE EXCEPTION 'the security log cannot be changed';
END
$$;
--> statement-breakpoint
CREATE TRIGGER security_log_no_change BEFORE UPDATE OR DELETE ON audit.security_log
FOR EACH ROW EXECUTE FUNCTION audit.security_log_refuse_change();
--> statement-breakpoint
CREATE TRIGGER security_log_no_truncate BEFORE TRUNCATE ON audit.security_log
FOR EACH STATEMENT EXECUTE FUNCTION audit.security_log_refuse_change();
--> statement-breakpoint
-- The app reads its own company's entries and adds entries only through the function; the system account adds them.
GRANT SELECT ON audit.security_log TO nexus_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON audit.security_log TO nexus_system;
--> statement-breakpoint
GRANT USAGE, CREATE ON SCHEMA audit TO nexus_system;
--> statement-breakpoint
SET ROLE nexus_system;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
--> statement-breakpoint
-- An entry's fingerprint: SHA-256 of the chain's previous fingerprint and the entry's fields, in this fixed order, with
-- the time as UTC text. The nightly chain check (TASK-0061) uses the same function.
CREATE FUNCTION audit.security_log_hash(prev_hash text, company_id uuid, seq bigint, at timestamptz, event text,
  user_id uuid, target_user_id uuid, record_type text, record_id uuid, ip text, user_agent text, details jsonb,
  request_id text) RETURNS text
LANGUAGE sql STABLE
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT encode(sha256(convert_to(jsonb_build_array(prev_hash, company_id, seq,
    to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), event, user_id, target_user_id, record_type,
    record_id, ip, user_agent, details, request_id)::text, 'UTF8')), 'hex')
$$;
--> statement-breakpoint
-- Adds one entry to the chain of the transaction's company (the system chain when it has none): takes the chain's lock
-- until the transaction ends (waiting at most 5 seconds), reads the chain's last entry and adds the next.
CREATE FUNCTION audit.add_security_entry(p_event text, p_user_id uuid, p_target_user_id uuid, p_record_type text,
  p_record_id uuid, p_ip text, p_user_agent text, p_details jsonb, p_request_id text) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
SET lock_timeout = '5s'
AS $$
DECLARE
  chain uuid := NULLIF(current_setting('app.company_id', true), '')::uuid;
  last_seq bigint;
  last_hash text;
  new_at timestamptz;
  new_id bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('audit.security_log'), hashtext(coalesce(chain::text, 'system')));
  IF chain IS NULL THEN
    SELECT seq, hash INTO last_seq, last_hash FROM audit.security_log
     WHERE company_id IS NULL ORDER BY seq DESC LIMIT 1;
  ELSE
    SELECT seq, hash INTO last_seq, last_hash FROM audit.security_log
     WHERE company_id = chain ORDER BY seq DESC LIMIT 1;
  END IF;
  last_seq := coalesce(last_seq, 0);
  last_hash := coalesce(last_hash, repeat('0', 64));
  new_at := clock_timestamp();
  INSERT INTO audit.security_log (company_id, seq, at, event, user_id, target_user_id, record_type, record_id, ip,
    user_agent, details, request_id, prev_hash, hash)
  VALUES (chain, last_seq + 1, new_at, p_event, p_user_id, p_target_user_id, p_record_type, p_record_id, p_ip,
    p_user_agent, coalesce(p_details, '{}'::jsonb), p_request_id, last_hash,
    audit.security_log_hash(last_hash, chain, last_seq + 1, new_at, p_event, p_user_id, p_target_user_id, p_record_type,
      p_record_id, p_ip, p_user_agent, coalesce(p_details, '{}'::jsonb), p_request_id))
  RETURNING id INTO new_id;
  RETURN new_id;
END
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION audit.add_security_entry(text, uuid, uuid, text, uuid, text, text, jsonb, text) TO nexus_app;
--> statement-breakpoint
RESET ROLE;
