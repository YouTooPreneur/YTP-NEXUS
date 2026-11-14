-- core.outbox is a company table (DATA-MODEL 3.3): its company row rule, in its own change.
CALL core.add_company_rules('core.outbox');
--> statement-breakpoint
-- The app posts announcements in a save, and the worker marks each delivered or failed: it may read and add rows, and
-- change only the delivery columns, never an announcement's company, event or payload. Nothing deletes rows yet (the
-- first card with nightly work clears delivered announcements and adds that right).
GRANT SELECT, INSERT ON core.outbox TO nexus_app;
--> statement-breakpoint
GRANT UPDATE (published_at, attempts, last_error, next_attempt_at) ON core.outbox TO nexus_app;
--> statement-breakpoint
-- core.event_receipts is a system table (DATA-MODEL section 2): the worker records what each listener has handled, and
-- a receipt is never changed or deleted.
GRANT SELECT, INSERT ON core.event_receipts TO nexus_app;
