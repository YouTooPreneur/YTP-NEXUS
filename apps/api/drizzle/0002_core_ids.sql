-- Time-ordered unique IDs (UUID version 7) for the tables' own id keys (DATA-MODEL section 2): the first 48 bits
-- are the time in milliseconds, then the version (7), then random bits.
CREATE FUNCTION core.uuid_v7() RETURNS uuid
LANGUAGE sql VOLATILE PARALLEL SAFE
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT encode(set_bit(set_bit(overlay(uuid_send(gen_random_uuid())
    PLACING substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3)
    FROM 1 FOR 6), 52, 1), 53, 1), 'hex')::uuid
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION core.uuid_v7() TO nexus_app;
