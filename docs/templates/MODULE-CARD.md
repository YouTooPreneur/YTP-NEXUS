# <Module name> module card

**Floor:** <ground / 1 / 2 / 3 / 4 / Academy> · **Owns the schema:** `<schema>` · **First release:** <n>

Every module is built from the same 6 parts (TECH-DESIGN section 2). If it is not on this card, the module does not do it. The verify command's module-card check reads this file: every API door's `operationId` must be listed under **Window**, and every announcement under **Announcements**, each as a list item that starts with the name in backticks. From TASK-0089 the reverse is checked too: every such item must be a door or announcement this module already has, so each line is added by the card that builds that door or announcement, never in advance.

## Data
- `<schema.table>`: <what one row is> (DATA-MODEL <section>)

## Rules
- <rule, with its requirement ID>

## Screens
- <SCR-xxx name> (frontend, `apps/web/src/modules/<module>/`)

## Window
- `<operationId>`: <method and path>, <permission or "public">, <feature key>

## Announcements
- `<module.record.event>`: <when it is posted, who listens>
- (none yet)

## Night checklist
- <scheduled job, its time in Asia/Kolkata, and what it checks>
- (none yet)
