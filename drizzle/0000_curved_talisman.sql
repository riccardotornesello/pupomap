CREATE TABLE `pupi` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`imageUrl` text NOT NULL,
	`artist` text NOT NULL,
	`theme` text NOT NULL
);
