CREATE TABLE "cakes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"quantity" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cakes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"waitlist_id" integer NOT NULL,
	"cake_id" integer NOT NULL,
	"phone" text NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"cake_id" integer NOT NULL,
	"delta" integer NOT NULL,
	"type" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"cake_id" integer NOT NULL,
	"phone" text NOT NULL,
	"name" text,
	"consent" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notified_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_waitlist_id_waitlist_id_fk" FOREIGN KEY ("waitlist_id") REFERENCES "public"."waitlist"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_cake_id_cakes_id_fk" FOREIGN KEY ("cake_id") REFERENCES "public"."cakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_events" ADD CONSTRAINT "stock_events_cake_id_cakes_id_fk" FOREIGN KEY ("cake_id") REFERENCES "public"."cakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_cake_id_cakes_id_fk" FOREIGN KEY ("cake_id") REFERENCES "public"."cakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_cake_phone_waiting" ON "waitlist" USING btree ("cake_id","phone") WHERE status = 'waiting';