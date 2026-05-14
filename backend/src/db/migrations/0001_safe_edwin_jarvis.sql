CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`before_json` text,
	`after_json` text,
	`ip_addr` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_log_actor_idx` ON `audit_log` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_log_entity_idx` ON `audit_log` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `orders` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `products` ADD `sfda_id` text;--> statement-breakpoint
ALTER TABLE `products` ADD `deleted_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `products_sfda_id_unique` ON `products` (`sfda_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `deleted_at` integer;