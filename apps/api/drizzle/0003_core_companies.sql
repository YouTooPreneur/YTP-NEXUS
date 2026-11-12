CREATE TYPE "core"."company_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TABLE "core"."companies" (
	"id" uuid PRIMARY KEY DEFAULT core.uuid_v7() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "core"."company_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
