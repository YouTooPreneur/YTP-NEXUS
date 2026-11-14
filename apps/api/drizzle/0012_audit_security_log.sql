CREATE TABLE "audit"."security_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit"."security_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"company_id" uuid,
	"seq" bigint NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"event" text NOT NULL,
	"user_id" uuid,
	"target_user_id" uuid,
	"record_type" text,
	"record_id" uuid,
	"ip" text,
	"user_agent" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_id" text,
	"prev_hash" text NOT NULL,
	"hash" text NOT NULL,
	CONSTRAINT "security_log_chain_seq_unique" UNIQUE NULLS NOT DISTINCT("company_id","seq")
);
--> statement-breakpoint
ALTER TABLE "audit"."security_log" ADD CONSTRAINT "security_log_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;