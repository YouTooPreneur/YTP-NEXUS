CREATE TYPE "audit"."actor_type" AS ENUM('person', 'automation', 'api', 'mcp', 'ai', 'system');--> statement-breakpoint
CREATE TABLE "audit"."activity_log" (
	"id" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,
	"company_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_type" "audit"."actor_type" NOT NULL,
	"actor_user_id" uuid,
	"actor_label" text,
	"module" text NOT NULL,
	"record_type" text NOT NULL,
	"record_id" uuid NOT NULL,
	"record_label" text NOT NULL,
	"action" text NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"client_id" uuid,
	"request_id" text
);
--> statement-breakpoint
ALTER TABLE "audit"."activity_log" ADD CONSTRAINT "activity_log_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_record_idx" ON "audit"."activity_log" USING btree ("company_id","module","record_type","record_id","at");--> statement-breakpoint
CREATE INDEX "activity_log_client_idx" ON "audit"."activity_log" USING btree ("company_id","client_id","at");--> statement-breakpoint
CREATE INDEX "activity_log_actor_idx" ON "audit"."activity_log" USING btree ("company_id","actor_user_id","at");--> statement-breakpoint
CREATE INDEX "activity_log_at_idx" ON "audit"."activity_log" USING btree ("company_id","at");