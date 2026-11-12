import { Client, escapeIdentifier } from 'pg';

// The database accounts of TECH-DESIGN section 5.2, made or put right as the database administrator.
// Safe to run again and again: every run puts back exactly these rights, whatever was changed by hand.
// Passwords come from the DATABASE_URL_* settings and never appear in a statement's text, an error or
// the server's log (another session can read a statement's text while it runs).
type Settings = Record<string, string | undefined>;

const ROLES = ['nexus_owner', 'nexus_app', 'nexus_system', 'nexus_backup'];
const SIGN_IN = [
  { role: 'nexus_owner', setting: 'DATABASE_URL_OWNER' },
  { role: 'nexus_app', setting: 'DATABASE_URL_APP' },
  { role: 'nexus_backup', setting: 'DATABASE_URL_BACKUP' },
];
const ALWAYS = "INHERIT CONNECTION LIMIT -1 VALID UNTIL 'infinity'";
const ACCOUNTS = "('nexus_owner', 'nexus_app', 'nexus_system', 'nexus_backup')";
const RIGHTS = [
  `ALTER ROLE nexus_owner WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS ${ALWAYS}`,
  `ALTER ROLE nexus_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS ${ALWAYS}`,
  `ALTER ROLE nexus_system WITH NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS PASSWORD NULL ${ALWAYS}`,
  `ALTER ROLE nexus_backup WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE REPLICATION BYPASSRLS ${ALWAYS}`,
  // Every membership of or in the accounts goes (whoever granted it), and every setting of theirs, then
  // exactly the three memberships of TECH-DESIGN 5.2 come back. One transaction, so no gap is ever seen.
  `DO $$ DECLARE r record; BEGIN
     FOR r IN SELECT a.roleid::regrole AS role, a.member::regrole AS member, a.grantor::regrole AS grantor
                FROM pg_auth_members a
               WHERE a.roleid::regrole::text IN ${ACCOUNTS} OR a.member::regrole::text IN ${ACCOUNTS}
     LOOP EXECUTE format('REVOKE %s FROM %s GRANTED BY %s CASCADE', r.role, r.member, r.grantor); END LOOP;
     FOR r IN SELECT s.setrole::regrole AS role, d.datname FROM pg_db_role_setting s
                LEFT JOIN pg_database d ON d.oid = s.setdatabase
               WHERE s.setrole::regrole::text IN ${ACCOUNTS}
     LOOP
       IF r.datname IS NULL THEN EXECUTE format('ALTER ROLE %s RESET ALL', r.role);
       ELSE EXECUTE format('ALTER ROLE %s IN DATABASE %I RESET ALL', r.role, r.datname);
       END IF;
     END LOOP;
   END $$`,
  'GRANT pg_monitor TO nexus_app WITH INHERIT TRUE, SET TRUE',
  'GRANT pg_read_all_data TO nexus_backup WITH INHERIT TRUE, SET TRUE',
  'GRANT nexus_system TO nexus_owner WITH INHERIT FALSE, SET TRUE',
];

function address(settings: Settings, name: string): URL {
  const value = settings[name];
  if (!value) throw new Error(`${name} is not set`);
  if (!URL.canParse(value)) throw new Error(`${name} is not a database address`);
  return new URL(value);
}

export async function ensureAccounts(
  settings: Settings = process.env,
): Promise<{ database: string; roles: string[] }> {
  const owner = address(settings, 'DATABASE_URL_OWNER');
  const database = owner.pathname.slice(1);
  if (!/^[a-z_][a-z0-9_]*$/.test(database)) {
    throw new Error('DATABASE_URL_OWNER must name a database in small letters, digits and _');
  }
  const passwords = SIGN_IN.map(({ role, setting }) => {
    const url = address(settings, setting);
    if (url.host !== owner.host || url.pathname !== owner.pathname) {
      throw new Error(`${setting} must use the same server and database as DATABASE_URL_OWNER`);
    }
    if (url.username !== role) throw new Error(`${setting} must sign in as ${role}`);
    if (!url.password) throw new Error(`${setting} has no password`);
    return { role, password: decodeURIComponent(url.password) };
  });
  if (!settings.POSTGRES_SUPERUSER_PASSWORD) {
    throw new Error('POSTGRES_SUPERUSER_PASSWORD is not set');
  }

  const admin = new Client({
    host: owner.hostname,
    port: Number(owner.port) || 5432,
    user: 'postgres',
    password: settings.POSTGRES_SUPERUSER_PASSWORD,
    database: 'postgres',
  });
  await admin.connect();
  try {
    // The server's log never shows a value sent with a statement (log_statement = 'all' or
    // log_min_duration_statement would otherwise write the passwords given to set_config).
    await admin.query('SET log_parameter_max_length = 0');
    // One run at a time: the accounts belong to the whole server, which every builder copy shares.
    // The lock ends with the connection.
    await admin.query("SELECT pg_advisory_lock(hashtext('nexus database accounts'))");
    const found = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (found.rowCount === 0) await admin.query(`CREATE DATABASE ${escapeIdentifier(database)}`);
    await admin.query('BEGIN');
    for (const role of ROLES) {
      await admin.query(
        `DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN CREATE ROLE ${role}; END IF; END $$`,
      );
    }
    for (const statement of RIGHTS) await admin.query(statement);
    for (const { role, password } of passwords) {
      await admin.query("SELECT set_config('nexus.password', $1, true)", [password]);
      // If the inner statement fails, its text (with the password) would be in the error's context:
      // raise a new error that names only the account.
      await admin.query(
        `DO $$ BEGIN EXECUTE format('ALTER ROLE ${role} PASSWORD %L', current_setting('nexus.password'));
         EXCEPTION WHEN OTHERS OR query_canceled THEN RAISE EXCEPTION 'could not set the password of ${role}: %', SQLERRM;
         END $$`,
      );
    }
    await admin.query("SELECT set_config('nexus.password', '', true)");
    // The database belongs to the administrator and has no settings of its own, whatever was changed by
    // hand (an owner keeps every right on the database and its public schema).
    const name = escapeIdentifier(database);
    await admin.query(`ALTER DATABASE ${name} OWNER TO postgres`);
    await admin.query(`ALTER DATABASE ${name} RESET ALL`);
    // Every right on the database goes from everyone but its owner; then only the accounts get theirs.
    await admin.query(
      `DO $$ DECLARE g record; BEGIN
         FOR g IN SELECT DISTINCT a.grantee FROM pg_database d, aclexplode(d.datacl) a
                   WHERE d.datname = '${database}' AND a.grantee <> d.datdba
         LOOP EXECUTE format('REVOKE ALL ON DATABASE %I FROM %s CASCADE', '${database}',
                CASE WHEN g.grantee = 0 THEN 'PUBLIC' ELSE g.grantee::regrole::text END);
         END LOOP;
       END $$`,
    );
    await admin.query(`REVOKE ALL ON DATABASE ${name} FROM PUBLIC`);
    await admin.query(`GRANT CONNECT, CREATE ON DATABASE ${name} TO nexus_owner`);
    await admin.query(`GRANT CONNECT ON DATABASE ${name} TO nexus_app, nexus_backup`);
    await admin.query('COMMIT');
  } catch (error) {
    await admin.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await admin.end();
  }
  return { database, roles: ROLES };
}
