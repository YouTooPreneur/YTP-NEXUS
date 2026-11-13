CREATE TABLE "core"."idempotency_keys" (
	"company_id" uuid NOT NULL,
	"key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"result" jsonb,
	"expires_at" timestamp with time zone DEFAULT now() + interval '24 hours' NOT NULL,
	CONSTRAINT "idempotency_keys_company_id_key_pk" PRIMARY KEY("company_id","key")
);
--> statement-breakpoint
ALTER TABLE "core"."idempotency_keys" ADD CONSTRAINT "idempotency_keys_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;