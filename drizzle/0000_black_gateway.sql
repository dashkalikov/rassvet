CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text NOT NULL,
	`billing` text NOT NULL,
	`address` text NOT NULL,
	`monthly_price` integer NOT NULL,
	`equipment_price` integer NOT NULL,
	`first_payment` integer NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
