CREATE TYPE "core"."error_source" AS ENUM('api', 'worker');--> statement-breakpoint
CREATE TABLE "core"."error_events" (
	"id" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,
	"company_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" "core"."error_source" NOT NULL,
	"message" text NOT NULL,
	"request_id" text,
	"external_id" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid
);
--> statement-breakpoint
ALTER TABLE "core"."error_events" ADD CONSTRAINT "error_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;