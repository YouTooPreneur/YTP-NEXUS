CREATE TABLE "core"."event_receipts" (
	"listener" text NOT NULL,
	"event_id" uuid NOT NULL,
	"handled_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_receipts_listener_event_id_pk" PRIMARY KEY("listener","event_id")
);
--> statement-breakpoint
CREATE TABLE "core"."outbox" (
	"id" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,
	"company_id" uuid NOT NULL,
	"event" text NOT NULL,
	"event_version" smallint NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."event_receipts" ADD CONSTRAINT "event_receipts_event_id_outbox_id_fk" FOREIGN KEY ("event_id") REFERENCES "core"."outbox"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."outbox" ADD CONSTRAINT "outbox_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outbox_waiting_idx" ON "core"."outbox" USING btree ("company_id","id") WHERE "core"."outbox"."published_at" IS NULL;