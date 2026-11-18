CREATE TABLE `access_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`actor_id` text,
	`old_role` text NOT NULL,
	`role` text NOT NULL,
	`old_blocked` integer NOT NULL,
	`blocked` integer NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `access_events_at_idx` ON `access_events` (`at`);
--> statement-breakpoint
CREATE TABLE `account_access` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`blocked` integer DEFAULT false NOT NULL,
	`changed_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `request_metrics` (
	`hour` text PRIMARY KEY NOT NULL,
	`requests` integer NOT NULL,
	`client_errors` integer NOT NULL,
	`server_errors` integer NOT NULL,
	`total_ms` integer NOT NULL,
	`max_ms` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`plan` text NOT NULL,
	`previous` text,
	`status` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `subscription_events_at_idx` ON `subscription_events` (`at`);
--> statement-breakpoint
INSERT INTO subscription_events (order_id, plan, previous, status, at)
SELECT id, plan, NULL, 'new', created_at FROM orders;
--> statement-breakpoint
CREATE TRIGGER subscription_opened AFTER INSERT ON orders
BEGIN
  INSERT INTO subscription_events (order_id, plan, previous, status, at)
  VALUES (NEW.id, NEW.plan, NULL, NEW.status, NEW.created_at);
END;
--> statement-breakpoint
CREATE TRIGGER subscription_changed AFTER UPDATE OF status ON orders
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO subscription_events (order_id, plan, previous, status, at)
  VALUES (NEW.id, NEW.plan, OLD.status, NEW.status, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
END;
--> statement-breakpoint
CREATE TRIGGER access_granted AFTER INSERT ON account_access
WHEN NEW.role <> 'customer' OR NEW.blocked <> 0
BEGIN
  INSERT INTO access_events (user_id, actor_id, old_role, role, old_blocked, blocked, at)
  VALUES (NEW.user_id, NEW.changed_by, 'customer', NEW.role, 0, NEW.blocked, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
  DELETE FROM sessions WHERE user_id = NEW.user_id;
END;
--> statement-breakpoint
CREATE TRIGGER access_changed AFTER UPDATE OF role, blocked ON account_access
WHEN OLD.role <> NEW.role OR OLD.blocked <> NEW.blocked
BEGIN
  INSERT INTO access_events (user_id, actor_id, old_role, role, old_blocked, blocked, at)
  VALUES (NEW.user_id, NEW.changed_by, OLD.role, NEW.role, OLD.blocked, NEW.blocked, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
  DELETE FROM sessions WHERE user_id = NEW.user_id;
END;
