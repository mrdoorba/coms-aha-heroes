ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "employment_status" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "talenta_id" varchar(50);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_talenta_id" ON "users" USING btree ("talenta_id");