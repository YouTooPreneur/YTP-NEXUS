-- Removing personal values on request (TASK-0025, DPDP, NFR-010): the system account may read activity entries and change
-- only their changes and record label, and only through core.erase_personal_values, which the app runs from the Owner's
-- deletion-request action. No other account may change an entry.
GRANT SELECT, UPDATE (changes, record_label) ON audit.activity_log TO nexus_system;
--> statement-breakpoint
SET ROLE nexus_system;
--> statement-breakpoint
-- In the transaction's company, every activity entry of one record: its label, and the old and new values of each field
-- named in p_fields (a list of names), become '[removed on request]'. Gives back how many entries changed.
CREATE FUNCTION core.erase_personal_values(p_record_type text, p_record_id uuid, p_fields jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  company uuid := NULLIF(current_setting('app.company_id', true), '')::uuid;
  removed constant jsonb := '{"old": "[removed on request]", "new": "[removed on request]"}'::jsonb;
  changed integer;
BEGIN
  IF company IS NULL THEN
    RAISE EXCEPTION 'the removal needs the company';
  END IF;
  IF jsonb_typeof(p_fields) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'the removal needs a list of field names';
  END IF;
  UPDATE audit.activity_log AS entry
     SET record_label = '[removed on request]',
         changes = (SELECT coalesce(jsonb_object_agg(key, CASE WHEN p_fields ? key THEN removed ELSE value END), '{}'::jsonb)
                      FROM jsonb_each(entry.changes))
   WHERE entry.company_id = company AND entry.record_type = p_record_type AND entry.record_id = p_record_id;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION core.erase_personal_values(text, uuid, jsonb) TO nexus_app;
--> statement-breakpoint
RESET ROLE;
