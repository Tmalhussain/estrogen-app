CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`key_prefix` text NOT NULL,
	`key_hash` text NOT NULL,
	`scopes` text DEFAULT '[]' NOT NULL,
	`last_used_at` integer,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_hash_unique` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price_at_order` real NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'placed' NOT NULL,
	`subtotal` real NOT NULL,
	`delivery_fee` real DEFAULT 0 NOT NULL,
	`vat` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`delivery_option` text DEFAULT 'standard' NOT NULL,
	`payment_method` text DEFAULT 'mada' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `otp_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text NOT NULL,
	`code_hash` text NOT NULL,
	`verify_attempts` integer DEFAULT 0 NOT NULL,
	`verified_at` integer,
	`expires_at` integer NOT NULL,
	`ip` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `otp_attempts_phone_idx` ON `otp_attempts` (`phone_number`);--> statement-breakpoint
CREATE INDEX `otp_attempts_created_idx` ON `otp_attempts` (`created_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_ar` text DEFAULT '' NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`price` real NOT NULL,
	`old_price` real,
	`unit` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`reviews` integer DEFAULT 0 NOT NULL,
	`stock_count` integer DEFAULT 0 NOT NULL,
	`in_stock` integer DEFAULT true NOT NULL,
	`rx_required` integer DEFAULT false NOT NULL,
	`pregnancy_safe` integer DEFAULT true NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`pharmacist_note` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`sku` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `products_in_stock_idx` ON `products` (`in_stock`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`delta` integer NOT NULL,
	`after_stock` integer NOT NULL,
	`source` text NOT NULL,
	`api_key_id` text,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `stock_movements_product_idx` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text,
	`phone_verified_at` integer,
	`email` text,
	`password_hash` text,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`firebase_uid` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_number_unique` ON `users` (`phone_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_firebase_uid_unique` ON `users` (`firebase_uid`);--> statement-breakpoint
CREATE INDEX `users_phone_idx` ON `users` (`phone_number`);