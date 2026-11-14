CREATE TABLE "core"."rate_counters" (
	"bucket" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "rate_counters_bucket_window_start_pk" PRIMARY KEY("bucket","window_start")
);
