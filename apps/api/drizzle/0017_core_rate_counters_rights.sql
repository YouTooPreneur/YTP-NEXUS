-- core.rate_counters is a system table with no company (DATA-MODEL section 2): the app counts requests in it, on the
-- security pool. Nothing deletes counters yet: the first card with nightly work clears old windows and adds that right.
GRANT SELECT, INSERT, UPDATE ON core.rate_counters TO nexus_app;
