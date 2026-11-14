CREATE TYPE "core"."permission_scope" AS ENUM('own', 'team', 'all');--> statement-breakpoint
CREATE TABLE "core"."default_grants_applied" (
	"company_id" uuid NOT NULL,
	"module" text NOT NULL,
	"action" text NOT NULL,
	"grants_version" smallint NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "default_grants_applied_company_id_module_action_pk" PRIMARY KEY("company_id","module","action")
);
--> statement-breakpoint
CREATE TABLE "core"."permission_catalogue" (
	"module" text NOT NULL,
	"action" text NOT NULL,
	"label" text NOT NULL,
	"hideable_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_grants" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"grants_version" smallint DEFAULT 1 NOT NULL,
	"release" smallint NOT NULL,
	CONSTRAINT "permission_catalogue_module_action_pk" PRIMARY KEY("module","action")
);
--> statement-breakpoint
CREATE TABLE "core"."role_hidden_fields" (
	"company_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"module" text NOT NULL,
	"field" text NOT NULL,
	CONSTRAINT "role_hidden_fields_company_id_role_id_module_field_pk" PRIMARY KEY("company_id","role_id","module","field")
);
--> statement-breakpoint
CREATE TABLE "core"."role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,
	"company_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"module" text NOT NULL,
	"action" text NOT NULL,
	"scope" "core"."permission_scope" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "role_permissions_company_role_action_unique" UNIQUE("company_id","role_id","module","action")
);
--> statement-breakpoint
CREATE TABLE "core"."roles" (
	"id" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,
	"company_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"two_step_required" boolean DEFAULT false NOT NULL,
	"idle_timeout_minutes" integer NOT NULL,
	"phone_menu" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "roles_company_id_id_unique" UNIQUE("company_id","id"),
	CONSTRAINT "roles_company_id_key_unique" UNIQUE("company_id","key")
);
--> statement-breakpoint
ALTER TABLE "core"."default_grants_applied" ADD CONSTRAINT "default_grants_applied_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."role_hidden_fields" ADD CONSTRAINT "role_hidden_fields_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."role_hidden_fields" ADD CONSTRAINT "role_hidden_fields_company_id_role_id_roles_company_id_id_fk" FOREIGN KEY ("company_id","role_id") REFERENCES "core"."roles"("company_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."role_permissions" ADD CONSTRAINT "role_permissions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."role_permissions" ADD CONSTRAINT "role_permissions_company_id_role_id_roles_company_id_id_fk" FOREIGN KEY ("company_id","role_id") REFERENCES "core"."roles"("company_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."roles" ADD CONSTRAINT "roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE restrict ON UPDATE no action;