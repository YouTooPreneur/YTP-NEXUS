-- The company row rule (TECH-DESIGN 5.1): a company table shows and takes only the rows of the company set for
-- the transaction (app.company_id), for reading and for writing, and binds even the table's owner. Every later
-- change that makes a company table calls this procedure once, so the rule is written in one place only.
CREATE PROCEDURE core.add_company_rules(target regclass)
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_attribute
     WHERE attrelid = target AND attname = 'company_id' AND atttypid = 'uuid'::regtype
       AND attnotnull AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION '% has no company_id uuid NOT NULL column', target;
  END IF;
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', target);
  EXECUTE format(
    'CREATE POLICY company_rows ON %s FOR ALL'
    ' USING (company_id = NULLIF(current_setting(''app.company_id'', true), '''')::uuid)'
    ' WITH CHECK (company_id = NULLIF(current_setting(''app.company_id'', true), '''')::uuid)',
    target
  );
END
$$;
