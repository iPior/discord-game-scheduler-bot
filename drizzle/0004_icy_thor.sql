PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_meetups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`group_id` integer NOT NULL,
	`title` text NOT NULL,
	`time_text` text NOT NULL,
	`starts_at` integer,
	`proposed_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`reminder_sent_at` integer,
	`channel_id` text,
	`message_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_meetups`("id", "guild_id", "group_id", "title", "time_text", "starts_at", "proposed_by", "expires_at", "reminder_sent_at", "channel_id", "message_id", "created_at") SELECT "id", "guild_id", "group_id", "title", "time_text", "starts_at", "proposed_by", "expires_at", "reminder_sent_at", "channel_id", "message_id", "created_at" FROM `meetups`;--> statement-breakpoint
DROP TABLE `meetups`;--> statement-breakpoint
ALTER TABLE `__new_meetups` RENAME TO `meetups`;--> statement-breakpoint
PRAGMA foreign_keys=ON;