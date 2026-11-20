// Queues (TASK-0021, TECH-DESIGN 5.2): queueSql returns the SQL pg-boss runs to create one queue with default settings.
// Database changes and tests run it as nexus_owner.
export function queueSql(name: string): string {
  return `SELECT pgboss.create_queue('${name}', '{"policy":"standard"}'::jsonb);`;
}
