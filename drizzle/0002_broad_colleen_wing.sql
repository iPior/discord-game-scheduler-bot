ALTER TABLE `meetups` ADD `expires_at` integer;
--> statement-breakpoint
UPDATE `meetups` SET `expires_at` = `created_at` + 86400 WHERE `expires_at` IS NULL;
--> statement-breakpoint
CREATE TABLE `__new_meetups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`group_id` integer NOT NULL,
	`title` text NOT NULL,
	`time_text` text NOT NULL,
	`proposed_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`channel_id` text,
	`message_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_meetups` (`id`, `guild_id`, `group_id`, `title`, `time_text`, `proposed_by`, `expires_at`, `channel_id`, `message_id`, `created_at`)
SELECT `id`, `guild_id`, `group_id`, `title`, `time_text`, `proposed_by`, `expires_at`, `channel_id`, `message_id`, `created_at` FROM `meetups`;
--> statement-breakpoint
DROP TABLE `meetups`;
--> statement-breakpoint
ALTER TABLE `__new_meetups` RENAME TO `meetups`;
