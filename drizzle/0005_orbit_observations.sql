CREATE TABLE `orbit_observations` (
	`norad` text NOT NULL,
	`epoch` text NOT NULL,
	`observed_at` text NOT NULL,
	`elements` text NOT NULL,
	PRIMARY KEY(`norad`, `epoch`)
);
