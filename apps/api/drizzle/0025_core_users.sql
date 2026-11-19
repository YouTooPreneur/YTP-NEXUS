CREATE TYPE "core"."theme_colour" AS ENUM('emerald', 'navy');--> statement-breakpoint
CREATE TYPE "core"."clock_format" AS ENUM('h12', 'h24');--> statement-breakpoint
CREATE TABLE "core"."user_preferences" (
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"language_code" text,
	"colour" "core"."theme_colour",
	"time_zone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"time_format" "core"."clock_format" DEFAULT 'h12' NOT NULL,
	"date_format" text DEFAULT 'DD MMM YYYY' NOT NULL,
	"daily_summary_time" time,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_company_id_user_id_pk" PRIMARY KEY("company_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "core"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"photo_file_id" uuid,
	"role_id" uuid NOT NULL,
	"signin_methods" text[] NOT NULL,
	"manager_user_id" uuid,
	"switch_email_by" date,
	"last_signin_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"purged_at" timestamp with time zone,
	CONSTRAINT "users_company_id_id_unique" UNIQUE("company_id","id")
);
--> statement-breakpoint
ALTER TABLE "core"."user_preferences" ADD CONSTRAINT "user_preferences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."user_preferences" ADD CONSTRAINT "user_preferences_company_id_user_id_users_company_id_id_fk" FOREIGN KEY ("company_id","user_id") REFERENCES "core"."users"("company_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."users" ADD CONSTRAINT "users_company_id_role_id_roles_company_id_id_fk" FOREIGN KEY ("company_id","role_id") REFERENCES "core"."roles"("company_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."users" ADD CONSTRAINT "users_company_id_manager_user_id_users_company_id_id_fk" FOREIGN KEY ("company_id","manager_user_id") REFERENCES "core"."users"("company_id","id") ON DELETE restrict ON UPDATE no action;